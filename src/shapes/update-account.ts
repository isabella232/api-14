import jointz from 'jointz';
import { DescriptionValidator, NameValidator, VersionValidator } from './common';

export interface UpdateAccountParams {
  // The new name of the account
  name: string;

  // The new description of the account
  description: string;

  // The current version number of the account being updated.
  // Prevents race conditions from multiple writers.
  version: number;
}

export const UpdateAccountParamsValidator = jointz.object({
  name: NameValidator,
  description: DescriptionValidator,
  version: VersionValidator,
}).requiredKeys('name', 'description', 'version');