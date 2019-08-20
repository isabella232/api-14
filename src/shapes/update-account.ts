import jointz, { ExtractResultType } from 'jointz';
import { DescriptionValidator, NameValidator, VersionValidator } from './common';

export type UpdateAccountParams = ExtractResultType<typeof UpdateAccountParamsValidator>;

export const UpdateAccountParamsValidator = jointz.object({
  name: NameValidator,
  description: DescriptionValidator,
  version: VersionValidator,
}).requiredKeys('name', 'description', 'version');