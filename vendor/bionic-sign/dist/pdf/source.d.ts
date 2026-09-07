import { type PdfLoadOptions, type PdfSource } from '../types.js';
export declare function loadPdfBytes(source: PdfSource, options?: PdfLoadOptions): Promise<Uint8Array>;
