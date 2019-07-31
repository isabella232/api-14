import jointz from 'jointz';
import { DescriptionValidator, EnsNameValidator, NameValidator } from './common';
import { EncryptedJson, EncryptedJsonValidator } from './encrypted-json';

export interface CreateAccountParams {
  // The name of the account
  name: string;

  // The description of the account
  description: string;

  // Encrypted JSON wallet
  // https://docs.ethers.io/ethers.js/html/api-wallet.html#encrypted-json-wallets
  encryptedJson: EncryptedJson;

  // The desired ENS name for the account.
  ensName: string;
}

export const CreateAccountParamsValidator = jointz.object({
  name: NameValidator,
  description: DescriptionValidator,
  encryptedJson: EncryptedJsonValidator,
  ensName: EnsNameValidator,
}).requiredKeys('name', 'description', 'encryptedJson');