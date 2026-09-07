import { describe, expect, expectTypeOf, it } from 'vitest';
describe('package entry', () => {
    it('imports without browser globals and exposes the public runtime API', async () => {
        expect(globalThis).not.toHaveProperty('window');
        expect(globalThis).not.toHaveProperty('document');
        const api = await import('./index.js');
        expect(api).toMatchObject({
            PdfFormDesigner: expect.any(Function),
            PdfFormFiller: expect.any(Function),
            SignaturePad: expect.any(Function),
            BionicSignError: expect.any(Function),
            applyTextPrefill: expect.any(Function),
            cloneDefinition: expect.any(Function),
            exportFlattenedPdf: expect.any(Function),
            nextFieldName: expect.any(Function),
            validateDefinition: expect.any(Function)
        });
        expectTypeOf().not.toBeNever();
    });
});
