export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // Dynamically import pdfjs-dist in a way that works with Vite + TS
    loadPromise = (async () => {
        let lib: any = null;
        try {
            const mod: any = await import('pdfjs-dist');
            lib = mod?.default ?? mod;
        } catch {}
        if (!lib || !lib.getDocument) {
            try {
                // Fallback to direct path (works in many setups)
                // @ts-ignore - path exists at runtime
                const mod: any = await import('pdfjs-dist/build/pdf.mjs');
                lib = mod?.default ?? mod;
            } catch {}
        }
        if (!lib || !lib.getDocument) {
            try {
                // Fallback to legacy build if needed
                // @ts-ignore
                const mod: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
                lib = mod?.default ?? mod;
            } catch {}
        }
        if (!lib || !lib.getDocument) {
            throw new Error('Unable to load pdfjs-dist library');
        }
        // Do not set worker here; it will be set at call-site to match the installed pdfjs version
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    })();

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return { imageUrl: '', file: null, error: 'PDF to image is only supported in the browser.' };
        }

        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        // Use base URL to resolve worker in dev/prod and nested routes
        const base: string = (import.meta as any)?.env?.BASE_URL ?? '/';
        if (lib?.GlobalWorkerOptions) {
            // Use the worker that ships with the installed pdfjs-dist to avoid version mismatches
            try {
                // @ts-ignore
                const worker = await import('pdfjs-dist/build/pdf.worker.mjs');
                // Some bundlers expose default URL on default export
                const workerUrl = (worker && (worker as any).default) ? (worker as any).default : undefined;
                if (workerUrl) {
                    lib.GlobalWorkerOptions.workerSrc = workerUrl;
                } else {
                    lib.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;
                }
            } catch {
                // Fallback to public worker if dynamic import fails
                lib.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;
            }
        }

        const loadingTask = lib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const deviceScale = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
        const viewport = page.getViewport({ scale: 2 * deviceScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return { imageUrl: '', file: null, error: 'Could not get 2D canvas context.' };
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        await page.render({ canvasContext: context, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.[^.]+$/i, '');
                        const imageFile = new File([blob],`${originalName}.png`, { type: 'image/png' });
                        resolve({ imageUrl: URL.createObjectURL(blob), file: imageFile });
                    } else {
                        resolve({ imageUrl: '', file: null, error: 'Failed to create image blob' });
                    }
                },
                'image/png',
                0.95
            );
        });
    } catch (err) {
        return {
            imageUrl: '',
            file: null,
            error: `Failed to convert PDF: ${err instanceof Error ? err.message : String(err)}`,
    };
    }
}