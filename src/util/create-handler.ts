import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as S3 from 'aws-sdk/clients/s3';
import * as SQS from 'aws-sdk/clients/sqs';
import { isAuthenticated } from './auth-util';
import Crud from './crud';
import Logger from './logger';
import { applyUniversalHeaders, createErrorResponse } from './response-util';
import { OAuthScopes } from './scope-constants';
import { ValidationResult } from './validation';

export interface CallbackContext {
  readonly userId: string;
  readonly crud: Crud;
}

/**
 * Create an API gateway handler that checks scopes and injects the user into the request.
 * @param authenticatedOnly whether the request can only be for authenticated requests
 * @param requiredScopes scopes that must be on the request in order to be accepted
 * @param validate method to validate any incoming requests
 * @param handle method handler
 */
export default function createHandler<TResponse = any, TRequest = null>(
  {
    authenticatedOnly = true,
    requiredScopes = [],
    validate,
    handle
  }: {
    authenticatedOnly: boolean;
    requiredScopes: OAuthScopes[];
    validate?(event: Readonly<APIGatewayProxyEvent>, context: CallbackContext): Promise<ValidationResult>;
    handle(event: Readonly<APIGatewayProxyEvent> & { body: TRequest }, context: CallbackContext): Promise<TResponse> | TResponse;
  }
): APIGatewayProxyHandler {
  return async (event) => {
    const { scope, user } = (event.requestContext.authorizer || {}) as any;

    if (authenticatedOnly && !isAuthenticated(event)) {
      return createErrorResponse(
        401,
        'Invalid authorization header'
      );
    }

    if (requiredScopes.length > 0) {
      const tokenScopes = new Set(scope.split(' '));

      const missingScopes = requiredScopes.filter(scope => !tokenScopes.has(scope));

      if (missingScopes.length > 0) {
        return createErrorResponse(
          403,
          `Token does not have the required scopes: ${missingScopes.join(', ')}`
        );
      }
    }

    const crud = new Crud(
      new DynamoDB.DocumentClient(),
      new S3(),
      new SQS(),
    );

    const context: CallbackContext = { crud, userId: user };

    if (validate) {
      try {
        const result = await validate(event, context);

        if (!result.isValid) {
          return createErrorResponse(
            422,
            `Request failed validation: ${result.errors.map(({ path, message }) => `"${path}" has error ${message}`).join('; ')}`,
            result.errors
          );
        }
      } catch (error) {
        Logger.error('A fatal error occurred during validation', error);
        return createErrorResponse(500, 'An internal server error occurred while validating your request.');
      }
    }

    let response: TResponse;
    try {
      response = await handle({
        ...event,
        body: event.body && event.body.length > 0 ? JSON.parse(event.body) : null
      }, context);
    } catch (error) {
      Logger.error('A fatal error occurred while processing the request', error);
      return createErrorResponse(500, 'An internal server error occurred while processing the request.');
    }

    if (typeof response === 'undefined') {
      return applyUniversalHeaders({
        statusCode: 204,
        body: '',
      });
    }

    return applyUniversalHeaders({
      statusCode: 200,
      body: JSON.stringify(response)
    });
  };
}