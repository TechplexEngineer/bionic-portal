import { type ExportPdfOptions, type FormDefinition, type FormValues } from '../types.js';
export declare function exportFlattenedPdf(sourceBytes: Uint8Array, definition: FormDefinition, values: FormValues, options?: ExportPdfOptions): Promise<Uint8Array>;
