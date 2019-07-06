# ethvault-api

A [serverless.com](https://serverless.com) project that uses TypeScript + AWS Lambda + API Gateway + DynamoDB + S3 
to manage EthVault accounts and data.

## Architecture

Keys are stored with server side encryption in S3. The user's list of keys are stored in DynamoDB. Objects in the bucket
can only be read by the lambda process. Keys are encrypted on the client and protected from access by any AWS user.

API Gateway and lambda serve as the entry point for the user. This application uses Auth0 for authentication. All requests
must have a valid Auth0 access token that is authenticated for the correct audience and scopes. This is enforced in the
request middleware.

These endpoints are accessible by any authorized client. If you wish to create a client for the API, please let me know.

## Endpoints

### Authentication

Authentication is via Auth0. A valid Auth0 token and its token type (e.g. "Bearer") must be passed as the Authorization header.

### `GET /accounts`
 
List the user accounts. Returns an array of user accounts without their encrypted JSON. Requires `read_accounts` scope

### `POST /accounts`

Create a new account. Must pass the encrypted JSON and the desired name and description. Requires `create_account` scope

### `PUT /accounts/:id/details`

Update account details. Requires `update_account_details` scope

### `DELETE /accounts/:id`

Delete the account with the given ID. Requires `delete_account` scope

### `GET /accounts/:id`

Get a particular account along with its encrypted JSON. Used when unlocking an account on the client. Requires `read_encrypted_account_data` scope

## Deployments

Currently the endpoints are deployed to `https://api.ethvault.dev`

## Testing

[Runscope](https://runscope.com) is used to test for regressions. All common user flows are demonstrated in Runscope tests.

## Development Principles

- Don't take dependencies lightly - security is a primary concern and dependencies incur a lot of risk
- Follow the principle of least privilege when writing code to handle user keys
- Delegate to managed services where possible
- Never accept account passwords or unencrypted keys
- Limit logging as much as possible
- Runscope for all integration testing
