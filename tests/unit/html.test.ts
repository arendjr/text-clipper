import { assertEquals } from "jsr:@std/assert";

import clip from "../../src/index.ts";

Deno.test("html: test basic HTML", () => {
    const options = { html: true };

    assertEquals(clip("<p>Lorum ipsum</p>", 5, options), "<p>Loru\u2026</p>");
    assertEquals(clip("<p><i>Lorum</i> <i>ipsum</i></p>", 5, options), "<p><i>Loru\u2026</i></p>");
    assertEquals(clip("<p><i>Lorum</i> <i>ipsum</i></p>", 6, options), "<p><i>Lorum</i>\u2026</p>");
    assertEquals(clip("<p><i>Lorum</i> <i>ipsum</i></p>", 7, options), "<p><i>Lorum</i>\u2026</p>");
    assertEquals(clip("<p><i>Lorum</i>\n<i>ipsum</i></p>", 5, options), "<p><i>Lorum</i></p>");
    assertEquals(clip("<p><i>Lorum</i><br><i>ipsum</i></p>", 5, options), "<p><i>Lorum</i></p>");

    assertEquals(clip("<p><i>Lorum</i></p>", 5, options), "<p><i>Lorum</i></p>");

    assertEquals(clip("<p><i>Lorum</i>a</p>", 5, options), "<p><i>Loru\u2026</i></p>");
    assertEquals(clip("<p><i>Lorum</i></p>a", 5, options), "<p><i>Loru\u2026</i></p>");
    assertEquals(clip("<p><i>Lorum</i>a</p>", 6, options), "<p><i>Lorum</i>a</p>");
    assertEquals(clip("<p><i>Lorum</i></p>a", 6, options), "<p><i>Lorum</i></p>a");
    assertEquals(clip("<p><i>Lorum</i>aA</p>", 6, options), "<p><i>Lorum</i>\u2026</p>");
    assertEquals(clip("<p><i>Lorum</i></p>aA", 6, options), "<p><i>Lorum</i></p>\u2026");
    assertEquals(clip("<p><i>Lorum</i>a</p>", 7, options), "<p><i>Lorum</i>a</p>");
    assertEquals(clip("<p><i>Lorum</i></p>a", 7, options), "<p><i>Lorum</i></p>a");
    assertEquals(clip("<p><i>Lorum</i>aA</p>", 7, options), "<p><i>Lorum</i>aA</p>");
    assertEquals(clip("<p><i>Lorum</i></p>aA", 7, options), "<p><i>Lorum</i></p>aA");

    assertEquals(clip("<p><i>Lorum</i> </p>", 5, options), "<p><i>Loru\u2026</i></p>");
    assertEquals(clip("<p><i>Lorum</i></p> ", 5, options), "<p><i>Loru\u2026</i></p>");
    assertEquals(clip("<p><i>Lorum</i> </p>", 6, options), "<p><i>Lorum</i> </p>");
    assertEquals(clip("<p><i>Lorum</i></p> ", 6, options), "<p><i>Lorum</i></p> ");
    assertEquals(clip("<p><i>Lorum</i>  </p>", 6, options), "<p><i>Lorum</i>\u2026</p>");
    assertEquals(clip("<p><i>Lorum</i></p>  ", 6, options), "<p><i>Lorum</i></p>\u2026");
    assertEquals(clip("<p><i>Lorum</i> </p>", 7, options), "<p><i>Lorum</i> </p>");
    assertEquals(clip("<p><i>Lorum</i></p> ", 7, options), "<p><i>Lorum</i></p> ");
    assertEquals(clip("<p><i>Lorum</i>  </p>", 7, options), "<p><i>Lorum</i>  </p>");
    assertEquals(clip("<p><i>Lorum</i></p>  ", 7, options), "<p><i>Lorum</i></p>  ");

    assertEquals(clip("Lo<ins>rum</ins>", 4, options), "Lo<ins>r\u2026</ins>");
    assertEquals(clip("Lo<del>rum</del>", 4, options), "Lo<del>r\u2026</del>");

    assertEquals(
        clip('<a href="http://just-a-link.com">Just a link</a>', 8, options),
        '<a href="http://just-a-link.com">Just a\u2026</a>',
    );

    assertEquals(
        clip('<a href="http://just-a-link.com">Just a link</a>, yo', 13, options),
        '<a href="http://just-a-link.com">Just a link</a>,\u2026',
    );
});

Deno.test("html: test HTML comments", () => {
    const options = { html: true };

    assertEquals(
        clip("<b><!-- this is bold -->bold</b>", 4, options),
        "<b><!-- this is bold -->bold</b>",
    );

    assertEquals(
        clip("<b><!-- this is bold -->bold</b>", 3, options),
        "<b><!-- this is bold -->bo\u2026</b>",
    );
});

Deno.test("html: test special characters in attribute values", () => {
    const options = { html: true };

    assertEquals(clip('<b class="<i>">bold</b>', 4, options), '<b class="<i>">bold</b>');
    assertEquals(clip('<b class="<i>">bold</b>', 3, options), '<b class="<i>">bo\u2026</b>');
    assertEquals(clip("<b class=\"'test'\">bold</b>", 4, options), "<b class=\"'test'\">bold</b>");

    assertEquals(
        clip("<b class=\"'test'\">bold</b>", 3, options),
        "<b class=\"'test'\">bo\u2026</b>",
    );

    assertEquals(
        clip("<b class='javascript:alert(\"hoi\");'>bold</b>", 4, options),
        "<b class='javascript:alert(\"hoi\");'>bold</b>",
    );

    assertEquals(
        clip("<b class='javascript:alert(\"hoi\");'>bold</b>", 3, options),
        "<b class='javascript:alert(\"hoi\");'>bo\u2026</b>",
    );
});

Deno.test("html: test embedded SVG", () => {
    assertEquals(
        clip(
            "<p>" +
                '<svg width="100%" height="100%" viewBox="0 0 100 100"' +
                ' xmlns="http://www.w3.org/2000/svg">\n' +
                "<style>\n" +
                "/* <![CDATA[ */\n" +
                "circle {\n" +
                "fill: orange;\n" +
                "stroke: black;\n" +
                "stroke-width: 10px; " +
                "// Note that the value of a pixel depend on the viewBox\n" +
                "}\n" +
                "/* ]]> */\n" +
                "</style>\n" +
                "\n" +
                '<circle cx="50" cy="50" r="40" />\n' +
                "</svg>test\n" +
                "</p>",
            9,
            { html: true, imageWeight: 5 },
        ),
        "<p>" +
            '<svg width="100%" height="100%" viewBox="0 0 100 100"' +
            ' xmlns="http://www.w3.org/2000/svg">\n' +
            "<style>\n" +
            "/* <![CDATA[ */\n" +
            "circle {\n" +
            "fill: orange;\n" +
            "stroke: black;\n" +
            "stroke-width: 10px; " +
            "// Note that the value of a pixel depend on the viewBox\n" +
            "}\n" +
            "/* ]]> */\n" +
            "</style>\n" +
            "\n" +
            '<circle cx="50" cy="50" r="40" />\n' +
            "</svg>test" +
            "</p>",
    );
});

Deno.test("html: test unicode surrogate pairs", () => {
    const options = { html: true };

    assertEquals(clip("Lorum 𝌆", 7, options), "Lorum 𝌆");
    assertEquals(clip("𝌆𝌆𝌆𝌆", 4, options), "𝌆𝌆𝌆𝌆");
    assertEquals(clip("𝌆𝌆𝌆𝌆", 3, options), "𝌆𝌆…");
    assertEquals(clip("😔🙏👙😃🏧", 6, options), "😔🙏👙😃🏧");
    assertEquals(clip("😔🙏👙😃🏧", 5, options), "😔🙏👙😃🏧");
    assertEquals(clip("😔🙏👙😃🏧", 4, options), "😔🙏👙…");
    assertEquals(clip("😔🙏👙😃🏧", 3, options), "😔🙏…");
});

Deno.test("html: test plain text", () => {
    const options = { html: true };

    assertEquals(clip("Lorum ipsum", 5, options), "Loru\u2026");
    assertEquals(clip("Lorum ipsum", 6, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 7, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 8, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 9, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 10, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 11, options), "Lorum ipsum");

    assertEquals(clip("Lorum\nipsum", 10, options), "Lorum");

    assertEquals(clip("Lorum i", 7, options), "Lorum i");
    assertEquals(clip("Lorum \u2026", 7, options), "Lorum \u2026");
});

Deno.test("html: test word breaking", () => {
    const options = { breakWords: true, html: true };

    assertEquals(clip("Lorum ipsum", 5, options), "Loru\u2026");
    assertEquals(clip("Lorum ipsum", 6, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 7, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 8, options), "Lorum i\u2026");
    assertEquals(clip("Lorum ipsum", 9, options), "Lorum ip\u2026");
    assertEquals(clip("Lorum ipsum", 10, options), "Lorum ips\u2026");
    assertEquals(clip("Lorum ipsum", 11, options), "Lorum ipsum");
});

Deno.test("html: test word breaking without indicator", () => {
    const options = { breakWords: true, html: true, indicator: "" };

    assertEquals(clip("Lorum ipsum", 5, options), "Lorum");
    assertEquals(clip("Lorum ipsum", 6, options), "Lorum");
    assertEquals(clip("Lorum ipsum", 7, options), "Lorum i");
    assertEquals(clip("Lorum ipsum", 8, options), "Lorum ip");
    assertEquals(clip("Lorum ipsum", 9, options), "Lorum ips");
    assertEquals(clip("Lorum ipsum", 10, options), "Lorum ipsu");
    assertEquals(clip("Lorum ipsum", 11, options), "Lorum ipsum");
});

Deno.test("html: test max lines", () => {
    assertEquals(clip("Lorum\nipsum", 100, { html: true, maxLines: 2 }), "Lorum\nipsum");
    assertEquals(clip("Lorum\nipsum", 100, { html: true, maxLines: 1 }), "Lorum");
    assertEquals(clip("Lorum<br/>ipsum", 100, { html: true, maxLines: 1 }), "Lorum");
    assertEquals(clip("Lorum\n\nipsum", 100, { html: true, maxLines: 2 }), "Lorum\n");

    assertEquals(clip("Lorum\nipsum\n", 100, { html: true, maxLines: 2 }), "Lorum\nipsum");
    assertEquals(clip("Lorum\nipsum\n\n", 100, { html: true, maxLines: 2 }), "Lorum\nipsum");

    assertEquals(
        clip("<p>Lorem ipsum</p><p>Lorem ipsum</p>", 100, {
            html: true,
            maxLines: 2,
        }),
        "<p>Lorem ipsum</p><p>Lorem ipsum</p>",
    );
    assertEquals(
        clip("<p>Lorem ipsum</p><p>Lorem ipsum</p>", 100, {
            html: true,
            maxLines: 1,
        }),
        "<p>Lorem ipsum</p>",
    );
    assertEquals(
        clip("<div>Lorem ipsum</div><div>Lorem ipsum</div>", 100, {
            html: true,
            maxLines: 2,
        }),
        "<div>Lorem ipsum</div><div>Lorem ipsum</div>",
    );
    assertEquals(
        clip("<div>Lorem ipsum</div><div>Lorem ipsum</div>", 100, {
            html: true,
            maxLines: 1,
        }),
        "<div>Lorem ipsum</div>",
    );
});

Deno.test("html: test odd HTML", () => {
    const options = { html: true };

    assertEquals(clip("<p>foo > bar</p>", 9, options), "<p>foo > bar</p>");
    assertEquals(
        clip("<p><i>Lorum>>></i> <i>ipsum</i></p>", 7, options),
        "<p><i>Lorum>\u2026</i></p>",
    );
});

Deno.test("html: test ampersand", () => {
    const options = { html: true };

    assertEquals(clip("&", 1, options), "&");
    assertEquals(clip("&", 2, options), "&");
    assertEquals(clip("&lt;", 1, options), "&lt;");
    assertEquals(clip("&lt;", 2, options), "&lt;");
    assertEquals(clip("&amp;", 1, options), "&amp;");
    assertEquals(clip("&amp;", 2, options), "&amp;");
    assertEquals(clip("<p>&</p>", 1, options), "");
    assertEquals(clip("<p>&</p>", 2, options), "<p>&</p>");
    assertEquals(clip("<p>&lt;</p>", 1, options), "");
    assertEquals(clip("<p>&lt;</p>", 2, options), "<p>&lt;</p>");
    assertEquals(clip("<p>&amp;</p>", 1, options), "");
    assertEquals(clip("<p>&amp;</p>", 2, options), "<p>&amp;</p>");

    assertEquals(clip("foo & bar", 5, options), "foo\u2026");
    assertEquals(clip("foo & bar", 9, options), "foo & bar");
    assertEquals(clip("foo&<i>bar</i>", 5, options), "foo&\u2026");
    assertEquals(clip("foo&<i>bar</i>", 7, options), "foo&<i>bar</i>");
    assertEquals(clip("foo&&& bar", 5, options), "foo&\u2026");
    assertEquals(clip("foo&&& bar", 10, options), "foo&&& bar");

    assertEquals(
        clip('<a href="http://example.com/?x=1&y=2">foo</a>', 3, options),
        '<a href="http://example.com/?x=1&y=2">foo</a>',
    );
    assertEquals(clip("&123", 4, options), "&123");
    assertEquals(clip("&abc", 4, options), "&abc");
    assertEquals(clip("foo &0 bar", 10, options), "foo &0 bar");
    assertEquals(clip("foo &lolwat bar", 15, options), "foo &lolwat bar");
});

Deno.test("html: test ampersand without indicator", () => {
    const options = { html: true, indicator: "" };

    assertEquals(clip("&", 1, options), "&");
    assertEquals(clip("&", 2, options), "&");
    assertEquals(clip("&lt;", 1, options), "&lt;");
    assertEquals(clip("&lt;", 2, options), "&lt;");
    assertEquals(clip("&amp;", 1, options), "&amp;");
    assertEquals(clip("&amp;", 2, options), "&amp;");
    assertEquals(clip("<p>&</p>", 1, options), "<p>&</p>");
    assertEquals(clip("<p>&</p>", 2, options), "<p>&</p>");
    assertEquals(clip("<p>&lt;</p>", 1, options), "<p>&lt;</p>");
    assertEquals(clip("<p>&lt;</p>", 2, options), "<p>&lt;</p>");
    assertEquals(clip("<p>&amp;</p>", 1, options), "<p>&amp;</p>");
    assertEquals(clip("<p>&amp;</p>", 2, options), "<p>&amp;</p>");

    assertEquals(clip("foo & bar", 5, options), "foo &");
    assertEquals(clip("foo & bar", 9, options), "foo & bar");
    // Ideally "bar" wouldn't have been broken, but we accept this
    // limitation when encountering tags during backtracking:
    assertEquals(clip("foo&<i>bar</i>", 5, options), "foo&<i>b</i>");
    assertEquals(clip("foo&<i>bar</i>", 7, options), "foo&<i>bar</i>");
    assertEquals(clip("foo&&& bar", 5, options), "foo&&");
    assertEquals(clip("foo&&& bar", 10, options), "foo&&& bar");

    assertEquals(
        clip('<a href="http://example.com/?x=1&y=2">foo</a>', 3, options),
        '<a href="http://example.com/?x=1&y=2">foo</a>',
    );
    assertEquals(clip("&123", 4, options), "&123");
    assertEquals(clip("&abc", 4, options), "&abc");
    assertEquals(clip("foo &0 bar", 10, options), "foo &0 bar");
    assertEquals(clip("foo &lolwat bar", 15, options), "foo &lolwat bar");
});

Deno.test("html: test ampersand without indicator and break words", () => {
    const options = { breakWords: true, html: true, indicator: "" };

    assertEquals(clip("&", 1, options), "&");
    assertEquals(clip("&", 2, options), "&");
    assertEquals(clip("&lt;", 1, options), "&lt;");
    assertEquals(clip("&lt;", 2, options), "&lt;");
    assertEquals(clip("&amp;", 1, options), "&amp;");
    assertEquals(clip("&amp;", 2, options), "&amp;");
    assertEquals(clip("<p>&</p>", 1, options), "<p>&</p>");
    assertEquals(clip("<p>&</p>", 2, options), "<p>&</p>");
    assertEquals(clip("<p>&lt;</p>", 1, options), "<p>&lt;</p>");
    assertEquals(clip("<p>&lt;</p>", 2, options), "<p>&lt;</p>");
    assertEquals(clip("<p>&amp;</p>", 1, options), "<p>&amp;</p>");
    assertEquals(clip("<p>&amp;</p>", 2, options), "<p>&amp;</p>");

    assertEquals(clip("foo & bar", 5, options), "foo &");
    assertEquals(clip("foo & bar", 9, options), "foo & bar");
    assertEquals(clip("foo&<i>bar</i>", 5, options), "foo&<i>b</i>");
    assertEquals(clip("foo&<i>bar</i>", 7, options), "foo&<i>bar</i>");
    assertEquals(clip("foo&&& bar", 5, options), "foo&&");
    assertEquals(clip("foo&&& bar", 10, options), "foo&&& bar");

    assertEquals(
        clip('<a href="http://example.com/?x=1&y=2">foo</a>', 3, options),
        '<a href="http://example.com/?x=1&y=2">foo</a>',
    );
    assertEquals(clip("&123", 4, options), "&123");
    assertEquals(clip("&abc", 4, options), "&abc");
    assertEquals(clip("foo &0 bar", 10, options), "foo &0 bar");
    assertEquals(clip("foo &lolwat bar", 15, options), "foo &lolwat bar");
});

Deno.test("html: test edge cases", () => {
    const options = { breakWords: true, html: true, indicator: "..." };

    assertEquals(clip('one <a href="#">two - three <br>four</a> five', 0, options), "...");
    assertEquals(clip('<p>one <a href="#">two - three <br>four</a> five</p>', 0, options), "");
    assertEquals(
        clip('<p>one <a href="#">two - three <br>four</a> five</p>', 6, options),
        "<p>one...</p>",
    );
});

Deno.test("html: issue #12: split tables", () => {
    const html = `<table border="1" cellpadding="1" cellspacing="1" style="width: 500px">
    <tbody>
        <tr>
            <td>fb</td>
            <td>fbfbfb</td>
        </tr>
        <tr>
            <td>google</td>
            <td>twitter</td>
        </tr>
        <tr>
            <td>intel</td>
            <td>amazon</td>
        </tr>
    </tbody>
</table>`;

    assertEquals(
        clip(html, 26, { html: true, breakWords: true }),
        `<table border="1" cellpadding="1" cellspacing="1" style="width: 500px">
    <tbody>
        <tr>
            <td>fb</td>
            <td>fbfbfb</td>
        </tr>
        <tr>
            <td>google</td>
            <td>twitter</td>
        </tr>
        <tr>
            <td>intel</td></tr></tbody></table>`,
    );

    assertEquals(
        clip(html, 25, { html: true, breakWords: true }),
        `<table border="1" cellpadding="1" cellspacing="1" style="width: 500px">
    <tbody>
        <tr>
            <td>fb</td>
            <td>fbfbfb</td>
        </tr>
        <tr>
            <td>google</td>
            <td>twitter</td>
        </tr>
        <tr>
            <td>int\u2026</td></tr></tbody></table>`,
    );

    assertEquals(
        clip(html, 25, { html: true, breakWords: true, maxLines: 2 }),
        `<table border="1" cellpadding="1" cellspacing="1" style="width: 500px">
    <tbody>
        <tr>
            <td>fb</td>
            <td>fbfbfb</td>
        </tr>
        <tr>
            <td>google</td>
            <td>twitter</td>
        </tr></tbody></table>`,
    );
});

Deno.test("html: test strip tags", () => {
    // Basic stripping of tags:
    const htmlWithImage = '<p>Image <img alt="blup" src="#"> and such</p>';
    assertEquals(
        clip(htmlWithImage, 12, { html: true, stripTags: [] }),
        clip(htmlWithImage, 12, { html: true }),
    );
    assertEquals(
        clip(htmlWithImage, 12, { html: true, stripTags: ["img"] }),
        "<p>Image  and\u2026</p>",
    );
    assertEquals(
        clip(htmlWithImage, 12, { html: true, stripTags: ["img", "p"] }),
        "Image  and\u2026",
    );
    assertEquals(clip(htmlWithImage, 12, { html: true, stripTags: true }), "Image  and\u2026");
    assertEquals(
        clip(htmlWithImage, 15, { html: true, stripTags: ["img"] }),
        "<p>Image  and such</p>",
    );

    // Links are stripped (but content is preserved):
    const htmlWithLink = '<a href="http://example.com/?x=1&y=2">foo</a>';
    assertEquals(clip(htmlWithLink, 3, { html: true, stripTags: ["a"] }), "foo");
    assertEquals(clip(htmlWithLink, 3, { html: true, stripTags: ["b"] }), htmlWithLink);

    // Same for tables, but whitespace is also simplified:
    const htmlWithTable = `hello <table border="1" cellpadding="1" cellspacing="1" style="width: 500px">
    <tbody>
        <tr>
            <td>fb</td>
            <td>fbfbfb</td>
        </tr>
        <tr>
            <td>google</td>
            <td>twitter</td>
        </tr>
        <tr>
            <td>intel</td>
            <td>amazon</td>
        </tr>
    </tbody>
</table> world`;
    assertEquals(clip(htmlWithTable, 10, { html: true, stripTags: true }), "hello fb\u2026");
    assertEquals(clip(htmlWithTable, 16, { html: true, stripTags: true }), "hello fb fbfbfb\u2026");
    assertEquals(
        clip(htmlWithTable, 24, { html: true, stripTags: true }),
        "hello fb fbfbfb google\u2026",
    );

    // SVG's `imageWeight` should not be counted when stripped:
    const htmlWithSvg =
        "<p>" +
        '<svg width="100%" height="100%" viewBox="0 0 100 100"' +
        ' xmlns="http://www.w3.org/2000/svg">\n' +
        "<style>\n" +
        "/* <![CDATA[ */\n" +
        "circle {\n" +
        "fill: orange;\n" +
        "stroke: black;\n" +
        "stroke-width: 10px; " +
        "// Note that the value of a pixel depend on the viewBox\n" +
        "}\n" +
        "/* ]]> */\n" +
        "</style>\n" +
        "\n" +
        '<circle cx="50" cy="50" r="40" />\n' +
        "</svg>test\n" +
        "</p>";
    assertEquals(clip(htmlWithSvg, 3, { html: true, stripTags: ["svg"] }), "<p>te\u2026</p>");
    assertEquals(clip(htmlWithSvg, 4, { html: true, stripTags: ["svg"] }), "<p>test</p>");
});
