import { IAccountDto } from '../shapes/account-dto';
import { IAccount } from '../shapes/model';

export function accountModelToDto(id: string, account: IAccount): IAccountDto {
  return {
    id: id,
    name: account.name,
    version: account.version,
    created: account.created,
    updated: account.updated,
    description: account.description,
    address: account.address,
    ensName: account.ensName || null,
  };
}