import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { accountModelToDto } from '../converters';
import createHandler from '../create-handler';
import { IAccountDto } from '../dto';
import { OAuthScopes } from '../scope-constants';

export const handler: APIGatewayProxyHandler = createHandler<IAccountDto[], void>({
  authenticatedOnly: true,
  requiredScopes: [ OAuthScopes.READ_ACCOUNTS ],
  async handle(event, context): Promise<IAccountDto[]> {
    const user = await context.crud.getOrCreateUser(context.userId);

    const includeArchived: boolean = event.queryStringParameters !== null &&
      event.queryStringParameters[ 'includeArchived' ] === 'true';

    return Object.keys(user.accounts)
      .filter(accountId => includeArchived || !user.accounts[ accountId ].archived)
      .map<IAccountDto>(
        accountId => {
          const account = user.accounts[ accountId ];

          return accountModelToDto(accountId, account);
        }
      );
  }
});