const VOID_ELEMENTS = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
                       'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const NEWLINE_CHAR_CODE = 10; // '\n'
const DOUBLE_QUOTE_CHAR_CODE = 34; // '"'
const AMPERSAND_CHAR_CODE = 38; // '&'
const SINGLE_QUOTE_CHAR_CODE = 39; // '\''
const FORWARD_SLASH_CHAR_CODE = 47; // '/'
const SEMICOLON_CHAR_CODE = 59; // ';'
const TAG_OPEN_CHAR_CODE = 60; // '<'
const EQUAL_SIGN_CHAR_CODE = 61; // '='
const TAG_CLOSE_CHAR_CODE = 62; // '>'

const TRIM_END_REGEX = /\s+$/;

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

    let attributeQuoteCharCode = 0;
    let isAttributeValue = false;
    let isEntity = false;
    let isTag = false;
    let isUnbreakableContent = false;
    let startIndex = -1;
    const tagStack = [];
    const { length } = string;
    for (let i = 0; i < length; i++) {
        const charCode = string.charCodeAt(i);

        if (isEntity) {
            if (charCode === SEMICOLON_CHAR_CODE) {
                isEntity = false;

                numChars++;
                if (numChars > maxLength) {
                    break;
                }

                result += string.slice(startIndex, i + 1);
            }
        } else if (isTag) {
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
                        i--; // re-evaluate this character
                    }
                }
            } else if (charCode === EQUAL_SIGN_CHAR_CODE) {
                while (isWhiteSpace(string.charCodeAt(i + 1))) {
                    i++; // skip whitespace
                }
                isAttributeValue = true;

                const firstAttributeCharCode = string.charCodeAt(i + 1);
                if (firstAttributeCharCode === DOUBLE_QUOTE_CHAR_CODE ||
                    firstAttributeCharCode === SINGLE_QUOTE_CHAR_CODE) {
                    attributeQuoteCharCode = firstAttributeCharCode;
                    i++;
                } else {
                    attributeQuoteCharCode = 0;
                }
            } else if (charCode === TAG_CLOSE_CHAR_CODE) {
                isTag = false;

                const isEndTag = (string.charCodeAt(startIndex + 1) === FORWARD_SLASH_CHAR_CODE);
                const tagNameStartIndex = startIndex + (isEndTag ? 2 : 1);
                const tagNameEndIndex = Math.min(indexOfWhiteSpace(string, tagNameStartIndex), i);
                const tagName = string.slice(tagNameStartIndex, tagNameEndIndex).toLowerCase();

                if (isEndTag) {
                    const currentTagName = tagStack.pop();
                    if (currentTagName !== tagName) {
                        throw new Error('Invalid HTML: ' + string);
                    }

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
                } else if (VOID_ELEMENTS.includes(tagName) ||
                           string.charCodeAt(i - 1) === FORWARD_SLASH_CHAR_CODE) {
                    if (tagName === 'br') {
                        numLines++;
                        if (numLines > maxLines) {
                            break;
                        }
                    } else if (tagName === 'img') {
                        numChars += imageWeight;
                        if (numChars > maxLength) {
                            break;
                        }
                    }
                } else {
                    tagStack.push(tagName);
                    if (tagName === 'math' || tagName === 'svg') {
                        isUnbreakableContent = true;
                    }
                }

                result += string.slice(startIndex, i + 1);
            }
        } else if (charCode === TAG_OPEN_CHAR_CODE) {
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
                if (numChars === maxLength &&
                    string.charCodeAt(i + 1) !== FORWARD_SLASH_CHAR_CODE) {
                    numChars++;
                    break;
                }

                isTag = true;
                startIndex = i;
            }
        } else if (charCode === AMPERSAND_CHAR_CODE) {
            isEntity = true;
            startIndex = i;
        } else {
            if (!isUnbreakableContent) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }

                if (charCode === NEWLINE_CHAR_CODE) {
                    numLines++;
                    if (numLines > maxLines) {
                        break;
                    }
                }
            }

            result += String.fromCharCode(charCode);
            if ((charCode & 0xfc00) === 0xd800) {
                // high Unicode surrogate should never be separated from its matching low surrogate
                const nextCharCode = string.charCodeAt(i + 1);
                if ((nextCharCode & 0xfc00) === 0xdc00) {
                    result += String.fromCharCode(nextCharCode);
                    i++;
                }
            }
        }
    }

    if (isEntity || isTag) {
        throw new Error('Invalid HTML: ' + string);
    }

    if (numChars > maxLength) {
        let nextChar = takeCharAt(string, result.length);
        let peekIndex = result.length + nextChar.length;
        while (peekIndex && string.charCodeAt(peekIndex) === TAG_OPEN_CHAR_CODE &&
                            string.charCodeAt(peekIndex + 1) === FORWARD_SLASH_CHAR_CODE) {
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
        }

        // include closing tags before adding the clipping indicator if that's where they
        // are in the input string
        let resultLength = result.length;
        while (nextChar === '<' &&
               string.charCodeAt(resultLength + 1) === FORWARD_SLASH_CHAR_CODE) {
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

        if (result.length < string.length) {
            if (!options.breakWords) {
                // try to clip at word boundaries, if desired
                for (let i = result.length - 1; i >= 0; i--) {
                    const charCode = result.charCodeAt(i);
                    if (charCode === TAG_CLOSE_CHAR_CODE || charCode === SEMICOLON_CHAR_CODE) {
                        // these characters could be just regular characters, so if they occur in
                        // the middle of a word, they would "break" our attempt to prevent breaking
                        // of words, but given this seems highly unlikely and the alternative is
                        // doing another full parsing of the preceding text, this seems acceptable.
                        break;
                    } else if (charCode === NEWLINE_CHAR_CODE) {
                        result = result.slice(0, i);
                        break;
                    } else if (isWhiteSpace(charCode)) {
                        result = result.slice(0, i + 1);
                        break;
                    }
                }
            }

            if (!isLineBreak(string, result.length)) {
                result += options.indicator;
            }
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

    const { length } = string;
    for (let i = 0; i < length; i++) {
        const charCode = string.charCodeAt(i);

        numChars++;
        if (numChars > maxLength) {
            break;
        }

        if (charCode === NEWLINE_CHAR_CODE) {
            numLines++;
            if (numLines > maxLines) {
                break;
            }
        }

        result += String.fromCharCode(charCode);
        if ((charCode & 0xfc00) === 0xd800) {
            // high Unicode surrogate should never be separated from its matching low surrogate
            const nextCharCode = string.charCodeAt(i + 1);
            if ((nextCharCode & 0xfc00) === 0xdc00) {
                result += String.fromCharCode(nextCharCode);
                i++;
            }
        }
    }

    if (numChars > maxLength) {
        let nextChar = takeCharAt(string, result.length);
        const peekIndex = result.length + nextChar.length;
        if (peekIndex === string.length || string.charCodeAt(peekIndex) === NEWLINE_CHAR_CODE) {
            result += nextChar;
        } else {
            if (!options.breakWords) {
                // try to clip at word boundaries, if desired
                for (let i = result.length - 1; i >= 0; i--) {
                    const charCode = result.charCodeAt(i);
                    if (charCode === NEWLINE_CHAR_CODE) {
                        result = result.slice(0, i);
                        nextChar = '\n';
                        break;
                    } else if (isWhiteSpace(charCode)) {
                        result = result.slice(0, i + 1);
                        break;
                    }
                }
            }

            if (nextChar !== '\n') {
                result += options.indicator;
            }
        }
    }

    return result;
}

function indexOfWhiteSpace(string, fromIndex) {

    const { length } = string;
    for (let i = fromIndex; i < length; i++) {
        if (isWhiteSpace(string.charCodeAt(i))) {
            return i;
        }
    }
    // rather than -1, this function returns the length of the string if no match is found,
    // so it works well with the Math.min() usage below
    return length;
}

function isLineBreak(string, index) {

    const firstCharCode = string.charCodeAt(index);
    if (firstCharCode === NEWLINE_CHAR_CODE) {
        return true;
    } else if (firstCharCode === TAG_OPEN_CHAR_CODE) {
        return /<br[\t\n\f\r ]*\/?>/i.test(string.slice(index));
    } else {
        return false;
    }
}

function isWhiteSpace(charCode) {

    return charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 ||
           charCode === 32;
}

function takeCharAt(string, index) {

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
