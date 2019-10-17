interface CommonClipOptions {
    /**
     * By default, we try to break only at word boundaries. Set to true if this is undesired.
     */
    breakWords?: boolean;

    /**
     * The string to insert to indicate clipping. Default: "…".
     */
    indicator?: string;

    /**
     * Maximum amount of lines allowed. If given, the string will be clipped either at the moment
     * the maximum amount of characters is exceeded or the moment maxLines newlines are discovered,
     * whichever comes first.
     */
    maxLines?: number;
}

type ClipPlainTextOptions = CommonClipOptions;

interface ClipHtmlOptions extends CommonClipOptions {
    /**
     * Set to true if the string is HTML-encoded. If so, this method will take extra care to make
     * sure the HTML-encoding is correctly maintained.
     */
    html: true;

    /**
     * The amount of characters to assume for images. This is used whenever an image is encountered,
     * but also for SVG and MathML content. Default: 2.
     */
    imageWeight?: number;
}

type ClipOptions = ClipPlainTextOptions | ClipHtmlOptions;

export default function clip(string: string, maxLength: number, options?: ClipOptions): string;