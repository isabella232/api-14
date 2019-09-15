import { APIGatewayProxyHandler } from 'aws-lambda';
import jointz from 'jointz';
import 'source-map-support/register';
import { IAccountDto } from '../shapes/account-dto';
import { UpdateAccountParams, UpdateAccountParamsValidator } from '../shapes/update-account';
import { accountModelToDto } from '../util/converters';
import createHandler from '../util/create-handler';
import { OAuthScopes } from '../util/scope-constants';
import { createValidationResult, parseBodyAndJointzValidate } from '../util/validation';

const ACCOUNT_ID_PATH_PARAMETER = 'accountId';

const uuidValidator = jointz.string().uuid();

export const handler: APIGatewayProxyHandler = createHandler<IAccountDto, UpdateAccountParams>({
  requiredScopes: [ OAuthScopes.UPDATE_ACCOUNT_DETAILS ],
  authenticatedOnly: true,

  async validate(event) {
    const accountId = event.pathParameters !== null ? event.pathParameters[ ACCOUNT_ID_PATH_PARAMETER ] : null;

    const result = createValidationResult(accountId, uuidValidator);
    if (!result.isValid) {
      return result;
    }

    return parseBodyAndJointzValidate(event.body, UpdateAccountParamsValidator);
  },

  async handle(event, context): Promise<IAccountDto> {
    const accountId: string = (event.pathParameters as any)[ ACCOUNT_ID_PATH_PARAMETER ];

    await context.crud.updateAccountDetails(context.userId, accountId, event.body);

    const account = await context.crud.getAccount(context.userId, accountId);

    return accountModelToDto(accountId, account);
  }
});