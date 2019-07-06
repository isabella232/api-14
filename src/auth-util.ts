import { APIGatewayEvent, CustomAuthorizerResult } from 'aws-lambda';

export interface FailedAuthorizerResult extends CustomAuthorizerResult {
  context: {
    reason: string;
  };
}

export interface SuccessfulAuthorizerResult extends CustomAuthorizerResult {
  context: {
    user: string;
    scope: string;
  };
}

export const UNAUTHORIZED_PRINCIPAL = 'UNAUTHORIZED';

export const UNAUTHORIZED_POLICY: FailedAuthorizerResult = {
  principalId: UNAUTHORIZED_PRINCIPAL,
  context: {
    reason: 'Failed authentication for unknown reason.'
  },
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: '*'
      }
    ]
  }
};

export function unauthorizedWithReason(reason: string): FailedAuthorizerResult {
  return { ...UNAUTHORIZED_POLICY, context: { reason } };
}

export function isAuthenticated(event: APIGatewayEvent): boolean {
  const { principalId } = (event.requestContext.authorizer || {}) as any;

  return typeof principalId === 'string' &&
    principalId.length > 0 &&
    principalId !== UNAUTHORIZED_PRINCIPAL;
}