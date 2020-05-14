# CHANGELOG

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
