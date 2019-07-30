import jointz from 'jointz';
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

export const NameValidator = jointz.string().minLength(1).maxLength(100);
export const DescriptionValidator = jointz.string().minLength(1).maxLength(1000);
export const VersionValidator = jointz.number().integer().min(1);
export const EnsNameValidator = jointz.string().pattern(/^[a-z0-9-]+\.myethvault\.com$/);

export const CreateAccountParamsValidator = jointz.object().keys({
  name: NameValidator,
  description: DescriptionValidator,
  encryptedJson: EncryptedJsonValidator,
  ensName: EnsNameValidator,
}).requiredKeys('name', 'description', 'encryptedJson');

export interface UpdateAccountParams {
  // The new name of the account
  name: string;

  // The new description of the account
  description: string;

  // The current version number of the account being updated.
  // Prevents race conditions from multiple writers.
  version: number;
}

export const UpdateAccountParamsValidator = jointz.object().keys({
  name: NameValidator,
  description: DescriptionValidator,
  version: VersionValidator,
}).requiredKeys('name', 'description', 'version');