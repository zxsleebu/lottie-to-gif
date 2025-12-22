import { createCanvas } from "@napi-rs/canvas";
import type { LottiePlayer } from "lottie-web";
import { GIFEncoder, quantize, applyPalette } from "gifenc";

// --- 1. Environment Mock ---
const documentMock = {
    getElementsByTagName: () => [],
    createElement: (type: string) => {
        if (type === "canvas") return createCanvas(1, 1);
        return { getContext: () => {}, style: {} };
    },
    body: { appendChild: () => {} },
    documentElement: { style: {} },
};
globalThis.window = globalThis as any;
globalThis.document = documentMock as any;
globalThis.navigator = { userAgent: "node" } as any;

const lottie = require("lottie-web/build/player/lottie.js") as LottiePlayer;

// --- 2. The Converter ---

export const lottieToGif = async (
    jsonData: any,
    options?: {
        w?: number;
        h?: number;
        frameRate?: number;
        alphaThreshold?: number;
    }
) => {
    // --- Config ---
    const w = options?.w || (jsonData.w as number);
    const h = options?.h || (jsonData.h as number);
    const frameRate = options?.frameRate || jsonData.fr || 30;

    // ⚠️ IMPORTANT: Anti-aliasing Threshold
    // Pixels with alpha < 128 will be transparent.
    // Pixels with alpha >= 128 will be fully visible.
    const alphaThreshold = options?.alphaThreshold || 128;

    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");

    const animation = lottie.loadAnimation({
        renderer: "canvas",
        loop: false,
        autoplay: false,
        animationData: jsonData,
        rendererSettings: {
            context: ctx as any,
            clearCanvas: true,
            preserveAspectRatio: "xMidYMid meet",
        },
    });

    const encoder = new GIFEncoder();
    const totalFrames = animation.totalFrames;
    const delay = 1000 / frameRate;

    for (let i = 0; i < totalFrames; i++) {
        animation.goToAndStop(i, true);

        const frameData = ctx.getImageData(0, 0, w, h);
        const data = frameData.data;

        // --- THE FIX ---
        // We assume the background should be transparent.
        // We clean up "dirty" semi-transparent pixels that cause black flickering.
        for (let j = 0; j < data.length; j += 4) {
            const alpha = data[j + 3];

            if (alpha < alphaThreshold) {
                // Force absolute transparency
                data[j + 3] = 0;
                // Clear color data to avoid "ghost" colors
                data[j] = 0;
                data[j + 1] = 0;
                data[j + 2] = 0;
            } else {
                // Force full opacity
                data[j + 3] = 255;
            }
        }

        // 1. Quantize (RGBA)
        const palette = quantize(data, 256, { format: "rgba4444" });

        // 2. Find Transparent Index
        let transparentIndex = -1;
        for (let p = 0; p < palette.length; p++) {
            if (palette[p][3] === 0) {
                transparentIndex = p;
                break;
            }
        }

        // 3. Apply Palette
        const index = applyPalette(data, palette, { format: "rgba4444" });

        // 4. Write Frame
        encoder.writeFrame(index, w, h, {
            palette,
            delay,
            transparent: transparentIndex !== -1,
            transparentIndex: transparentIndex,
            dispose: 2, // Restore to background (Prevents trails)
        });
    }

    encoder.finish();

    return encoder.bytes();
};
