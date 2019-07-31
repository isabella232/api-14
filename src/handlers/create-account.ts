import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import createHandler from '../util/create-handler';
import { OAuthScopes } from '../util/scope-constants';
import { IAccountDto } from '../shapes/account-dto';
import { CreateAccountParams, CreateAccountParamsValidator } from '../shapes/create-account-params';
import { accountModelToDto } from '../util/converters';

export const handler: APIGatewayProxyHandler = createHandler<IAccountDto, CreateAccountParams>({
  requiredScopes: [ OAuthScopes.CREATE_ACCOUNT ],
  authenticatedOnly: true,

  async validate(event) {
    const body = event.body;
    if (!body) {
      return { isValid: false, errors: [ { message: 'Body is required', path: '' } ] };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      return { isValid: false, errors: [ { message: 'Body is not valid JSON', path: '' } ] };
    }

    const errors = CreateAccountParamsValidator.validate(parsed);
    if (errors.length > 0) {
      return { isValid: false, errors: errors.map(error => ({ message: error.message, path: error.path })) };
    }

    return { isValid: true };
  },

  async handle(event, context): Promise<IAccountDto> {
    const accountModel = await context.crud.createAccount(context.userId, event.body);

    return accountModelToDto(accountModel.accountId, accountModel.account);
  }
});