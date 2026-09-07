import { BionicSignError } from '../types.js';
let pdfJsPromise;
async function initializePdfJs() {
    try {
        const [pdfJs, worker] = await Promise.all([
            import('pdfjs-dist'),
            import('pdfjs-dist/build/pdf.worker.min.mjs?url')
        ]);
        pdfJs.GlobalWorkerOptions.workerSrc = worker.default;
        return pdfJs;
    }
    catch (cause) {
        pdfJsPromise = undefined;
        throw new BionicSignError('pdfjs-initialization', 'Failed to initialize PDF.js', { cause });
    }
}
export function getPdfJs() {
    if (typeof window === 'undefined') {
        return Promise.reject(new BionicSignError('pdfjs-browser-only', 'PDF.js can only be initialized in a browser'));
    }
    return (pdfJsPromise ??= initializePdfJs());
}
