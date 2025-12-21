import { createCanvas } from "@napi-rs/canvas";
import type { LottiePlayer } from "lottie-web";
import { GIFEncoder, quantize, applyPalette } from "gifenc";

// --- 1. Mock Environment ---
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

export const lottieToGif = async (
    jsonData: any,
    outputPath: string,
    width?: number,
    height?: number
) => {
    const w = width || (jsonData.w as number);
    const h = height || (jsonData.h as number);
    const frameRate = jsonData.fr || 30;

    // Setup Canvas
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");

    // Setup Lottie
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

    // Setup Encoder
    const encoder = new GIFEncoder();
    const totalFrames = animation.totalFrames;
    const delay = 1000 / frameRate;

    for (let i = 0; i < totalFrames; i++) {
        // 1. Render Frame
        animation.goToAndStop(i, true);

        // 2. Get Raw Pixels
        const frameData = ctx.getImageData(0, 0, w, h);
        const rgba = frameData.data;

        // 3. Quantize & Encode
        const palette = quantize(rgba, 256);
        const index = applyPalette(rgba, palette);
        encoder.writeFrame(index, w, h, { palette, delay });
    }

    // Finish Encoding
    encoder.finish();
    const buffer = encoder.bytes();

    return buffer as Uint8Array;
};
