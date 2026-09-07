import type { Snippet } from 'svelte';
import type { FormDefinition, PdfSource, ValidationResult } from '../types.js';
interface Props {
    source: PdfSource;
    definition: FormDefinition;
    requestInit?: RequestInit;
    ondefinitionchange?: (definition: FormDefinition) => void;
    onerror?: (error: unknown) => void;
    toolbar?: Snippet;
    loading?: Snippet;
    error?: Snippet<[unknown]>;
}
declare const PdfFormDesigner: import("svelte").Component<Props, {
    validate: () => ValidationResult;
}, "">;
type PdfFormDesigner = ReturnType<typeof PdfFormDesigner>;
export default PdfFormDesigner;
