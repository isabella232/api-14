import { CustomAuthorizerHandler } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import 'source-map-support/register';
import { FailedAuthorizerResult, SuccessfulAuthorizerResult, unauthorizedWithReason } from '../util/auth-util';
import EnvironmentVariables from '../env';
import { getWellKnownJwks } from '../util/jwks';
import Logger from '../util/logger';

/**
 * Generate an AWS policy to return from the authorizer based on the result of the authentication.
 * @param authResult result of the authentication
 */
function generatePolicy(authResult: { user: string; scope: string; }): SuccessfulAuthorizerResult {
  return {
    principalId: authResult.user,
    context: {
      user: authResult.user,
      scope: authResult.scope
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
}

/**
 * Get the single header from the object containing the headers by name, case sensitive. Returns
 * the first matching key.
 * @param headers headers object
 * @param key key to get, case insensitive
 */
function getSingleHeader(headers: { [ name: string ]: string[] } | undefined, key: string): string | null {
  if (!headers) {
    return null;
  }

  for (let headerKey in headers) {
    if (headerKey.toLowerCase() === key.toLowerCase()) {
      const values = headers[ headerKey ];

      if (values.length !== 1) {
        return null;
      }

      return values[ 0 ];
    }
  }

  return null;
}

// The length is validated to make sure we are not spending too long parsing the header.
const AUTH_HEADER_MAX_LENGTH = 2048;

interface DecodedToken {
  // Subject
  sub: string;
  // Scope of the token
  scope: string;
}

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
export const authorize: CustomAuthorizerHandler = async (event): Promise<SuccessfulAuthorizerResult | FailedAuthorizerResult> => {
  const authorizationHeader = getSingleHeader(event.multiValueHeaders, 'authorization');

  if (
    authorizationHeader === null ||
    authorizationHeader.length === 0
  ) {
    return unauthorizedWithReason('Authorization header was null or missing.');
  }

  if (authorizationHeader.length > AUTH_HEADER_MAX_LENGTH) {
    return unauthorizedWithReason(`Authorization header exceeded maximum length ${AUTH_HEADER_MAX_LENGTH}.`);
  }

  const authSplit = authorizationHeader.split(' ');

  if (authSplit.length !== 2) {
    return unauthorizedWithReason('Authorization header contained greater than 2 pieces after splitting on space.');
  }

  const [ type, token ] = authSplit;

  if (type.toLowerCase() === 'bearer') {
    let wellKnownJwks: any;
    try {
      // Make a request to the iss + .well-known/jwks.json URL:
      wellKnownJwks = await getWellKnownJwks();
    } catch (error) {
      Logger.error('Failed to get well known JWKs');
      throw error;
    }

    try {
      const k = wellKnownJwks.keys[ 0 ];
      const { kty, n, e } = k;

      const jwkArray = { kty, n, e };

      const pem = jwkToPem(jwkArray);

      // Verify the token:
      try {
        const { sub, scope } = jwt.verify(
          token,
          pem,
          { issuer: EnvironmentVariables.tokenIssuer, audience: EnvironmentVariables.tokenAudience }
        ) as DecodedToken;

        return generatePolicy({ user: sub, scope });
      } catch (error) {
        return unauthorizedWithReason(`Caught unexpected error during JWT validation: ${error.message}`);
      }
    } catch (error) {
      Logger.error('Caught unexpected error during authorization', error);
      throw error;
    }
  } else {
    return unauthorizedWithReason('Only token type bearer is supported.');
  }
};