declare module "gifenc" {
    /**
     * [R, G, B] or [R, G, B, A]
     */
    export type Color = number[];
    export type Palette = Color[];

    export interface QuantizeOptions {
        /**
         * The format of the color data.
         * 'rgb565': 5 bits red, 6 bits green, 5 bits blue (no alpha).
         * 'rgb444': 4 bits per channel (no alpha).
         * 'rgba4444': 4 bits per channel (includes alpha).
         * @default 'rgb565'
         */
        format?: "rgb565" | "rgb444" | "rgba4444";
        /**
         * If true, alpha is treated as 1-bit (0 or 255).
         * @default false
         */
        oneBitAlpha?: boolean;
        /**
         * If true, fully transparent colors will be mapped to a specific index.
         * @default true
         */
        clearAlpha?: boolean;
        /**
         * Alpha threshold for clearAlpha.
         * @default 0
         */
        clearAlphaThreshold?: number;
        /**
         * The color index to use for clearAlpha.
         * @default 0
         */
        clearAlphaColor?: number;
    }

    export interface ApplyPaletteOptions {
        format?: "rgb565" | "rgb444" | "rgba4444";
        oneBitAlpha?: boolean;
    }

    export interface GIFEncoderOptions {
        /**
         * Initial capacity of the internal buffer.
         * @default 1024
         */
        initialCapacity?: number;
        /**
         * If true, the stream will automatically expand.
         * @default true
         */
        auto?: boolean;
    }

    export interface WriteFrameOptions {
        /**
         * The color palette for this frame.
         */
        palette?: Palette;
        /**
         * Delay in milliseconds.
         * @default 0
         */
        delay?: number;
        /**
         * Whether to use transparency.
         * @default false
         */
        transparent?: boolean;
        /**
         * The palette index to treat as transparent.
         * @default 0
         */
        transparentIndex?: number;
        /**
         * Disposal method.
         * -1: No disposal specified (decoder decides).
         *  1: Do not dispose. The graphic is left in place.
         *  2: Restore to background color. The area used by the graphic must be restored to the background color.
         *  3: Restore to previous. The decoder is required to restore the area overwritten by the graphic with what was there prior to rendering the graphic.
         * @default -1
         */
        dispose?: number;
        /**
         * Number of times to repeat the loop. 0 = infinite.
         * @default 0
         */
        repeat?: number;
    }

    /**
     * Quantizes true-color 24-bit (RGB) or 32-bit (RGBA) images into a palette of 256 colors or less.
     */
    export function quantize(
        rgba: ArrayLike<number> | Uint8Array | Uint8ClampedArray,
        maxColors: number,
        options?: QuantizeOptions
    ): Palette;

    /**
     * Maps the RGBA pixel data to the nearest color in the palette.
     */
    export function applyPalette(
        rgba: ArrayLike<number> | Uint8Array | Uint8ClampedArray,
        palette: Palette,
        options?: ApplyPaletteOptions
    ): Uint8Array;

    /**
     * High-performance GIF encoder.
     */
    export class GIFEncoder {
        constructor(opts?: GIFEncoderOptions);

        /**
         * Encodes a frame of indexed pixels.
         * @param index The indexed pixel data (Uint8Array).
         * @param width Width of the frame.
         * @param height Height of the frame.
         * @param opts Frame options.
         */
        writeFrame(
            index: ArrayLike<number> | Uint8Array,
            width: number,
            height: number,
            opts?: WriteFrameOptions
        ): void;

        /**
         * Finalizes the GIF stream (adds the trailer).
         */
        finish(): void;

        /**
         * Resets the encoder state.
         */
        reset(): void;

        /**
         * Returns the full GIF file as a Uint8Array.
         */
        bytes(): Uint8Array;

        /**
         * Returns a view of the internal buffer.
         */
        bytesView(): Uint8Array;
    }
}
