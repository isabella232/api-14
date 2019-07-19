import { SQSEvent } from 'aws-lambda';
import * as SSM from 'aws-sdk/clients/ssm';
import jointz from 'jointz';
import EnvironmentVariables from '../env';
import { ClaimEnsNameParams, ClaimEnsNameParamsValidator } from '../request-types';

const ssm = new SSM();

let privateKeyPromise: Promise<string> | null = null;

const PrivateKeyValidator = jointz.string().pattern(/^0x[a-fA-F0-9]{64}$/);

/**
 * Get the private key to use for signing and submitting transactions to ENS to claim the ENS name
 */
function getEnsOwnerPrivateKey(): Promise<string> {
  if (privateKeyPromise !== null) {
    return privateKeyPromise;
  }

  privateKeyPromise = ssm.getParameter({
    Name: EnvironmentVariables.ensOwnerPrivateKeyParameterName,
    WithDecryption: true,
  }).promise()
    .then(
      result => {
        if (!result.Parameter) {
          throw new Error('Parameter was not returned from SSM');
        }

        if (!result.Parameter.Value) {
          throw new Error('Parameter value was not defined');
        }

        const privateKeyErrors = PrivateKeyValidator.validate(result.Parameter.Value);

        if (privateKeyErrors.length > 0) {
          throw new Error('Private key parameter value did not pass validation');
        }

        return result.Parameter.Value;
      }
    )
    .catch(
      error => {
        privateKeyPromise = null;
        throw error;
      }
    );

  return privateKeyPromise;
}

/**
 * Validate a message and return the parsed claim ens name request
 * @param message message from the queue
 */
function validateMessage(message: string): ClaimEnsNameParams {
  const parsed = JSON.parse(message);
  const errors = ClaimEnsNameParamsValidator.validate(parsed);
  if (errors.length) {
    throw new Error('Event failed validation');
  }

  return parsed;
}

/**
 * This handler is called by SQS with batches of ENS claims.
 * @param event request from SQS to the lambda
 */
export const handler = async (event: SQSEvent) => {
  for (let record of event.Records) {
    // @ts-ignore
    const request = validateMessage(record.body);
    // @ts-ignore
    const privateKey = await getEnsOwnerPrivateKey();

    // TODO: construct the transaction
    // TODO: sign the transaction with the private key
    // TODO: submit the transaction to the JSON RPC
  }
};
