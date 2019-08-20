import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { IAccountDto } from '../shapes/account-dto';
import { CreateAccountParams, CreateAccountParamsValidator } from '../shapes/create-account-params';
import { accountModelToDto } from '../util/converters';
import createHandler from '../util/create-handler';
import { OAuthScopes } from '../util/scope-constants';
import { parseBodyAndJointzValidate } from '../util/validation';

export const handler: APIGatewayProxyHandler = createHandler<IAccountDto, CreateAccountParams>({
  requiredScopes: [ OAuthScopes.CREATE_ACCOUNT ],
  authenticatedOnly: true,

  async validate(event) {
    return parseBodyAndJointzValidate(event.body, CreateAccountParamsValidator);
  },

  async handle(event, context): Promise<IAccountDto> {
    const accountModel = await context.crud.createAccount(context.userId, event.body);

    return accountModelToDto(accountModel.accountId, accountModel.account);
  }
});