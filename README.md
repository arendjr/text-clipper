# text-clipper.js

Fast and correct clip functions for HTML and plain text.

## Why use text-clipper?

text-clipper offers the following advantages over similar libraries that allow clipping HTML:

-   **Correctness**
    -   HTML is processed through a proper state machine, no regular expression hacks.
    -   Valid HTML input always produces valid HTML output.
    -   Heavily unit-tested to support the above statement.
-   **Proper Unicode handling**
    -   Unicode-awareness makes sure Unicode characters such as emojis don't get clipped halfway.
-   **Performance**
    -   Text-clipper has been carefully optimized and is typically as fast as or faster than its
        competitors (see: [blog](http://www.arendjr.nl/2016/09/how-i-made-text-clipper-fastest-html.html)).
-   **Consistent API and behavior for both HTML and plain text**

## Usage

### Deno

First install the package:

```sh
$ deno add @arendjr/text-clipper
```

Once installed, you can use it as follows:

```js
import clip from "@arendjr/text-clipper";

const clippedString = clip(string, 80); // returns a string of at most 80 characters

const clippedHtml = clip(htmlString, 140, { html: true, maxLines: 5 });
```

### Bun

Install using the following command instead:

```sh
$ bunx jsr add @arendjr/text-clipper
```

For usage instructions, see above.

### Node.js

Install using one of the following commands, depending on your package manager:

```sh
$ npx jsr add @arendjr/text-clipper # If using NPM
$ yarn dlx jsr add @arendjr/text-clipper # If using Yarn
$ pnpm dlx jsr add @arendjr/text-clipper # If using PNPM
```

For usage instructions, see above.

## Options

### breakWords

By default, text-clipper tries to break only at word boundaries so words don't get clipped halfway.
Set this option to `true` if you want words to be broken up.

### html

By default, text-clipper treats the input string as plain text. This is undesirable if the input
string is HTML, because it might result in broken HTML tags. Set this option to `true` to make
text-clipper treat the input as HTML, in which case it will try to always return valid HTML,
provided the input is valid as well.

### imageWeight

The amount of characters to assume for images. This is used whenever an image is encountered, but
also for embedded SVG and MathML content. The default is 2.

### indicator

The string to insert to indicate the string was clipped. Default: `'…'`.

Note that the indicator is never inserted if only whitespace remains after the clipping point.

### insertIndicatorAtLinebreak

Whether the indicator should be inserted when the text is clipped at a linebreak. Default: `true`.

### maxLines

Maximum amount of lines allowed. If given, the string will be clipped either at the moment the
maximum amount of characters is exceeded or the moment maxLines newlines are discovered, whichever
comes first.

Note when in HTML mode, block-level elements trigger newlines and text-clipper assumes the text
will be displayed with a CSS white-space setting that treats `\n` as a line break. Of course the
HTML tag `<br>` is also counted.

### stripTags

Optional list of tags to be stripped from the input HTML. May be set to `true` to strip all tags.
Only supported in combination with `html: true`.

Example:

```js
// Strips all images from the input string:
clip(input, 140, { html: true, stripTags: ["img", "svg"] });
```

Tag names must be specified in lowercase.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Licensed under the MIT License.

See [LICENSE](LICENSE).
