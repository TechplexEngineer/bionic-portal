import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PdfPage, {} from './PdfPage.svelte';
function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}
function createPdfPage(renderPromise = Promise.resolve()) {
    const cancel = vi.fn();
    const render = vi.fn(() => ({ promise: renderPromise, cancel }));
    const getViewport = vi.fn(({ scale }) => ({
        width: 120 * scale,
        height: 160 * scale
    }));
    return {
        cancel,
        getViewport,
        page: { getViewport, render },
        render
    };
}
describe('PdfPage', () => {
    it('keeps CSS page dimensions separate from device-pixel canvas dimensions', async () => {
        const pdfPage = createPdfPage();
        const onoverlay = vi.fn();
        const overlay = createRawSnippet((context) => {
            const value = context();
            onoverlay(value);
            return {
                render: () => `<output data-testid="overlay-size">${value.page}:${value.width}x${value.height}</output>`
            };
        });
        const originalRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
        try {
            const result = render(PdfPage, {
                page: pdfPage.page,
                pageNumber: 1,
                zoom: 1.5,
                overlay
            });
            await expect.element(page.getByLabelText('PDF page 1')).toBeVisible();
            await expect.element(page.getByTestId('overlay-size')).toHaveTextContent('1:180x240');
            const canvas = result.container.querySelector('canvas');
            expect(canvas?.width).toBe(360);
            expect(canvas?.height).toBe(480);
            expect(canvas?.style.width).toBe('180px');
            expect(canvas?.style.height).toBe('240px');
            expect(onoverlay).toHaveBeenCalledWith({ page: 1, width: 180, height: 240 });
            expect(pdfPage.render).toHaveBeenCalledWith(expect.objectContaining({
                canvas,
                transform: [2, 0, 0, 2, 0, 0]
            }));
        }
        finally {
            Object.defineProperty(window, 'devicePixelRatio', {
                configurable: true,
                value: originalRatio
            });
        }
    });
    it('caps a high device-pixel ratio while preserving CSS and overlay dimensions', async () => {
        const pdfPage = createPdfPage();
        const originalRatio = window.devicePixelRatio;
        Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 8 });
        try {
            const result = render(PdfPage, {
                page: pdfPage.page,
                pageNumber: 1,
                zoom: 1
            });
            await expect.element(page.getByLabelText('PDF page 1')).toBeVisible();
            const canvas = result.container.querySelector('canvas');
            expect(canvas?.width).toBeLessThanOrEqual(240);
            expect(canvas?.height).toBeLessThanOrEqual(320);
            expect(canvas?.style.width).toBe('120px');
            expect(canvas?.style.height).toBe('160px');
            expect(pdfPage.render).toHaveBeenCalledWith(expect.objectContaining({ transform: [2, 0, 0, 2, 0, 0] }));
        }
        finally {
            Object.defineProperty(window, 'devicePixelRatio', {
                configurable: true,
                value: originalRatio
            });
        }
    });
    it('cancels an active render before rerendering at a new zoom', async () => {
        const activeRender = deferred();
        const firstPage = createPdfPage(activeRender.promise);
        const secondPage = createPdfPage();
        const result = render(PdfPage, {
            page: firstPage.page,
            pageNumber: 1,
            zoom: 1
        });
        await vi.waitFor(() => expect(firstPage.render).toHaveBeenCalledOnce());
        await result.rerender({ page: secondPage.page, pageNumber: 1, zoom: 2 });
        expect(firstPage.cancel).toHaveBeenCalledOnce();
        await vi.waitFor(() => expect(secondPage.getViewport).toHaveBeenCalledWith({ scale: 2 }));
        activeRender.resolve();
    });
    it('cancels an unresolved render when only the zoom changes', async () => {
        const firstRender = deferred();
        const secondRender = deferred();
        const firstCancel = vi.fn();
        const secondCancel = vi.fn();
        const getViewport = vi.fn(({ scale }) => ({
            width: 120 * scale,
            height: 160 * scale
        }));
        const renderPage = vi
            .fn()
            .mockReturnValueOnce({
            promise: firstRender.promise,
            cancel: firstCancel
        })
            .mockReturnValueOnce({
            promise: secondRender.promise,
            cancel: secondCancel
        });
        const pdfPage = { getViewport, render: renderPage };
        const result = render(PdfPage, {
            page: pdfPage,
            pageNumber: 1,
            zoom: 1
        });
        await vi.waitFor(() => expect(renderPage).toHaveBeenCalledOnce());
        await result.rerender({ page: pdfPage, pageNumber: 1, zoom: 2 });
        expect(firstCancel).toHaveBeenCalledOnce();
        await vi.waitFor(() => expect(renderPage).toHaveBeenCalledTimes(2));
        expect(getViewport).toHaveBeenLastCalledWith({ scale: 2 });
        firstRender.resolve();
        secondRender.resolve();
    });
    it('maps generic renderer failures to a stable typed error', async () => {
        const renderGate = deferred();
        const pdfPage = createPdfPage(renderGate.promise);
        const onerror = vi.fn();
        render(PdfPage, { page: pdfPage.page, pageNumber: 1, zoom: 1, onerror });
        const cause = new Error('canvas renderer failed');
        renderGate.reject(cause);
        await vi.waitFor(() => expect(onerror).toHaveBeenCalledOnce());
        expect(onerror).toHaveBeenCalledWith(expect.objectContaining({ code: 'pdf-render', cause }));
    });
    it('suppresses every late renderer failure after cleanup', async () => {
        const pending = deferred();
        const pdfPage = createPdfPage(pending.promise);
        const onerror = vi.fn();
        const result = render(PdfPage, {
            page: pdfPage.page,
            pageNumber: 1,
            zoom: 1,
            onerror
        });
        await vi.waitFor(() => expect(pdfPage.render).toHaveBeenCalledOnce());
        await result.unmount();
        pending.reject(new Error('late failure'));
        await Promise.resolve();
        expect(onerror).not.toHaveBeenCalled();
    });
});
