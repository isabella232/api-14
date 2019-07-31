import jointz from 'jointz';

export const NameValidator = jointz.string().minLength(1).maxLength(100);
export const DescriptionValidator = jointz.string().minLength(1).maxLength(1000);
export const VersionValidator = jointz.number().integer().min(1);
export const EnsNameValidator = jointz.string().pattern(/^[a-z0-9-]+\.myethvault\.com$/);