import { APIGatewayProxyHandler } from 'aws-lambda';
import jointz from 'jointz';
import 'source-map-support/register';
import createHandler from '../util/create-handler';
import { OAuthScopes } from '../util/scope-constants';
import { jointzValidate } from '../util/validation';

const ACCOUNT_ID_PATH_PARAMETER = 'accountId';

const uuidValidator = jointz.string().uuid();

export const handler: APIGatewayProxyHandler = createHandler<void>({
  requiredScopes: [ OAuthScopes.DELETE_ACCOUNT ],
  authenticatedOnly: true,

  async validate(event) {
    const accountId = event.pathParameters !== null ? event.pathParameters[ ACCOUNT_ID_PATH_PARAMETER ] : null;

    return jointzValidate(accountId, uuidValidator);
  },

  async handle(event, context): Promise<void> {
    const accountId: string = (event.pathParameters as any)[ ACCOUNT_ID_PATH_PARAMETER ];

    await context.crud.setArchived(context.userId, accountId);
  }
});