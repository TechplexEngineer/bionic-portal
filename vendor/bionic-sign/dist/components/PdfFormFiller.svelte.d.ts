import { type BionicSignDiagnostic, type FormDefinition, type FormSubmission, type PdfSource, type ValidationResult } from '../types.js';
interface Props {
    source: PdfSource;
    definition: FormDefinition;
    prefill?: Record<string, string>;
    requestInit?: RequestInit;
    onsubmit?: (submission: FormSubmission) => void;
    onvalidation?: (result: ValidationResult) => void;
    ondiagnostic?: (diagnostic: BionicSignDiagnostic) => void;
    onerror?: (error: unknown) => void;
}
declare const PdfFormFiller: import("svelte").Component<Props, {
    validate: () => ValidationResult;
    exportPdf: () => Promise<Uint8Array>;
    submit: () => Promise<FormSubmission>;
}, "">;
type PdfFormFiller = ReturnType<typeof PdfFormFiller>;
export default PdfFormFiller;
