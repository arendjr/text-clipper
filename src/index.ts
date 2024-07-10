interface CommonClipOptions {
    /**
     * By default, we try to break only at word boundaries. Set to true if this is undesired.
     */
    breakWords?: boolean;

    /**
     * Set to `true` if the string is HTML-encoded. If so, this method will take extra care to make
     * sure the HTML-encoding is correctly maintained.
     */
    html?: boolean;

    /**
     * The string to insert to indicate clipping. Default: "…".
     */
    indicator?: string;

    /**
     * Whether the indicator should be inserted when the text is clipped at a linebreak.
     *
     * Default: `true`.
     */
    insertIndicatorAtLinebreak?: boolean;

    /**
     * Maximum amount of lines allowed. If given, the string will be clipped either at the moment
     * the maximum amount of characters is exceeded or the moment maxLines newlines are discovered,
     * whichever comes first.
     */
    maxLines?: number;
}

interface ClipPlainTextOptions extends CommonClipOptions {
    html?: false;
}

interface ClipHtmlOptions extends CommonClipOptions {
    html: true;

    /**
     * The amount of characters to assume for images. This is used whenever an image is encountered,
     * but also for SVG and MathML content. Default: `2`.
     */
    imageWeight?: number;

    /**
     * Optional list of tags to be stripped from the output. If `true`, all tags are stripped.
     *
     * Tag names must be specified in lowercase.
     */
    stripTags?: Array<string> | true;
}

type ClipOptions = ClipPlainTextOptions | ClipHtmlOptions;

// Void elements are elements without inner content,
// which close themselves regardless of trailing slash.
// E.g. both <br> and <br /> are self-closing.
const VOID_ELEMENTS = [
    "area",
    "base",
    "br",
    "col",
    "command",
    "embed",
    "hr",
    "img",
    "input",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
];

// Block elements trigger newlines where they're inserted,
// and are always safe places for truncation.
const BLOCK_ELEMENTS = [
    "address",
    "article",
    "aside",
    "blockquote",
    "canvas",
    "dd",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "hr",
    "li",
    "main",
    "nav",
    "noscript",
    "ol",
    "output",
    "p",
    "pre",
    "section",
    "table",
    "tbody",
    "tfoot",
    "thead",
    "tr",
    "ul",
    "video",
];

// Elements that are unbreakable: they are either included verbatim, or omitted entirely.
const UNBREAKABLE_ELEMENTS = ["audio", "math", "svg", "video"];

const NEWLINE_CHAR_CODE = 10; // '\n'
const EXCLAMATION_CHAR_CODE = 33; // '!'
const DOUBLE_QUOTE_CHAR_CODE = 34; // '"'
const AMPERSAND_CHAR_CODE = 38; // '&'
const SINGLE_QUOTE_CHAR_CODE = 39; // '\''
const FORWARD_SLASH_CHAR_CODE = 47; // '/'
const SEMICOLON_CHAR_CODE = 59; // ';'
const TAG_OPEN_CHAR_CODE = 60; // '<'
const EQUAL_SIGN_CHAR_CODE = 61; // '='
const TAG_CLOSE_CHAR_CODE = 62; // '>'

const CHAR_OF_INTEREST_REGEX = /[<&\n\ud800-\udbff]/;
const CHAR_OF_INTEREST_NO_NEWLINE_REGEX = /[<&\ud800-\udbff]/;

const SIMPLIFY_WHITESPACE_REGEX = /\s+/g;

/**
 * Clips a string to a maximum length. If the string exceeds the length, it is truncated and an
 * indicator (an ellipsis, by default) is appended.
 *
 * In detail, the clipping rules are as follows:
 * - The resulting clipped string may never contain more than maxLength characters. Examples:
 *   - clip("foo", 3) => "foo"
 *   - clip("foo", 2) => "f…"
 * - The indicator is inserted if and only if the string is clipped at any place other than a
 *   newline. Examples:
 *   - clip("foo bar", 5) => "foo …"
 *   - clip("foo\nbar", 5) => "foo"
 * - If the html option is true and valid HTML is inserted, the clipped output *must* also be valid
 *   HTML. If the input is not valid HTML, the result is undefined (not to be confused with JS'
 *   "undefined" type; some errors might be detected and result in an exception, but this is not
 *   guaranteed).
 *
 * @param string The string to clip.
 * @param maxLength The maximum length of the clipped string in number of characters.
 * @param options Optional options object.
 *
 * @return The clipped string.
 */
export default function clip(string: string, maxLength: number, options: ClipOptions = {}): string {
    if (!string) {
        return "";
    }

    string = string.toString();

    return options.html
        ? clipHtml(string, maxLength, options)
        : clipPlainText(string, maxLength, options);
}

function clipHtml(string: string, maxLength: number, options: ClipHtmlOptions): string {
    const {
        imageWeight = 2,
        indicator = "\u2026",
        insertIndicatorAtLinebreak = true,
        maxLines = Infinity,
        stripTags = false,
    } = options;

    let numChars = indicator.length;
    let numLines = 1;

    const shouldStrip =
        typeof stripTags === "boolean"
            ? () => stripTags
            : (tagName: string) => stripTags.includes(tagName);

    const tagStack: Array<string> = []; // Stack of currently open HTML tags.
    const popTagStack = (result: string) => {
        let tagName: string | undefined;
        // biome-ignore lint/style/noCommaOperator: Otherwise we need to pop...
        // biome-ignore lint/suspicious/noAssignInExpressions: ... in two places.
        while (((tagName = tagStack.pop()), tagName !== undefined)) {
            if (!shouldStrip(tagName)) {
                result += `</${tagName}>`;
            }
        }
        return result;
    };

    let i = 0;
    let unbreakableElementIndex = -1;
    const { length } = string;
    for (; i < length; i++) {
        const rest = i ? string.slice(i) : string;
        const willSimplifyWhiteSpace = shouldSimplifyWhiteSpace(tagStack);
        const regex =
            unbreakableElementIndex > -1 || willSimplifyWhiteSpace
                ? CHAR_OF_INTEREST_NO_NEWLINE_REGEX
                : CHAR_OF_INTEREST_REGEX;
        const nextIndex = rest.search(regex);
        let nextBlockSize = nextIndex > -1 ? nextIndex : rest.length;

        if (unbreakableElementIndex === -1) {
            if (willSimplifyWhiteSpace) {
                let simplifiedBlock = simplifyWhiteSpace(
                    nextBlockSize === rest.length ? rest : rest.slice(0, nextIndex),
                );

                if (shouldStrip(tagStack[tagStack.length - 1]!)) {
                    // We want to strip whitespace, but we need to insert spaces if stripping the
                    // tags and whitespace together would otherwise inadvertently concatenate words:
                    const insertSpaceBefore = i > 0 && !isWhiteSpace(string.charCodeAt(i - 1));
                    const insertSpaceAfter = !isWhiteSpace(string.charCodeAt(i + nextBlockSize));
                    if (simplifiedBlock.length > 0) {
                        simplifiedBlock =
                            (insertSpaceBefore ? " " : "") +
                            simplifiedBlock +
                            (insertSpaceAfter ? " " : "");
                    } else if (insertSpaceBefore && insertSpaceAfter) {
                        simplifiedBlock = " ";
                    }

                    string = string.slice(0, i) + simplifiedBlock + string.slice(i + nextBlockSize);
                    nextBlockSize = simplifiedBlock.length;
                }

                numChars += simplifiedBlock.length;
                if (numChars > maxLength) {
                    break;
                }
            } else {
                numChars += nextBlockSize;
                if (numChars > maxLength) {
                    i = Math.max(i + nextBlockSize - numChars + maxLength, 0);
                    break;
                }
            }
        }

        i += nextBlockSize;

        if (nextIndex === -1) {
            break;
        }

        const charCode = string.charCodeAt(i);
        if (charCode === TAG_OPEN_CHAR_CODE) {
            const nextCharCode = string.charCodeAt(i + 1);
            const isSpecialTag = nextCharCode === EXCLAMATION_CHAR_CODE;
            if (isSpecialTag && string.substr(i + 2, 2) === "--") {
                const commentEndIndex = string.indexOf("-->", i + 4) + 3;
                i = commentEndIndex - 1; // - 1 because the outer for loop will increment it
            } else if (isSpecialTag && string.substr(i + 2, 7) === "[CDATA[") {
                const cdataEndIndex = string.indexOf("]]>", i + 9) + 3;
                i = cdataEndIndex - 1; // - 1 because the outer for loop will increment it

                // note we don't count CDATA text for our character limit because it is only
                // allowed within SVG and MathML content, both of which we don't clip
            } else {
                // don't open new tags if we are currently at the limit
                const isEndTag = nextCharCode === FORWARD_SLASH_CHAR_CODE;
                if (numChars === maxLength && !isEndTag) {
                    numChars++;
                    break;
                }

                let attributeQuoteCharCode = 0;
                let endIndex = i;
                let isAttributeValue = false;
                while (true /* eslint-disable-line */) {
                    endIndex++;
                    if (endIndex >= length) {
                        throw new Error(`Invalid HTML: ${string}`);
                    }

                    const charCode = string.charCodeAt(endIndex);
                    if (isAttributeValue) {
                        if (attributeQuoteCharCode) {
                            if (charCode === attributeQuoteCharCode) {
                                isAttributeValue = false;
                            }
                        } else {
                            if (isWhiteSpace(charCode)) {
                                isAttributeValue = false;
                            } else if (charCode === TAG_CLOSE_CHAR_CODE) {
                                isAttributeValue = false;
                                endIndex--; // re-evaluate this character
                            }
                        }
                    } else if (charCode === EQUAL_SIGN_CHAR_CODE) {
                        while (isWhiteSpace(string.charCodeAt(endIndex + 1))) {
                            endIndex++; // skip whitespace
                        }
                        isAttributeValue = true;

                        const firstAttributeCharCode = string.charCodeAt(endIndex + 1);
                        if (
                            firstAttributeCharCode === DOUBLE_QUOTE_CHAR_CODE ||
                            firstAttributeCharCode === SINGLE_QUOTE_CHAR_CODE
                        ) {
                            attributeQuoteCharCode = firstAttributeCharCode;
                            endIndex++;
                        } else {
                            attributeQuoteCharCode = 0;
                        }
                    } else if (charCode === TAG_CLOSE_CHAR_CODE) {
                        const tagNameStartIndex = i + (isEndTag ? 2 : 1);
                        const tagNameEndIndex = Math.min(
                            indexOfWhiteSpace(string, tagNameStartIndex),
                            endIndex,
                        );
                        let tagName = string
                            .slice(tagNameStartIndex, tagNameEndIndex)
                            .toLowerCase();
                        if (tagName.charCodeAt(tagName.length - 1) === FORWARD_SLASH_CHAR_CODE) {
                            // Remove trailing slash for self-closing tag names like <br/>
                            tagName = tagName.slice(0, tagName.length - 1);
                        }

                        const strip = shouldStrip(tagName);

                        if (isEndTag) {
                            const currentTagName = tagStack.pop();
                            if (currentTagName !== tagName) {
                                throw new Error(`Invalid HTML: ${string}`);
                            }

                            if (UNBREAKABLE_ELEMENTS.includes(tagName)) {
                                if (
                                    UNBREAKABLE_ELEMENTS.some((tagName) =>
                                        tagStack.includes(tagName),
                                    )
                                ) {
                                    // It's a nested unbreakable element.
                                } else if (strip) {
                                    i = unbreakableElementIndex;
                                    unbreakableElementIndex = -1;
                                } else {
                                    unbreakableElementIndex = -1;
                                    numChars += imageWeight;
                                    if (numChars > maxLength) {
                                        break;
                                    }
                                }
                            }

                            // Block level elements should trigger a new line, unless stripped or
                            // part of unbreakable content.
                            const isBlockElement = BLOCK_ELEMENTS.includes(tagName);
                            if (isBlockElement && unbreakableElementIndex === -1 && !strip) {
                                numLines++;
                                if (numLines > maxLines) {
                                    // If we exceed the max lines, push the tag back onto the
                                    // stack so that it will be added back correctly after
                                    // truncation.
                                    tagStack.push(tagName);
                                    break;
                                }
                            }
                        } else if (
                            VOID_ELEMENTS.includes(tagName) ||
                            string.charCodeAt(endIndex - 1) === FORWARD_SLASH_CHAR_CODE
                        ) {
                            if (strip) {
                                // Stripped elements aren't counted towards anything.
                            } else if (tagName === "br") {
                                numLines++;
                                if (numLines > maxLines) {
                                    break;
                                }
                            } else if (tagName === "img") {
                                numChars += imageWeight;
                                if (numChars > maxLength) {
                                    break;
                                }
                            }
                        } else {
                            if (
                                UNBREAKABLE_ELEMENTS.some((tagName) => tagStack.includes(tagName))
                            ) {
                                // It's a nested unbreakable element.
                            } else if (UNBREAKABLE_ELEMENTS.includes(tagName)) {
                                unbreakableElementIndex = i;
                            }
                            tagStack.push(tagName);
                        }

                        if (strip && unbreakableElementIndex === -1) {
                            string = string.slice(0, i) + string.slice(endIndex + 1);
                            i--; // Re-evaluate this index, because its contents changed.
                        } else {
                            i = endIndex;
                        }

                        break;
                    }
                }
                if (numChars > maxLength || numLines > maxLines) {
                    break;
                }
            }
        } else if (charCode === AMPERSAND_CHAR_CODE) {
            let endIndex = i + 1;
            let isCharacterReference = true;
            while (true /* eslint-disable-line */) {
                const charCode = string.charCodeAt(endIndex);
                if (isCharacterReferenceCharacter(charCode)) {
                    endIndex++;
                } else if (charCode === SEMICOLON_CHAR_CODE) {
                    break;
                } else {
                    isCharacterReference = false;
                    break;
                }
            }

            if (unbreakableElementIndex === -1) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }
            }

            if (isCharacterReference) {
                i = endIndex;
            }
        } else if (charCode === NEWLINE_CHAR_CODE) {
            numChars++;
            if (numChars > maxLength) {
                break;
            }

            numLines++;
            if (numLines > maxLines) {
                break;
            }
        } else {
            if (unbreakableElementIndex === -1) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }
            }

            if ((charCode & 0xfc00) === 0xd800) {
                // high Unicode surrogate should never be separated from its matching low surrogate
                const nextCharCode = string.charCodeAt(i + 1);
                if ((nextCharCode & 0xfc00) === 0xdc00) {
                    i++;
                }
            }
        }
    }

    if (numChars > maxLength) {
        let nextChar = takeHtmlCharAt(string, i);
        if (indicator) {
            let peekIndex = i + nextChar.length;
            while (
                string.charCodeAt(peekIndex) === TAG_OPEN_CHAR_CODE &&
                string.charCodeAt(peekIndex + 1) === FORWARD_SLASH_CHAR_CODE
            ) {
                const nextPeekIndex = string.indexOf(">", peekIndex + 2) + 1;
                if (nextPeekIndex) {
                    peekIndex = nextPeekIndex;
                } else {
                    break;
                }
            }

            if (peekIndex && (peekIndex === string.length || isLineBreak(string, peekIndex))) {
                // if there's only a single character remaining in the input string, or the next
                // character is followed by a line-break, we can include it instead of the clipping
                // indicator (provided it's not a special HTML character)
                i += nextChar.length;
                nextChar = string.charAt(i);
            }
        }

        // include closing tags before adding the clipping indicator if that's where they
        // are in the input string
        while (nextChar === "<" && string.charCodeAt(i + 1) === FORWARD_SLASH_CHAR_CODE) {
            const tagName = tagStack.pop();
            if (!tagName) {
                break;
            }

            const tagEndIndex = string.indexOf(">", i + 2);
            if (tagEndIndex === -1 || string.slice(i + 2, tagEndIndex).trim() !== tagName) {
                throw new Error(`Invalid HTML: ${string}`);
            }

            if (shouldStrip(tagName)) {
                string = string.slice(0, i) + string.slice(tagEndIndex + 1);
            } else {
                i = tagEndIndex + 1;
            }

            nextChar = string.charAt(i);
        }

        if (i < string.length) {
            if (!options.breakWords) {
                // try to clip at word boundaries, if desired
                for (let j = i - indicator.length; j >= 0; j--) {
                    const charCode = string.charCodeAt(j);
                    if (charCode === TAG_CLOSE_CHAR_CODE || charCode === SEMICOLON_CHAR_CODE) {
                        // these characters could be just regular characters, so if they occur in
                        // the middle of a word, they would "break" our attempt to prevent breaking
                        // of words, but given this seems highly unlikely and the alternative is
                        // doing another full parsing of the preceding text, this seems acceptable.
                        break;
                    } else if (charCode === NEWLINE_CHAR_CODE || charCode === TAG_OPEN_CHAR_CODE) {
                        i = j;
                        break;
                    } else if (isWhiteSpace(charCode)) {
                        i = j + (indicator ? 1 : 0);
                        break;
                    }
                }
            }

            const insertIndicator =
                (insertIndicatorAtLinebreak || !isLineBreak(string, i)) &&
                hasHtmlNonWhitespace(string, i);

            // Don't leave awkward whitespace at the end.
            while (i > 0 && isWhiteSpace(string.charCodeAt(i - 1)!)) {
                i--;
            }

            return popTagStack(string.slice(0, i) + (insertIndicator ? indicator : ""));
        }
    } else if (numLines > maxLines) {
        const insertIndicator = insertIndicatorAtLinebreak && hasHtmlNonWhitespace(string, i);

        // Don't leave awkward whitespace at the end.
        while (i > 0 && isWhiteSpace(string.charCodeAt(i - 1)!)) {
            i--;
        }

        return popTagStack(string.slice(0, i) + (insertIndicator ? indicator : ""));
    }

    return string;
}

function clipPlainText(string: string, maxLength: number, options: CommonClipOptions): string {
    const {
        indicator = "\u2026",
        insertIndicatorAtLinebreak = true,
        maxLines = Infinity,
    } = options;

    let numChars = indicator.length;
    let numLines = 1;

    let i = 0;
    const { length } = string;
    for (; i < length; i++) {
        numChars++;
        if (numChars > maxLength) {
            break;
        }

        const charCode = string.charCodeAt(i);
        if (charCode === NEWLINE_CHAR_CODE) {
            numLines++;
            if (numLines > maxLines) {
                break;
            }
        } else if ((charCode & 0xfc00) === 0xd800) {
            // high Unicode surrogate should never be separated from its matching low surrogate
            const nextCharCode = string.charCodeAt(i + 1);
            if ((nextCharCode & 0xfc00) === 0xdc00) {
                i++;
            }
        }
    }

    if (numChars > maxLength) {
        let nextChar = takeCharAt(string, i);
        if (indicator) {
            const peekIndex = i + nextChar.length;
            if (peekIndex === string.length) {
                return string;
            } else if (string.charCodeAt(peekIndex) === NEWLINE_CHAR_CODE) {
                const insertIndicator =
                    insertIndicatorAtLinebreak && hasNonWhitespace(string, peekIndex);
                return string.slice(0, peekIndex) + (insertIndicator ? indicator : "");
            }
        }

        if (!options.breakWords) {
            // try to clip at word boundaries, if desired
            for (let j = i - indicator.length; j >= 0; j--) {
                const charCode = string.charCodeAt(j);
                if (charCode === NEWLINE_CHAR_CODE) {
                    i = j;
                    nextChar = "\n";
                    break;
                } else if (isWhiteSpace(charCode)) {
                    i = j + (indicator ? 1 : 0);
                    break;
                }
            }
        }

        const insertIndicator =
            (insertIndicatorAtLinebreak || nextChar !== "\n") && hasNonWhitespace(string, i);

        // Don't leave awkward whitespace at the end.
        while (i > 0 && isWhiteSpace(string.charCodeAt(i - 1)!)) {
            i--;
        }

        return string.slice(0, i) + (insertIndicator ? indicator : "");
    } else if (numLines > maxLines) {
        const insertIndicator = insertIndicatorAtLinebreak && hasNonWhitespace(string, i);

        // Don't leave awkward whitespace at the end.
        while (i > 0 && isWhiteSpace(string.charCodeAt(i - 1)!)) {
            i--;
        }

        return string.slice(0, i) + (insertIndicator ? indicator : "");
    }

    return string;
}

function hasHtmlNonWhitespace(string: string, fromIndex: number): boolean {
    const { length } = string;
    for (let i = fromIndex; i < length; i++) {
        const charCode = string.charCodeAt(i);
        if (charCode === TAG_OPEN_CHAR_CODE) {
            do {
                i++;
            } while (i < length && isWhiteSpace(string.charCodeAt(i)));
            if (string.charCodeAt(i) === FORWARD_SLASH_CHAR_CODE) {
                do {
                    i++;
                } while (i < length && string.charCodeAt(i) !== TAG_CLOSE_CHAR_CODE);
            } else {
                return true;
            }
        } else if (!isWhiteSpace(charCode)) {
            return true;
        }
    }
    return false;
}

function hasNonWhitespace(string: string, fromIndex: number): boolean {
    const { length } = string;
    for (let i = fromIndex; i < length; i++) {
        if (!isWhiteSpace(string.charCodeAt(i))) {
            return true;
        }
    }
    return false;
}

function indexOfWhiteSpace(string: string, fromIndex: number): number {
    const { length } = string;
    for (let i = fromIndex; i < length; i++) {
        if (isWhiteSpace(string.charCodeAt(i))) {
            return i;
        }
    }
    // Rather than -1, this function returns the length of the string if no match is found,
    // so it works well with the Math.min() usage above:
    return length;
}

function isCharacterReferenceCharacter(charCode: number): boolean {
    return (
        (charCode >= 48 && charCode <= 57) ||
        (charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122)
    );
}

function isLineBreak(string: string, index: number): boolean {
    switch (string.charCodeAt(index)) {
        case NEWLINE_CHAR_CODE:
            return true;
        case TAG_OPEN_CHAR_CODE: {
            const newlineElements = `(${BLOCK_ELEMENTS.join("|")}|br)`;
            const newlineRegExp = new RegExp(`^<${newlineElements}[\t\n\f\r ]*/?>`, "i");
            return newlineRegExp.test(string.slice(index));
        }
        default:
            return false;
    }
}

function isWhiteSpace(charCode: number): boolean {
    return (
        charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 || charCode === 32
    );
}

/**
 * Certain tags don't display their whitespace-only content. In such cases, we
 * should simplify the whitespace before counting it.
 */
function shouldSimplifyWhiteSpace(tagStack: Array<string>): boolean {
    for (let i = tagStack.length - 1; i >= 0; i--) {
        const tagName = tagStack[i];
        if (tagName === "li" || tagName === "td") {
            return false;
        }
        if (tagName === "ol" || tagName === "table" || tagName === "ul") {
            return true;
        }
    }
    return false;
}

function simplifyWhiteSpace(string: string): string {
    return string.trim().replace(SIMPLIFY_WHITESPACE_REGEX, " ");
}

function takeCharAt(string: string, index: number): string {
    const charCode = string.charCodeAt(index);
    if ((charCode & 0xfc00) === 0xd800) {
        // high Unicode surrogate should never be separated from its matching low surrogate
        const nextCharCode = string.charCodeAt(index + 1);
        if ((nextCharCode & 0xfc00) === 0xdc00) {
            return String.fromCharCode(charCode, nextCharCode);
        }
    }
    return String.fromCharCode(charCode);
}

function takeHtmlCharAt(string: string, index: number): string {
    let char = takeCharAt(string, index);
    if (char === "&") {
        while (true /* eslint-disable-line */) {
            index++;
            const nextCharCode = string.charCodeAt(index);
            if (isCharacterReferenceCharacter(nextCharCode)) {
                char += String.fromCharCode(nextCharCode);
            } else if (nextCharCode === SEMICOLON_CHAR_CODE) {
                char += String.fromCharCode(nextCharCode);
                break;
            } else {
                break;
            }
        }
    }
    return char;
}
