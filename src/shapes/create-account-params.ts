import jointz, { ExtractResultType } from 'jointz';
import { DescriptionValidator, EnsNameValidator, NameValidator } from './common';
import { EncryptedJsonValidator } from './encrypted-json';

export type CreateAccountParams = ExtractResultType<typeof CreateAccountParamsValidator>;

export const CreateAccountParamsValidator = jointz.object({
  name: NameValidator,
  description: DescriptionValidator,
  encryptedJson: EncryptedJsonValidator,
  ensName: EnsNameValidator,
}).requiredKeys('name', 'description', 'encryptedJson');