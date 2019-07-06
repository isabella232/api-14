import { IAccountDto } from './dto';
import { IAccount } from './model';

export function accountModelToDto(id: string, account: IAccount): IAccountDto {
  return {
    id: id,
    name: account.name,
    version: account.version,
    created: account.created,
    updated: account.updated,
    description: account.description,
    address: account.address,
    ethvaultEnsName: null,
  };
}