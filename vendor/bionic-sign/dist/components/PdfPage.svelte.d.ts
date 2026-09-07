export interface PdfPageOverlayContext {
    page: number;
    width: number;
    height: number;
}
import type { PDFPageProxy } from 'pdfjs-dist';
import type { Snippet } from 'svelte';
interface Props {
    page: PDFPageProxy;
    pageNumber: number;
    zoom: number;
    current?: boolean;
    overlay?: Snippet<[PdfPageOverlayContext]>;
    onerror?: (error: unknown) => void;
}
declare const PdfPage: import("svelte").Component<Props, {}, "">;
type PdfPage = ReturnType<typeof PdfPage>;
export default PdfPage;
