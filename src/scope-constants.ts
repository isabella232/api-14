/**
 * These are the scopes that are available to this API.
 */
export enum OAuthScopes {
  // Access the debug request endpoint
  DEBUG_REQUESTS = 'debug_requests',
  // Create new accounts
  CREATE_ACCOUNT = 'create_account',
  // Update an account's details
  UPDATE_ACCOUNT_DETAILS = 'update_account_details',
  // Read account data excluding encrypted private data
  READ_ACCOUNTS = 'read_accounts',
  // Read encrypted account data
  READ_ENCRYPTED_ACCOUNT_DATA = 'read_encrypted_account_data',
  // Delete accounts
  DELETE_ACCOUNT = 'delete_account'
}