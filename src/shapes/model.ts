export interface IAccount {
  // When this account was created.
  created: number;

  // When this account was last updated.
  updated: number;

  // The version of this account.
  version: number;

  // Whether this account is archived.
  archived: boolean;

  // The name of the account.
  name: string;

  // The description of the account.
  description: string;

  // The address of the private key.
  address: string;

  // The ENS name that was requested by this account (may or may not be registered to the address.)
  ensName?: string;
}

export interface IUser {
  // The user identifier and primary key.
  id: string;

  // This is the number of migrations that have run on the user data model in DynamoDB
  migrationNumber?: number;

  // The list of accounts associated with this user.
  accounts: {
    [ id: string ]: IAccount;
  };

  // The version of this user data.
  version: number;

  // When this user was created.
  created: number;

  // When this user or any accounts were last updated.
  updated: number;
}

