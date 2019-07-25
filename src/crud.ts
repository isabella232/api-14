import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as S3 from 'aws-sdk/clients/s3';
import * as  SQS from 'aws-sdk/clients/sqs';
import Reattempt from 'reattempt';
import { v4 as uuid } from 'uuid';
import { EncryptedJson } from './encrypted-json';
import EnvironmentVariables from './env';
import { IAccount, IUser } from './model';
import { CreateAccountParams, UpdateAccountParams } from './request-types';

export interface ICreateResult {
  accountId: string;
  account: IAccount;
}

/**
 * Helper methods for interacting with the data model in the database.
 */
export default class Crud {
  private readonly documentClient: DynamoDB.DocumentClient;
  private readonly s3: S3;
  private readonly sqs: SQS;

  public constructor(documentClient: DynamoDB.DocumentClient, s3: S3, sqs: SQS) {
    this.documentClient = documentClient;
    this.s3 = s3;
    this.sqs = sqs;
  }

  /**
   * Send a message to the ENS registrar queue to register a user and pay out some amount of money
   * @param ensName name to register
   * @param address address to register
   * @param dollarsToSend the number of dollars to send
   */
  private async requestEnsRegistration(ensName: string, address: string, dollarsToSend: number): Promise<void> {
    await this.sqs.sendMessage({
      QueueUrl: EnvironmentVariables.ensRegistrarQueueUrl,
      MessageBody: JSON.stringify({
        ensName,
        address,
        dollarsToSend
      })
    });
  }

  /**
   * Return the current timestamp. Used for create/update operations.
   */
  private static now(): number {
    return (new Date().getTime());
  }

  /**
   * Get the account corresponding to a particular user ID and account ID
   * @param userId id of the user
   * @param accountId id of the user account
   */
  public async getAccount(userId: string, accountId: string): Promise<IAccount> {
    const user = await this.getOrCreateUser(userId);
    const account = user.accounts[ accountId.toLowerCase() ];

    if (!account) {
      throw new Error(`Account with ID ${accountId.toLowerCase()} does not exist`);
    }

    return account;
  }

  /**
   * Return the private data associated with an account.
   * @param accountId id of the account for which to fetch the private data
   */
  public async getAccountPrivateData(accountId: string): Promise<EncryptedJson> {
    const { Body } = await this.s3.getObject({
      Bucket: EnvironmentVariables.keysBucket,
      Key: accountId.toLowerCase()
    }).promise();

    if (!Body) {
      throw new Error(`Failed to get object with ID ${accountId} from S3`);
    }

    return JSON.parse(Body.toString('utf8'));
  }

  /**
   * Create and return a new user account
   * @param userId ID of the user for which to create the account
   * @param createAccountParams the parameters used to create an account
   */
  public async createAccount(userId: string, createAccountParams: CreateAccountParams): Promise<ICreateResult> {
    const isFirstAccount: boolean = Object.keys((await this.getOrCreateUser(userId)).accounts).length === 0;

    const accountId = uuid().toLowerCase();

    const now = Crud.now();

    const newAccount: Readonly<IAccount> = {
      name: createAccountParams.name,
      description: createAccountParams.description,
      version: 1,
      updated: now,
      created: now,
      archived: false,
      address: `0x${createAccountParams.encryptedJson.address.toLowerCase()}`,
      ...(createAccountParams.ensName ? { ensName: createAccountParams.ensName } : null)
    };

    // Put the encrypted JSON into S3 first.
    await this.s3.putObject({
      Body: JSON.stringify(createAccountParams.encryptedJson),
      Bucket: EnvironmentVariables.keysBucket,
      Key: accountId,
      ServerSideEncryption: 'AES256'
    }).promise();

    await this.documentClient.update({
      TableName: EnvironmentVariables.usersTable,
      Key: {
        id: userId
      },
      ConditionExpression: 'attribute_exists(#id) AND attribute_not_exists(#accounts.#accountId)',
      UpdateExpression: 'SET #accounts.#accountId = :newAccount, #updated = :now, #version = #version + :one',
      ExpressionAttributeNames: {
        '#id': 'id',
        '#accounts': 'accounts',
        '#accountId': accountId,
        '#updated': 'updated',
        '#version': 'version'
      },
      ExpressionAttributeValues: {
        ':now': now,
        ':one': 1,
        ':newAccount': newAccount
      }
    }).promise();

    if (newAccount.ensName) {
      await this.requestEnsRegistration(newAccount.ensName, newAccount.address, isFirstAccount ? 1 : 0);
    }

    return {
      accountId,
      account: newAccount
    };
  }

  /**
   * Mark an account archived.
   *
   * @param userId ID of the user that owns the account
   * @param accountId ID of the account
   * @param archived whether the account is archived or not
   */
  public async setArchived(userId: string, accountId: string, archived: boolean = true) {
    // Mark the account archived
    await this.documentClient.update({
      TableName: EnvironmentVariables.usersTable,
      Key: {
        id: userId
      },
      ConditionExpression: 'attribute_exists(#id) AND attribute_exists(#accounts.#accountId)',
      UpdateExpression: 'SET #accounts.#accountId.#archived = :archived, ' +
        '#accounts.#accountId.#updated = :now, ' +
        '#accounts.#accountId.#version = #accounts.#accountId.#version + :one, ' +
        '#updated = :now, #version = #version + :one',
      ExpressionAttributeNames: {
        '#id': 'id',
        '#accounts': 'accounts',
        '#accountId': accountId,
        '#archived': 'archived',
        '#updated': 'updated',
        '#version': 'version'
      },
      ExpressionAttributeValues: {
        ':archived': archived,
        ':now': Crud.now(),
        ':one': 1
      }
    }).promise();

    // Delete the key from the bucket
    await this.s3.deleteObject({
      Bucket: EnvironmentVariables.keysBucket,
      Key: accountId.toString(),
    });
  }

  /**
   * Get a user if it exists or create it if it does not exist and return the user.
   * @param userId ID of the user to get
   */
  public async getOrCreateUser(userId: string): Promise<IUser> {
    // We can safely retry this because the result is idempotent
    return Reattempt.run({ times: 3 }, async () => {
      const getResult = await this.documentClient.get({
        TableName: EnvironmentVariables.usersTable,
        Key: {
          id: userId
        },
        ConsistentRead: true,
      }).promise();


      if (!getResult.Item || getResult.Item.id !== userId) {
        const newUser: IUser = {
          id: userId,
          version: 1,
          created: Crud.now(),
          updated: Crud.now(),
          accounts: {}
        };

        await this.documentClient.put({
          TableName: EnvironmentVariables.usersTable,
          ConditionExpression: 'attribute_not_exists(#id)',
          ExpressionAttributeNames: {
            '#id': 'id'
          },
          Item: newUser,
        }).promise();

        return newUser;
      } else {
        return getResult.Item as IUser;
      }
    });
  }

  /**
   * Update the account settings
   * @param userId id of the user
   * @param accountId id of the account
   * @param updateParams updates to apply
   */
  public async updateAccountDetails(userId: string, accountId: string, updateParams: UpdateAccountParams): Promise<void> {
    // Update the account name and description
    await this.documentClient.update({
      TableName: EnvironmentVariables.usersTable,
      Key: {
        id: userId
      },
      ConditionExpression: 'attribute_exists(#id) AND ' +
        'attribute_exists(#accounts.#accountId) AND ' +
        '#accounts.#accountId.#archived = :false AND ' +
        '#accounts.#accountId.#version = :version',
      UpdateExpression: 'SET ' +
        '#accounts.#accountId.#name = :name, ' +
        '#accounts.#accountId.#description = :description, ' +
        '#accounts.#accountId.#updated = :now, ' +
        '#accounts.#accountId.#version = #accounts.#accountId.#version + :one, ' +
        '#updated = :now, ' +
        '#version = #version + :one',
      ExpressionAttributeNames: {
        '#id': 'id',
        '#accounts': 'accounts',
        '#accountId': accountId,
        '#name': 'name',
        '#description': 'description',
        '#archived': 'archived',
        '#updated': 'updated',
        '#version': 'version'
      },
      ExpressionAttributeValues: {
        ':false': false,
        ':name': updateParams.name,
        ':description': updateParams.description,
        ':version': updateParams.version,
        ':now': Crud.now(),
        ':one': 1
      }
    }).promise();
  }
}