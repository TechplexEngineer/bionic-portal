import type { Snippet } from 'svelte';
import type { PdfSource } from '../types.js';
import { type PdfPageOverlayContext } from './PdfPage.svelte';
interface Props {
    source: PdfSource;
    requestInit?: RequestInit;
    currentPage?: number;
    zoom?: number;
    overlay?: Snippet<[PdfPageOverlayContext]>;
    loading?: Snippet;
    error?: Snippet<[unknown]>;
    onpagecountchange?: (pageCount: number) => void;
    onerror?: (error: unknown) => void;
}
declare const PdfViewer: import("svelte").Component<Props, {}, "zoom" | "currentPage">;
type PdfViewer = ReturnType<typeof PdfViewer>;
export default PdfViewer;
