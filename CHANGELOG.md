# CHANGELOG

## 3.0.0

-   `text-clipper` has become a Deno-first library and is now available on [Jsr.io](https://jsr.io).
    Instructions for installation on Node.js/Bun are still included.
-   Fix #18: Don't include spaces before the indicator.
-   Fix #19: Introduce a new option `insertIndicatorAtLinebreak` (default: `true`). If you want to
    keep the behavior of `text-clipper` v2, you should set this back to `false`.
-   Tweak in behavior: The indicator is never inserted if only whitespace remains after the
    clipping point.

## 2.2.0

-   Implement #14: Add `stripTags` option.
-   Tiny Unicode fix.
-   Treat `<audio>` and `<video>` as unbreakable elements.

## 2.1.0

-   Implement #12: Improve support for clipping HTML tables.

## 2.0.0

-   Use TypeScript primarily to ease Deno support.
-   Assume `Array.prototype.includes()` is available.
-   Upgraded development dependencies.

## 1.3.0

-   Add TypeScript definition.

## 1.2.4

-   Fix #7: Fix two edge cases:
    -   Incorrect result when `maxLength` is less than the size of the indicator.
    -   Incorrect indicator when the remaining HTML contains a mix of block and inline elements.
-   Tiny optimization when processing HTML tags.

## 1.2.3

-   Fix #4: Correct clip length when using no indicator (indicator is an empty string).
-   Fix #5: Support ampersands that do not start an HTML character reference.

## 1.2.2

-   Fix building in React Native.

## 1.2.1

-   Improved tag handling and newline counting (#2, thanks to @churchs19).
