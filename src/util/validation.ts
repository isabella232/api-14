interface ValidationError {
  path?: string;
  message?: string;
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