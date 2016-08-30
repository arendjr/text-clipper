const VOID_ELEMENTS = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
                       'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const TRIM_END_REGEX = /\s+$/;
const WHITESPACE_REGEX = /^\s+$/;

/**
 * Clips a string to a maximum length. If the string exceeds the length, it is truncated and an
 * indicator (an ellipsis, by default) is appended.
 *
 * In detail, the clipping rules are as follows:
 * - The resulting clipped string may never contain more than maxLength characters. Examples:
 *   - _.clip("foo", 3) => "foo"
 *   - _.clip("foo", 2) => "f…"
 * - The indicator is inserted if and only if the string is clipped at any place other than a
 *   newline. Examples:
 *   - _.clip("foo bar", 5) => "foo …"
 *   - _.clip("foo\nbar", 5) => "foo"
 * - If the html option is true and valid HTML is inserted, the clipped output *must* also be valid
 *   HTML. If the input is not valid HTML, the result is undefined (not to be confused with JS'
 *   "undefined" type; some errors might be detected and result in an exception, but this is not
 *   guaranteed).
 *
 * @param string The string to clip.
 * @param maxLength The maximum length of the clipped string in number of characters.
 * @param options Optional options object. May contain the following property:
 *                breakWords - By default, we try to break only at word boundaries. Set to true if
 *                             this is undesired.
 *                html - Set to true if the string is HTML-encoded. If so, this method will take
 *                       extra care to make sure the HTML-encoding is correctly maintained.
 *                imageWeight - The amount of characters to assume for images. This is used
 *                              whenever an image is encountered, but also for SVG and MathML
 *                              content. Default: 2.
 *                indicator - The string to insert to indicate clipping. Default: "…".
 *                maxLines - Maximum amount of lines allowed. If given, the string will be
 *                           clipped either at the moment the maximum amount of characters is
 *                           exceeded or the moment maxLines newlines are discovered, whichever
 *                           comes first.
 *
 * @return The clipped string.
 */
module.exports = function clip(string, maxLength, options = {}) {

    if (!string) {
        return '';
    }

    string = string.toString();

    if (options.indicator === undefined) {
        options.indicator = '\u2026';
    }

    return (options.html ? clipHtml(string, maxLength, options)
                         : clipPlainText(string, maxLength, options));
};


function clipHtml(string, maxLength, options) {

    const { imageWeight = 2, maxLines } = options;

    let result = '';

    let numChars = 1;
    let numLines = 1;

    let attributeQuoteChar = '';
    let isAttributeValue = false;
    let isEntity = false;
    let isTag = false;
    let isUnbreakableContent = false;
    let lastCharacterWasWhitespace = false;
    let lastPreferredClipIndex = -1;
    let startIndex = -1;
    let shouldIncludeIndicator = true;
    const tagStack = [];
    const { length } = string;
    for (let i = 0; i < length; i++) {
        const char = takeCharAt(string, i);
        i += (char.length - 1);

        if (isAttributeValue) {
            if (attributeQuoteChar) {
                if (char === attributeQuoteChar) {
                    isAttributeValue = false;
                }
            } else {
                if (isHtmlSpace(char)) {
                    isAttributeValue = false;
                } else if (char === '>') {
                    isAttributeValue = false;
                    i--; // re-evaluate this character
                }
            }
        } else if (isEntity) {
            if (char === ';') {
                isEntity = false;

                numChars++;
                if (numChars > maxLength) {
                    break;
                }

                result += string.slice(startIndex, i + 1);
            }
        } else if (isTag) {
            if (char === '=') {
                while (isHtmlSpace(string.charAt(i + 1))) {
                    i++; // skip whitespace
                }
                isAttributeValue = true;

                const firstAttributeChar = string.charAt(i + 1);
                if (firstAttributeChar === '"' || firstAttributeChar === '\'') {
                    attributeQuoteChar = firstAttributeChar;
                    i++;
                } else {
                    attributeQuoteChar = '';
                }
            } else if (char === '>') {
                isTag = false;

                const isEndTag = (string.charAt(startIndex + 1) === '/');
                const tagNameStartIndex = startIndex + (isEndTag ? 2 : 1);
                const tagNameEndIndex = Math.min(indexOfHtmlSpace(string, tagNameStartIndex), i);
                const tagName = string.slice(tagNameStartIndex, tagNameEndIndex).toLowerCase();

                if (isEndTag) {
                    const currentTagName = tagStack.pop();
                    if (currentTagName !== tagName) {
                        throw new Error('Invalid HTML: ' + string);
                    }

                    lastPreferredClipIndex = -1; // we should never go back and clip before the end
                                                 // tag as that might leave the tag unclosed

                    if (tagName === 'math' || tagName === 'svg') {
                        isUnbreakableContent = (tagStack.includes('math') ||
                                                tagStack.includes('svg'));
                        if (!isUnbreakableContent) {
                            numChars += imageWeight;
                            if (numChars > maxLength) {
                                break;
                            }
                        }
                    }
                } else if (VOID_ELEMENTS.includes(tagName) || string.charAt(i - 1) === '/') {
                    if (tagName === 'br') {
                        numLines++;
                        if (numLines > maxLines) {
                            break;
                        }

                        lastPreferredClipIndex = startIndex;
                        shouldIncludeIndicator = false;
                    } else if (tagName === 'img') {
                        numChars += imageWeight;
                        if (numChars > maxLength) {
                            break;
                        }

                        lastPreferredClipIndex = i + 1;
                        shouldIncludeIndicator = true;
                    }
                } else {
                    tagStack.push(tagName);
                    if (tagName === 'math' || tagName === 'svg') {
                        isUnbreakableContent = true;
                    }
                }

                result += string.slice(startIndex, i + 1);
            }
        } else if (char === '<') {
            if (string.substr(i + 1, 3) === '!--') {
                const commentEndIndex = string.indexOf('-->', i + 4) + 3;
                result += string.slice(i, commentEndIndex);
                i = commentEndIndex - 1; // - 1 because the outer for loop will increment it
            } else if (string.substr(i + 1, 8) === '![CDATA[') {
                const cdataEndIndex = string.indexOf(']]>', i + 9) + 3;
                result += string.slice(i, cdataEndIndex);
                i = cdataEndIndex - 1; // - 1 because the outer for loop will increment it

                // note we don't count CDATA text for our character limit because it is only
                // allowed within SVG and MathML content, both of which we don't clip
            } else {
                // don't open new tags if we are currently at the limit
                if (numChars === maxLength && string.charAt(i + 1) !== '/') {
                    numChars++;
                    break;
                }

                isTag = true;
                startIndex = i;
            }
        } else if (char === '&') {
            isEntity = true;
            startIndex = i;
        } else {
            if (!isUnbreakableContent) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }

                if (char === '\n') {
                    lastPreferredClipIndex = i;
                    shouldIncludeIndicator = false;

                    numLines++;
                    if (numLines > maxLines) {
                        break;
                    }
                } else if (isWhiteSpace(char)) {
                    lastCharacterWasWhitespace = true;
                } else if (lastCharacterWasWhitespace) {
                    lastPreferredClipIndex = i;
                    lastCharacterWasWhitespace = false;
                    shouldIncludeIndicator = true;
                }
            }

            result += char;
        }
    }

    if (isEntity || isTag) {
        throw new Error('Invalid HTML: ' + string);
    }

    if (numChars > maxLength || numLines > maxLines) {
        if (numChars > maxLength) {
            let nextChar = takeCharAt(string, result.length);
            let peekIndex = result.length + nextChar.length;
            while (peekIndex && string.charAt(peekIndex) === '<' &&
                                string.charAt(peekIndex + 1) === '/') {
                peekIndex = string.indexOf('>', result.length + 2) + 1;
            }

            if (peekIndex && (peekIndex === string.length || isLineBreak(string, peekIndex))) {
                // if there's only a single character remaining in the input string, or the next
                // character is followed by a line-break, we can include it instead of the clipping
                // indicator (provided it's not a special HTML character)
                if (nextChar === '<' || nextChar === '&') {
                    throw new Error('Invalid HTML: ' + string);
                }

                result += nextChar;
                nextChar = string.charAt(result.length);
                shouldIncludeIndicator = false;
                lastPreferredClipIndex = -1;
            } else if (lastCharacterWasWhitespace) {
                lastPreferredClipIndex = result.length;
                lastCharacterWasWhitespace = false;
                shouldIncludeIndicator = true;
            }

            // include closing tags before adding the clipping indicator if that's where they
            // are in the input string
            let resultLength = result.length;
            while (nextChar === '<' && string.charAt(resultLength + 1) === '/') {
                const tagName = tagStack.pop();
                const tagEndIndex = (tagName ? string.indexOf('>', resultLength + 2) : -1);
                if (tagEndIndex === -1 || string.replace(TRIM_END_REGEX, '')
                                                .slice(resultLength + 2, tagEndIndex) !== tagName) {
                    throw new Error('Invalid HTML: ' + string);
                }

                result += string.slice(resultLength, tagEndIndex + 1);
                resultLength = result.length;
                nextChar = string.charAt(resultLength);
            }
        }

        if (!options.breakWords && lastPreferredClipIndex > 0) {
            // try to clip at word boundaries, if desired
            result = result.slice(0, lastPreferredClipIndex);
        }

        if (shouldIncludeIndicator) {
            result += options.indicator;
        }
    }

    while (tagStack.length) {
        const tagName = tagStack.pop();
        result += `</${tagName}>`;
    }

    return result;
}

function clipPlainText(string, maxLength, options) {

    const { maxLines } = options;

    let result = '';

    let numChars = 1;
    let numLines = 1;

    let lastCharacterWasWhitespace = false;
    let lastPreferredClipIndex = -1;
    let shouldIncludeIndicator = true;
    const { length } = string;
    for (let i = 0; i < length; i++) {
        const char = takeCharAt(string, i);
        i += (char.length - 1);

        numChars++;
        if (numChars > maxLength) {
            break;
        }

        if (char === '\n') {
            lastPreferredClipIndex = i;
            shouldIncludeIndicator = false;

            numLines++;
            if (numLines > maxLines) {
                break;
            }
        } else if (isWhiteSpace(char)) {
            lastCharacterWasWhitespace = true;
        } else if (lastCharacterWasWhitespace) {
            lastPreferredClipIndex = i;
            lastCharacterWasWhitespace = false;
            shouldIncludeIndicator = true;
        }

        result += char;
    }

    if (numChars > maxLength || numLines > maxLines) {
        if (numChars > maxLength) {
            const nextChar = takeCharAt(string, result.length);
            const peekIndex = result.length + nextChar.length;
            if (peekIndex && (peekIndex === string.length || isLineBreak(string, peekIndex))) {
                result += nextChar;
                shouldIncludeIndicator = false;
                lastPreferredClipIndex = -1;
            } else if (lastCharacterWasWhitespace) {
                lastPreferredClipIndex = result.length;
                lastCharacterWasWhitespace = false;
                shouldIncludeIndicator = true;
            }
        }

        if (!options.breakWords && lastPreferredClipIndex > 0) {
            // try to clip at word boundaries, if desired
            result = result.slice(0, lastPreferredClipIndex);
        }

        if (shouldIncludeIndicator) {
            result += options.indicator;
        }
    }

    return result;
}

function indexOfHtmlSpace(string, fromIndex) {

    const { length } = string;
    for (let i = fromIndex; i < length; i++) {
        if (isHtmlSpace(string.charAt(i))) {
            return i;
        }
    }
    // rather than -1, this function returns the length of the string if no match is found,
    // so it works well with the Math.min() usage below
    return length;
}

function isHtmlSpace(char) {

    return (char === '\t' || char === '\n' || char === '\f' || char === '\r' || char === ' ');
}

function isLineBreak(string, index) {

    const firstChar = string.charAt(index);
    if (firstChar === '\n') {
        return true;
    } else if (firstChar === '<') {
        return /<br[\t\n\f\r ]*\/?>/i.test(string.slice(index));
    } else {
        return false;
    }
}

function isWhiteSpace(string) {

    return WHITESPACE_REGEX.test(string);
}

function takeCharAt(string, index) {

    let char = string.charAt(index);
    if (char >= '\ud800' && char < '\udc00') {
        // high Unicode surrogate should never be separated from its matching low surrogate
        const nextChar = string.charAt(index + 1);
        if (nextChar >= '\udc00' && nextChar < '\ue000') {
            char += nextChar;
        }
    }
    return char;
}
