import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import EnvironmentVariables from '../env';
import { IUser } from '../shapes/model';
import getCurrentTimestamp from './get-current-timestamp';

interface UserMigration {
  migrate(user: IUser): IUser;
}

const USER_MIGRATIONS: UserMigration[] = [
  // Identity migration so we get version numbers
  {
    migrate(user: IUser): IUser {
      return user;
    }
  }
];

const CURRENT_MIGRATION_NUMBER = USER_MIGRATIONS.length;

/**
 * Migrates user data from one format to another
 */
export default class Migrations {
  private readonly documentClient: DynamoDB.DocumentClient;

  public constructor(documentClient: DynamoDB.DocumentClient) {
    this.documentClient = documentClient;
  }

  public static getNewUser(id: string): IUser {
    const now = getCurrentTimestamp();
    return {
      id,
      migrationNumber: CURRENT_MIGRATION_NUMBER,
      version: 1,
      created: now,
      updated: now,
      accounts: {}
    };
  }

  public async migrateUser(user: IUser): Promise<IUser> {
    return this.runMigrations(user);
  }

  private async runMigrations(user: IUser): Promise<IUser> {
    const starting: number = typeof user.migrationNumber === 'undefined' ? 0 : user.migrationNumber;

    for (let i = starting; i < USER_MIGRATIONS.length; i++) {
      const migratedUser = USER_MIGRATIONS[ i ].migrate(user);

      user = await this.saveUser({ ...migratedUser, migrationNumber: i + 1 });
    }

    return user;
  }

  /**
   * Saves updates to a user object if the version matches
   * @param user user to update
   */
  private async saveUser(user: IUser): Promise<IUser> {
    const now = getCurrentTimestamp();
    const toPut: IUser = { ...user, version: user.version + 1, updated: now };

    await this.documentClient.put({
      TableName: EnvironmentVariables.usersTable,
      Item: toPut,
      ConditionExpression: 'attribute_exists(#id) AND #version = :version',
      ExpressionAttributeNames: {
        '#id': 'id',
        '#version': 'version'
      },
      ExpressionAttributeValues: {
        ':version': user.version
      }
    }).promise();

    return toPut;
  }
}