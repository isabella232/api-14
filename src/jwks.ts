import fetch from 'node-fetch';
import EnvironmentVariables from './env';
import Logger from './logger';

interface Key {
  alg: string;
  kty: string;
  use: string;
  x5c: string[];
  n: string;
  e: string;
  kid: string;
  x5t: string;
}

interface JWK {
  keys: Key[];
}

let cachedJwks: Promise<JWK> | null = null;

/**
 * This function gets the well known JWKs for the issuing application and caches them for future
 * invocations.
 */
export function getWellKnownJwks(): Promise<JWK> {
  if (cachedJwks !== null) {
    return cachedJwks;
  } else {
    return (
      cachedJwks = fetch(`${EnvironmentVariables.tokenIssuer}.well-known/jwks.json`)
        .then(
          response => {
            if (response.status !== 200) {
              throw new Error('Failed to get well known JWKs.');
            }

            return response.json();
          }
        )
        .then(
          jwks => {
            Logger.debug('Fetched well known JWKs', jwks);
            return jwks;
          }
        )
        .catch(
          (error) => {
            cachedJwks = null;
            Logger.error('Failed to fetch well known JWKs', error);
            throw error;
          }
        )
    );
  }
}