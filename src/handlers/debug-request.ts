import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import createHandler from '../create-handler';
import { IUser } from '../model';
import { OAuthScopes } from '../scope-constants';

export const handler: APIGatewayProxyHandler = createHandler<{ user: IUser, event: APIGatewayProxyEvent }>(
  {
    requiredScopes: [ OAuthScopes.DEBUG_REQUESTS ],
    authenticatedOnly: true,
    async handle(event, context) {
      const user = await context.crud.getOrCreateUser(context.userId);

      return {
        user,
        event
      };
    }
  }
);
