import { APIGatewayProxyHandler } from 'aws-lambda';
import jointz from 'jointz';
import 'source-map-support/register';
import { accountModelToDto } from '../converters';
import createHandler from '../create-handler';
import { IAccountWithEncryptedJsonDto } from '../dto';
import { OAuthScopes } from '../scope-constants';

const ACCOUNT_ID_PATH_PARAMETER = 'accountId';

export const handler: APIGatewayProxyHandler = createHandler<IAccountWithEncryptedJsonDto>({
  requiredScopes: [ OAuthScopes.READ_ACCOUNTS, OAuthScopes.READ_ENCRYPTED_ACCOUNT_DATA ],
  authenticatedOnly: true,

  validate(event) {
    const accountId = event.pathParameters !== null ? event.pathParameters[ ACCOUNT_ID_PATH_PARAMETER ] : null;

    const validationErrors = jointz.string().uuid().validate(accountId);
    if (validationErrors.length > 0) {
      return { isValid: false, errors: validationErrors.map(error => ({ message: error.message, path: error.path })) };
    }

    return { isValid: true };
  },

  async handle(event, context): Promise<IAccountWithEncryptedJsonDto> {
    const accountId: string = (event.pathParameters as any)[ ACCOUNT_ID_PATH_PARAMETER ];

    const account = await context.crud.getAccount(context.userId, accountId);

    const encryptedJson = await context.crud.getAccountPrivateData(accountId);

    return {
      ...accountModelToDto(accountId, account),
      encryptedJson
    };
  }
});