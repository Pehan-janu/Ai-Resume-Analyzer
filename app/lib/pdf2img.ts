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
    // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
        // Configure pdf.js worker for Vite/React Router in both dev and prod
        // Prefer absolute path from public/ to avoid base path issues
        // Resolve the worker directly from the installed pdfjs-dist to avoid version mismatches
        // Vite will transform new URL(..., import.meta.url) into an absolute URL at runtime
        let workerUrl: URL | string;
        try {
            workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url);
        } catch {
            // As a fallback, try legacy path resolution
            workerUrl = (typeof window !== 'undefined') ? `${window.location.origin}/node_modules/pdfjs-dist/build/pdf.worker.mjs` : 'pdf.worker.mjs';
        }

        try {
            // Prefer explicit WorkerPort with module type for pdf.js v5 (Vite compatible)
            const worker = new Worker(workerUrl as URL, { type: 'module' as any });
            (lib as any).GlobalWorkerOptions.workerPort = worker as any;
        } catch (e) {
            try {
                // Fallback to workerSrc URL if Worker construction fails
                (lib as any).GlobalWorkerOptions.workerSrc = String(workerUrl);
            } catch {}
        }
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        if (typeof window === 'undefined') {
            return { imageUrl: "", file: null, error: "PDF to image requires a browser environment" };
        }
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
            return { imageUrl: "", file: null, error: "Canvas 2D context not available" };
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        await page.render({ canvasContext: context!, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}