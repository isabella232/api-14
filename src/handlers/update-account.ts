import { APIGatewayProxyHandler } from 'aws-lambda';
import jointz from 'jointz';
import 'source-map-support/register';
import createHandler from '../util/create-handler';
import { OAuthScopes } from '../util/scope-constants';
import { IAccountDto } from '../shapes/account-dto';
import { UpdateAccountParams, UpdateAccountParamsValidator } from '../shapes/update-account';
import { accountModelToDto } from '../util/converters';

const ACCOUNT_ID_PATH_PARAMETER = 'accountId';

const uuidValidator = jointz.string().uuid();

export const handler: APIGatewayProxyHandler = createHandler<IAccountDto, UpdateAccountParams>({
  requiredScopes: [ OAuthScopes.UPDATE_ACCOUNT_DETAILS ],
  authenticatedOnly: true,

  async validate(event) {
    const accountId = event.pathParameters !== null ? event.pathParameters[ ACCOUNT_ID_PATH_PARAMETER ] : null;

    const validationErrors = uuidValidator.validate(accountId);

    if (validationErrors.length > 0) {
      return { isValid: false, errors: validationErrors.map(error => ({ message: error.message, path: error.path })) };
    }

    const body = event.body;
    if (!body) {
      return { isValid: false, errors: [ { path: '', message: 'A request body is required' } ] };
    }

    try {
      const bodyValidationErrors = UpdateAccountParamsValidator.validate(JSON.parse(body));

      if (bodyValidationErrors.length > 0) {
        return {
          isValid: false,
          errors: bodyValidationErrors.map(error => ({ message: error.message, path: error.path }))
        };
      }
    } catch (error) {
      return { isValid: false, errors: [ { message: 'Failed to parse body', path: '' } ] };
    }

    return { isValid: true };
  },

  async handle(event, context): Promise<IAccountDto> {
    const accountId: string = (event.pathParameters as any)[ ACCOUNT_ID_PATH_PARAMETER ];

    await context.crud.updateAccountDetails(context.userId, accountId, event.body);

    const account = await context.crud.getAccount(context.userId, accountId);

    return accountModelToDto(accountId, account);
  }
});