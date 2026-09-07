import type { FormDefinition, FormField, PrefillResult } from './types.js';
export declare function validateDefinition(input: unknown): FormDefinition;
export declare function nextFieldName(type: FormField['type'], fields: readonly FormField[]): string;
export declare function cloneDefinition(definition: FormDefinition): FormDefinition;
export declare function applyTextPrefill(definition: FormDefinition, prefill: Record<string, string>): PrefillResult;
