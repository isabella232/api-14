import { APIGatewayProxyHandler } from 'aws-lambda';
import jointz from 'jointz';
import 'source-map-support/register';
import { EncryptedJson } from '../shapes/encrypted-json';
import createHandler from '../util/create-handler';
import { OAuthScopes } from '../util/scope-constants';
import { createValidationResult } from '../util/validation';

const ACCOUNT_ID_PATH_PARAMETER = 'accountId';
const uuidValidator = jointz.string().uuid();

export const handler: APIGatewayProxyHandler = createHandler<EncryptedJson>({
  requiredScopes: [ OAuthScopes.READ_ACCOUNTS, OAuthScopes.READ_ENCRYPTED_ACCOUNT_DATA ],
  authenticatedOnly: true,

  async validate(event, context) {
    const accountId = event.pathParameters !== null ? event.pathParameters[ ACCOUNT_ID_PATH_PARAMETER ] : null;

    const validation = createValidationResult(accountId, uuidValidator);

    if (!validation.isValid) {
      return validation;
    }

    const account = await context.crud.getAccount(context.userId, event!.pathParameters![ ACCOUNT_ID_PATH_PARAMETER ]);

    if (!account) {
      return {
        isValid: false,
        errors: [
          { path: [ 'accountId' ], message: 'Invalid account ID' }
        ]
      };
    }

    return { isValid: true };
  },

  async handle(event, context): Promise<EncryptedJson> {
    const accountId: string = event!.pathParameters![ ACCOUNT_ID_PATH_PARAMETER ];

    return context.crud.getAccountPrivateData(accountId);
  }
});