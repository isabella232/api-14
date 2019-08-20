import { Validator } from 'jointz';

interface ValidationError {
  readonly path?: (string | number)[];
  readonly message?: string;
}

export interface ValidationResultBase {
  isValid: boolean;
}

export interface ValidationResultTrue extends ValidationResultBase {
  isValid: true;
}

export interface ValidationResultFalse extends ValidationResultBase {
  errors: ValidationError[];
}

export type ValidationResult = ValidationResultFalse | ValidationResultTrue;

export function parseBodyAndJointzValidate<T extends Validator<any>>(json: string | null, validator: T): ValidationResult {
  if (!json) {
    return { isValid: false, errors: [ { message: 'Request body is required', path: [] } ] };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return { isValid: false, errors: [ { message: `Request body is not valid JSON: ${error.message}`, path: [] } ] };
  }

  return jointzValidate(parsed, validator);
}

export function jointzValidate<T extends Validator<any>>(value: any, validator: T): ValidationResult {
  const errors = validator.validate(value);

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: errors.map(({ path, message }) => ({ path: path as (string | number)[], message }))
    };
  }

  return { isValid: true };
}