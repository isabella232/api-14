import { EncryptedJson } from './encrypted-json';

export interface IAccountDto {
  // A server generated identifier for the account.
  id: string;

  // The version of this account.
  version: number;

  // The name of the account.
  name: string;

  // The description of the account.
  description: string;

  // When this account was created.
  created: number;

  // When this account was last updated.
  updated: number;

  // The account address.
  address: string;

  // The ENS name assigned to the account by ethvault
  ethvaultEnsName: string | null;
}

export interface IAccountWithEncryptedJsonDto extends IAccountDto {
  encryptedJson: EncryptedJson;
}