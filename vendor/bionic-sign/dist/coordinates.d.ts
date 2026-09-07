import type { FieldRect } from './types.js';
export interface PixelRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export type PdfRect = PixelRect;
export interface PdfPageDimensions {
    width: number;
    height: number;
    rotation: 0 | 90 | 180 | 270;
}
export declare function normalizedToViewport(rect: FieldRect, width: number, height: number): PixelRect;
export declare function viewportToNormalized(rect: PixelRect, width: number, height: number): FieldRect;
export declare function normalizedToPdf(rect: FieldRect, page: PdfPageDimensions): PdfRect;
