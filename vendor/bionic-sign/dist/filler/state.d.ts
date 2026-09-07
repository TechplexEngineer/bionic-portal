import type { BionicSignDiagnostic, FormDefinition, FormField, FormValues, SignatureValue, ValidationResult } from '../types.js';
export interface FillerState {
    values: FormValues;
    diagnostics: BionicSignDiagnostic[];
}
export interface RequiredProgress {
    completed: number;
    total: number;
    remaining: number;
}
export declare function cloneValues(values: FormValues): FormValues;
export declare function createFillerState(definition: FormDefinition, prefill?: Record<string, string>): FillerState;
export declare function setTextValue(values: FormValues, fieldName: string, value: string): FormValues;
export declare function setSignatureValue(values: FormValues, fieldName: string, value: SignatureValue): FormValues;
export declare function clearFieldValue(values: FormValues, fieldName: string): FormValues;
export declare function isFieldComplete(field: FormField, values: FormValues): boolean;
export declare function requiredProgress(definition: FormDefinition, values: FormValues): RequiredProgress;
export declare function validateFiller(definition: FormDefinition, values: FormValues): ValidationResult;
export declare function firstInvalidField(definition: FormDefinition, values: FormValues): FormField | undefined;
export declare function submissionValues(definition: FormDefinition, values: FormValues): FormValues;
