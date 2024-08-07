"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Void elements are elements without inner content,
// which close themselves regardless of trailing slash.
// E.g. both <br> and <br /> are self-closing.
var VOID_ELEMENTS = [
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
var BLOCK_ELEMENTS = [
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
var NEWLINE_CHAR_CODE = 10; // '\n'
var EXCLAMATION_CHAR_CODE = 33; // '!'
var DOUBLE_QUOTE_CHAR_CODE = 34; // '"'
var AMPERSAND_CHAR_CODE = 38; // '&'
var SINGLE_QUOTE_CHAR_CODE = 39; // '\''
var FORWARD_SLASH_CHAR_CODE = 47; // '/'
var SEMICOLON_CHAR_CODE = 59; // ';'
var TAG_OPEN_CHAR_CODE = 60; // '<'
var EQUAL_SIGN_CHAR_CODE = 61; // '='
var TAG_CLOSE_CHAR_CODE = 62; // '>'
var CHAR_OF_INTEREST_REGEX = /[<&\n\ud800-\udbff]/;
var SIMPLIFY_WHITESPACE_REGEX = /\s{2,}/g;
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
function clip(string, maxLength, options) {
    if (options === void 0) {
        options = {};
    }
    if (!string) {
        return "";
    }
    string = string.toString();
    return options.html
        ? clipHtml(string, maxLength, options)
        : clipPlainText(string, maxLength, options);
}
exports.default = clip;
function clipHtml(string, maxLength, options) {
    var _a = options.imageWeight,
        imageWeight = _a === void 0 ? 2 : _a,
        _b = options.indicator,
        indicator = _b === void 0 ? "\u2026" : _b,
        _c = options.maxLines,
        maxLines = _c === void 0 ? Infinity : _c;
    var numChars = indicator.length;
    var numLines = 1;
    var i = 0;
    var isUnbreakableContent = false;
    var tagStack = []; // Stack of currently open HTML tags.
    var length = string.length;
    for (; i < length; i++) {
        var rest = i ? string.slice(i) : string;
        var nextIndex = rest.search(CHAR_OF_INTEREST_REGEX);
        var nextBlockSize = nextIndex > -1 ? nextIndex : rest.length;
        i += nextBlockSize;
        if (!isUnbreakableContent) {
            if (shouldSimplifyWhiteSpace(tagStack)) {
                numChars += simplifyWhiteSpace(
                    nextBlockSize === rest.length ? rest : rest.slice(0, nextIndex),
                ).length;
                if (numChars > maxLength) {
                    i -= nextBlockSize; // We just cut off the entire incorrectly placed text...
                    break;
                }
            } else {
                numChars += nextBlockSize;
                if (numChars > maxLength) {
                    i = Math.max(i - numChars + maxLength, 0);
                    break;
                }
            }
        }
        if (nextIndex === -1) {
            break;
        }
        var charCode = string.charCodeAt(i);
        if (charCode === TAG_OPEN_CHAR_CODE) {
            var nextCharCode = string.charCodeAt(i + 1);
            var isSpecialTag = nextCharCode === EXCLAMATION_CHAR_CODE;
            if (isSpecialTag && string.substr(i + 2, 2) === "--") {
                var commentEndIndex = string.indexOf("-->", i + 4) + 3;
                i = commentEndIndex - 1; // - 1 because the outer for loop will increment it
            } else if (isSpecialTag && string.substr(i + 2, 7) === "[CDATA[") {
                var cdataEndIndex = string.indexOf("]]>", i + 9) + 3;
                i = cdataEndIndex - 1; // - 1 because the outer for loop will increment it
                // note we don't count CDATA text for our character limit because it is only
                // allowed within SVG and MathML content, both of which we don't clip
            } else {
                // don't open new tags if we are currently at the limit
                if (
                    numChars === maxLength &&
                    string.charCodeAt(i + 1) !== FORWARD_SLASH_CHAR_CODE
                ) {
                    numChars++;
                    break;
                }
                var attributeQuoteCharCode = 0;
                var endIndex = i;
                var isAttributeValue = false;
                while (true /* eslint-disable-line */) {
                    endIndex++;
                    if (endIndex >= length) {
                        throw new Error("Invalid HTML: " + string);
                    }
                    var charCode_1 = string.charCodeAt(endIndex);
                    if (isAttributeValue) {
                        if (attributeQuoteCharCode) {
                            if (charCode_1 === attributeQuoteCharCode) {
                                isAttributeValue = false;
                            }
                        } else {
                            if (isWhiteSpace(charCode_1)) {
                                isAttributeValue = false;
                            } else if (charCode_1 === TAG_CLOSE_CHAR_CODE) {
                                isAttributeValue = false;
                                endIndex--; // re-evaluate this character
                            }
                        }
                    } else if (charCode_1 === EQUAL_SIGN_CHAR_CODE) {
                        while (isWhiteSpace(string.charCodeAt(endIndex + 1))) {
                            endIndex++; // skip whitespace
                        }
                        isAttributeValue = true;
                        var firstAttributeCharCode = string.charCodeAt(endIndex + 1);
                        if (
                            firstAttributeCharCode === DOUBLE_QUOTE_CHAR_CODE ||
                            firstAttributeCharCode === SINGLE_QUOTE_CHAR_CODE
                        ) {
                            attributeQuoteCharCode = firstAttributeCharCode;
                            endIndex++;
                        } else {
                            attributeQuoteCharCode = 0;
                        }
                    } else if (charCode_1 === TAG_CLOSE_CHAR_CODE) {
                        var isEndTag = string.charCodeAt(i + 1) === FORWARD_SLASH_CHAR_CODE;
                        var tagNameStartIndex = i + (isEndTag ? 2 : 1);
                        var tagNameEndIndex = Math.min(
                            indexOfWhiteSpace(string, tagNameStartIndex),
                            endIndex,
                        );
                        var tagName = string
                            .slice(tagNameStartIndex, tagNameEndIndex)
                            .toLowerCase();
                        if (tagName.charCodeAt(tagName.length - 1) === FORWARD_SLASH_CHAR_CODE) {
                            // Remove trailing slash for self-closing tag names like <br/>
                            tagName = tagName.slice(0, tagName.length - 1);
                        }
                        if (isEndTag) {
                            var currentTagName = tagStack.pop();
                            if (currentTagName !== tagName) {
                                throw new Error("Invalid HTML: " + string);
                            }
                            if (tagName === "math" || tagName === "svg") {
                                isUnbreakableContent =
                                    tagStack.includes("math") || tagStack.includes("svg");
                                if (!isUnbreakableContent) {
                                    numChars += imageWeight;
                                    if (numChars > maxLength) {
                                        break;
                                    }
                                }
                            }
                            if (BLOCK_ELEMENTS.includes(tagName)) {
                                // All block level elements should trigger a new line
                                // when truncating
                                if (!isUnbreakableContent) {
                                    numLines++;
                                    if (numLines > maxLines) {
                                        // If we exceed the max lines, push the tag back onto the
                                        // stack so that it will be added back correctly after
                                        // truncation
                                        tagStack.push(tagName);
                                        break;
                                    }
                                }
                            }
                        } else if (
                            VOID_ELEMENTS.includes(tagName) ||
                            string.charCodeAt(endIndex - 1) === FORWARD_SLASH_CHAR_CODE
                        ) {
                            if (tagName === "br") {
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
                            tagStack.push(tagName);
                            if (tagName === "math" || tagName === "svg") {
                                isUnbreakableContent = true;
                            }
                        }
                        i = endIndex;
                        break;
                    }
                }
                if (numChars > maxLength || numLines > maxLines) {
                    break;
                }
            }
        } else if (charCode === AMPERSAND_CHAR_CODE) {
            var endIndex = i + 1;
            var isCharacterReference = true;
            while (true /* eslint-disable-line */) {
                var charCode_2 = string.charCodeAt(endIndex);
                if (isCharacterReferenceCharacter(charCode_2)) {
                    endIndex++;
                } else if (charCode_2 === SEMICOLON_CHAR_CODE) {
                    break;
                } else {
                    isCharacterReference = false;
                    break;
                }
            }
            if (!isUnbreakableContent) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }
            }
            if (isCharacterReference) {
                i = endIndex;
            }
        } else if (charCode === NEWLINE_CHAR_CODE) {
            if (!isUnbreakableContent && !shouldSimplifyWhiteSpace(tagStack)) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }
                numLines++;
                if (numLines > maxLines) {
                    break;
                }
            }
        } else {
            if (!isUnbreakableContent) {
                numChars++;
                if (numChars > maxLength) {
                    break;
                }
            }
            // high Unicode surrogate should never be separated from its matching low surrogate
            var nextCharCode = string.charCodeAt(i + 1);
            if ((nextCharCode & 0xfc00) === 0xdc00) {
                i++;
            }
        }
    }
    if (numChars > maxLength) {
        var nextChar = takeHtmlCharAt(string, i);
        if (indicator) {
            var peekIndex = i + nextChar.length;
            while (
                string.charCodeAt(peekIndex) === TAG_OPEN_CHAR_CODE &&
                string.charCodeAt(peekIndex + 1) === FORWARD_SLASH_CHAR_CODE
            ) {
                var nextPeekIndex = string.indexOf(">", peekIndex + 2) + 1;
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
            var tagName = tagStack.pop();
            var tagEndIndex = tagName ? string.indexOf(">", i + 2) : -1;
            if (tagEndIndex === -1 || string.slice(i + 2, tagEndIndex).trim() !== tagName) {
                throw new Error("Invalid HTML: " + string);
            }
            i = tagEndIndex + 1;
            nextChar = string.charAt(i);
        }
        if (i < string.length) {
            if (!options.breakWords) {
                // try to clip at word boundaries, if desired
                for (var j = i - indicator.length; j >= 0; j--) {
                    var charCode = string.charCodeAt(j);
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
            var result = string.slice(0, i);
            if (!isLineBreak(string, i)) {
                result += indicator;
            }
            while (tagStack.length) {
                var tagName = tagStack.pop();
                result += "</" + tagName + ">";
            }
            return result;
        }
    } else if (numLines > maxLines) {
        var result = string.slice(0, i);
        while (tagStack.length) {
            var tagName = tagStack.pop();
            result += "</" + tagName + ">";
        }
        return result;
    }
    return string;
}
function clipPlainText(string, maxLength, options) {
    var _a = options.indicator,
        indicator = _a === void 0 ? "\u2026" : _a,
        _b = options.maxLines,
        maxLines = _b === void 0 ? Infinity : _b;
    var numChars = indicator.length;
    var numLines = 1;
    var i = 0;
    var length = string.length;
    for (; i < length; i++) {
        numChars++;
        if (numChars > maxLength) {
            break;
        }
        var charCode = string.charCodeAt(i);
        if (charCode === NEWLINE_CHAR_CODE) {
            numLines++;
            if (numLines > maxLines) {
                break;
            }
        } else if ((charCode & 0xfc00) === 0xd800) {
            // high Unicode surrogate should never be separated from its matching low surrogate
            var nextCharCode = string.charCodeAt(i + 1);
            if ((nextCharCode & 0xfc00) === 0xdc00) {
                i++;
            }
        }
    }
    if (numChars > maxLength) {
        var nextChar = takeCharAt(string, i);
        if (indicator) {
            var peekIndex = i + nextChar.length;
            if (peekIndex === string.length) {
                return string;
            } else if (string.charCodeAt(peekIndex) === NEWLINE_CHAR_CODE) {
                return string.slice(0, i + nextChar.length);
            }
        }
        if (!options.breakWords) {
            // try to clip at word boundaries, if desired
            for (var j = i - indicator.length; j >= 0; j--) {
                var charCode = string.charCodeAt(j);
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
        return string.slice(0, i) + (nextChar === "\n" ? "" : indicator);
    } else if (numLines > maxLines) {
        return string.slice(0, i);
    }
    return string;
}
function indexOfWhiteSpace(string, fromIndex) {
    var length = string.length;
    for (var i = fromIndex; i < length; i++) {
        if (isWhiteSpace(string.charCodeAt(i))) {
            return i;
        }
    }
    // Rather than -1, this function returns the length of the string if no match is found,
    // so it works well with the Math.min() usage above:
    return length;
}
function isCharacterReferenceCharacter(charCode) {
    return (
        (charCode >= 48 && charCode <= 57) ||
        (charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122)
    );
}
function isLineBreak(string, index) {
    var firstCharCode = string.charCodeAt(index);
    if (firstCharCode === NEWLINE_CHAR_CODE) {
        return true;
    } else if (firstCharCode === TAG_OPEN_CHAR_CODE) {
        var newlineElements = "(" + BLOCK_ELEMENTS.join("|") + "|br)";
        var newlineRegExp = new RegExp("^<" + newlineElements + "[\t\n\f\r ]*/?>", "i");
        return newlineRegExp.test(string.slice(index));
    } else {
        return false;
    }
}
function isWhiteSpace(charCode) {
    return (
        charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 || charCode === 32
    );
}
/**
 * Certain tags don't display their whitespace-only content. In such cases, we
 * should simplify the whitespace before counting it.
 */
function shouldSimplifyWhiteSpace(tagStack) {
    for (var i = tagStack.length - 1; i >= 0; i--) {
        var tagName = tagStack[i];
        if (tagName === "li" || tagName === "td") {
            return false;
        }
        if (tagName === "ol" || tagName === "table" || tagName === "ul") {
            return true;
        }
    }
    return false;
}
function simplifyWhiteSpace(string) {
    return string.trim().replace(SIMPLIFY_WHITESPACE_REGEX, " ");
}
function takeCharAt(string, index) {
    var charCode = string.charCodeAt(index);
    if ((charCode & 0xfc00) === 0xd800) {
        // high Unicode surrogate should never be separated from its matching low surrogate
        var nextCharCode = string.charCodeAt(index + 1);
        if ((nextCharCode & 0xfc00) === 0xdc00) {
            return String.fromCharCode(charCode, nextCharCode);
        }
    }
    return String.fromCharCode(charCode);
}
function takeHtmlCharAt(string, index) {
    var char = takeCharAt(string, index);
    if (char === "&") {
        while (true /* eslint-disable-line */) {
            index++;
            var nextCharCode = string.charCodeAt(index);
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
