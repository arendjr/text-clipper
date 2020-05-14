import clip from "../../src";

test("html: test basic HTML", () => {
    const options = { html: true };

    expect(clip("<p>Lorum ipsum</p>", 5, options)).toBe("<p>Loru\u2026</p>");
    expect(clip("<p><i>Lorum</i> <i>ipsum</i></p>", 5, options)).toBe("<p><i>Loru\u2026</i></p>");
    expect(clip("<p><i>Lorum</i> <i>ipsum</i></p>", 6, options)).toBe("<p><i>Lorum</i>\u2026</p>");
    expect(clip("<p><i>Lorum</i> <i>ipsum</i></p>", 7, options)).toBe("<p><i>Lorum</i> \u2026</p>");
    expect(clip("<p><i>Lorum</i>\n<i>ipsum</i></p>", 5, options)).toBe("<p><i>Lorum</i></p>");
    expect(clip("<p><i>Lorum</i><br><i>ipsum</i></p>", 5, options)).toBe("<p><i>Lorum</i></p>");

    expect(clip("<p><i>Lorum</i></p>", 5, options)).toBe("<p><i>Lorum</i></p>");

    expect(clip("<p><i>Lorum</i>a</p>", 5, options)).toBe("<p><i>Loru\u2026</i></p>");
    expect(clip("<p><i>Lorum</i></p>a", 5, options)).toBe("<p><i>Loru\u2026</i></p>");
    expect(clip("<p><i>Lorum</i>a</p>", 6, options)).toBe("<p><i>Lorum</i>a</p>");
    expect(clip("<p><i>Lorum</i></p>a", 6, options)).toBe("<p><i>Lorum</i></p>a");
    expect(clip("<p><i>Lorum</i>aA</p>", 6, options)).toBe("<p><i>Lorum</i>\u2026</p>");
    expect(clip("<p><i>Lorum</i></p>aA", 6, options)).toBe("<p><i>Lorum</i></p>\u2026");
    expect(clip("<p><i>Lorum</i>a</p>", 7, options)).toBe("<p><i>Lorum</i>a</p>");
    expect(clip("<p><i>Lorum</i></p>a", 7, options)).toBe("<p><i>Lorum</i></p>a");
    expect(clip("<p><i>Lorum</i>aA</p>", 7, options)).toBe("<p><i>Lorum</i>aA</p>");
    expect(clip("<p><i>Lorum</i></p>aA", 7, options)).toBe("<p><i>Lorum</i></p>aA");

    expect(clip("<p><i>Lorum</i> </p>", 5, options)).toBe("<p><i>Loru\u2026</i></p>");
    expect(clip("<p><i>Lorum</i></p> ", 5, options)).toBe("<p><i>Loru\u2026</i></p>");
    expect(clip("<p><i>Lorum</i> </p>", 6, options)).toBe("<p><i>Lorum</i> </p>");
    expect(clip("<p><i>Lorum</i></p> ", 6, options)).toBe("<p><i>Lorum</i></p> ");
    expect(clip("<p><i>Lorum</i>  </p>", 6, options)).toBe("<p><i>Lorum</i>\u2026</p>");
    expect(clip("<p><i>Lorum</i></p>  ", 6, options)).toBe("<p><i>Lorum</i></p>\u2026");
    expect(clip("<p><i>Lorum</i> </p>", 7, options)).toBe("<p><i>Lorum</i> </p>");
    expect(clip("<p><i>Lorum</i></p> ", 7, options)).toBe("<p><i>Lorum</i></p> ");
    expect(clip("<p><i>Lorum</i>  </p>", 7, options)).toBe("<p><i>Lorum</i>  </p>");
    expect(clip("<p><i>Lorum</i></p>  ", 7, options)).toBe("<p><i>Lorum</i></p>  ");

    expect(clip("Lo<ins>rum</ins>", 4, options)).toBe("Lo<ins>r\u2026</ins>");
    expect(clip("Lo<del>rum</del>", 4, options)).toBe("Lo<del>r\u2026</del>");

    expect(clip('<a href="http://just-a-link.com">Just a link</a>', 8, options)).toBe(
        '<a href="http://just-a-link.com">Just a \u2026</a>',
    );

    expect(clip('<a href="http://just-a-link.com">Just a link</a>, yo', 13, options)).toBe(
        '<a href="http://just-a-link.com">Just a link</a>,\u2026',
    );
});

test("html: test HTML comments", () => {
    const options = { html: true };

    expect(clip("<b><!-- this is bold -->bold</b>", 4, options)).toBe(
        "<b><!-- this is bold -->bold</b>",
    );

    expect(clip("<b><!-- this is bold -->bold</b>", 3, options)).toBe(
        "<b><!-- this is bold -->bo\u2026</b>",
    );
});

test("html: test special characters in attribute values", () => {
    const options = { html: true };

    expect(clip('<b class="<i>">bold</b>', 4, options)).toBe('<b class="<i>">bold</b>');
    expect(clip('<b class="<i>">bold</b>', 3, options)).toBe('<b class="<i>">bo\u2026</b>');
    expect(clip("<b class=\"'test'\">bold</b>", 4, options)).toBe("<b class=\"'test'\">bold</b>");

    expect(clip("<b class=\"'test'\">bold</b>", 3, options)).toBe(
        "<b class=\"'test'\">bo\u2026</b>",
    );

    expect(clip("<b class='javascript:alert(\"hoi\");'>bold</b>", 4, options)).toBe(
        "<b class='javascript:alert(\"hoi\");'>bold</b>",
    );

    expect(clip("<b class='javascript:alert(\"hoi\");'>bold</b>", 3, options)).toBe(
        "<b class='javascript:alert(\"hoi\");'>bo\u2026</b>",
    );
});

test("html: test embedded SVG", () => {
    expect(
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
    ).toBe(
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

test("html: test unicode surrogate pairs", () => {
    const options = { html: true };

    expect(clip("Lorum 𝌆", 7, options)).toBe("Lorum 𝌆");
    expect(clip("𝌆𝌆𝌆𝌆", 4, options)).toBe("𝌆𝌆𝌆𝌆");
    expect(clip("𝌆𝌆𝌆𝌆", 3, options)).toBe("𝌆𝌆…");
    expect(clip("😔🙏👙😃🏧", 6, options)).toBe("😔🙏👙😃🏧");
    expect(clip("😔🙏👙😃🏧", 5, options)).toBe("😔🙏👙😃🏧");
    expect(clip("😔🙏👙😃🏧", 4, options)).toBe("😔🙏👙…");
    expect(clip("😔🙏👙😃🏧", 3, options)).toBe("😔🙏…");
});

test("html: test plain text", () => {
    const options = { html: true };

    expect(clip("Lorum ipsum", 5, options)).toBe("Loru\u2026");
    expect(clip("Lorum ipsum", 6, options)).toBe("Lorum\u2026");
    expect(clip("Lorum ipsum", 7, options)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 8, options)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 9, options)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 10, options)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 11, options)).toBe("Lorum ipsum");

    expect(clip("Lorum\nipsum", 10, options)).toBe("Lorum");

    expect(clip("Lorum i", 7, options)).toBe("Lorum i");
    expect(clip("Lorum \u2026", 7, options)).toBe("Lorum \u2026");
});

test("html: test word breaking", () => {
    const options = { breakWords: true, html: true };

    expect(clip("Lorum ipsum", 5, options)).toBe("Loru\u2026");
    expect(clip("Lorum ipsum", 6, options)).toBe("Lorum\u2026");
    expect(clip("Lorum ipsum", 7, options)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 8, options)).toBe("Lorum i\u2026");
    expect(clip("Lorum ipsum", 9, options)).toBe("Lorum ip\u2026");
    expect(clip("Lorum ipsum", 10, options)).toBe("Lorum ips\u2026");
    expect(clip("Lorum ipsum", 11, options)).toBe("Lorum ipsum");
});

test("html: test word breaking without indicator", () => {
    const options = { breakWords: true, html: true, indicator: "" };

    expect(clip("Lorum ipsum", 5, options)).toBe("Lorum");
    expect(clip("Lorum ipsum", 6, options)).toBe("Lorum ");
    expect(clip("Lorum ipsum", 7, options)).toBe("Lorum i");
    expect(clip("Lorum ipsum", 8, options)).toBe("Lorum ip");
    expect(clip("Lorum ipsum", 9, options)).toBe("Lorum ips");
    expect(clip("Lorum ipsum", 10, options)).toBe("Lorum ipsu");
    expect(clip("Lorum ipsum", 11, options)).toBe("Lorum ipsum");
});

test("html: test max lines", () => {
    expect(clip("Lorum\nipsum", 100, { html: true, maxLines: 2 })).toBe("Lorum\nipsum");
    expect(clip("Lorum\nipsum", 100, { html: true, maxLines: 1 })).toBe("Lorum");
    expect(clip("Lorum<br/>ipsum", 100, { html: true, maxLines: 1 })).toBe("Lorum");
    expect(clip("Lorum\n\nipsum", 100, { html: true, maxLines: 2 })).toBe("Lorum\n");

    expect(clip("Lorum\nipsum\n", 100, { html: true, maxLines: 2 })).toBe("Lorum\nipsum");
    expect(clip("Lorum\nipsum\n\n", 100, { html: true, maxLines: 2 })).toBe("Lorum\nipsum");

    expect(clip("<p>Lorem ipsum</p><p>Lorem ipsum</p>", 100, { html: true, maxLines: 2 })).toBe(
        "<p>Lorem ipsum</p><p>Lorem ipsum</p>",
    );
    expect(clip("<p>Lorem ipsum</p><p>Lorem ipsum</p>", 100, { html: true, maxLines: 1 })).toBe(
        "<p>Lorem ipsum</p>",
    );
    expect(
        clip("<div>Lorem ipsum</div><div>Lorem ipsum</div>", 100, { html: true, maxLines: 2 }),
    ).toBe("<div>Lorem ipsum</div><div>Lorem ipsum</div>");
    expect(
        clip("<div>Lorem ipsum</div><div>Lorem ipsum</div>", 100, { html: true, maxLines: 1 }),
    ).toBe("<div>Lorem ipsum</div>");
});

test("html: test odd HTML", () => {
    const options = { html: true };

    expect(clip("<p>foo > bar</p>", 9, options)).toBe("<p>foo > bar</p>");
    expect(clip("<p><i>Lorum>>></i> <i>ipsum</i></p>", 7, options)).toBe(
        "<p><i>Lorum>\u2026</i></p>",
    );
});

test("html: test ampersand", () => {
    const options = { html: true };

    expect(clip("&", 1, options)).toBe("&");
    expect(clip("&", 2, options)).toBe("&");
    expect(clip("&lt;", 1, options)).toBe("&lt;");
    expect(clip("&lt;", 2, options)).toBe("&lt;");
    expect(clip("&amp;", 1, options)).toBe("&amp;");
    expect(clip("&amp;", 2, options)).toBe("&amp;");
    expect(clip("<p>&</p>", 1, options)).toBe("");
    expect(clip("<p>&</p>", 2, options)).toBe("<p>&</p>");
    expect(clip("<p>&lt;</p>", 1, options)).toBe("");
    expect(clip("<p>&lt;</p>", 2, options)).toBe("<p>&lt;</p>");
    expect(clip("<p>&amp;</p>", 1, options)).toBe("");
    expect(clip("<p>&amp;</p>", 2, options)).toBe("<p>&amp;</p>");

    expect(clip("foo & bar", 5, options)).toBe("foo \u2026");
    expect(clip("foo & bar", 9, options)).toBe("foo & bar");
    expect(clip("foo&<i>bar</i>", 5, options)).toBe("foo&\u2026");
    expect(clip("foo&<i>bar</i>", 7, options)).toBe("foo&<i>bar</i>");
    expect(clip("foo&&& bar", 5, options)).toBe("foo&\u2026");
    expect(clip("foo&&& bar", 10, options)).toBe("foo&&& bar");

    expect(clip('<a href="http://example.com/?x=1&y=2">foo</a>', 3, options)).toBe(
        '<a href="http://example.com/?x=1&y=2">foo</a>',
    );
    expect(clip("&123", 4, options)).toBe("&123");
    expect(clip("&abc", 4, options)).toBe("&abc");
    expect(clip("foo &0 bar", 10, options)).toBe("foo &0 bar");
    expect(clip("foo &lolwat bar", 15, options)).toBe("foo &lolwat bar");
});

test("html: test ampersand without indicator", () => {
    const options = { html: true, indicator: "" };

    expect(clip("&", 1, options)).toBe("&");
    expect(clip("&", 2, options)).toBe("&");
    expect(clip("&lt;", 1, options)).toBe("&lt;");
    expect(clip("&lt;", 2, options)).toBe("&lt;");
    expect(clip("&amp;", 1, options)).toBe("&amp;");
    expect(clip("&amp;", 2, options)).toBe("&amp;");
    expect(clip("<p>&</p>", 1, options)).toBe("<p>&</p>");
    expect(clip("<p>&</p>", 2, options)).toBe("<p>&</p>");
    expect(clip("<p>&lt;</p>", 1, options)).toBe("<p>&lt;</p>");
    expect(clip("<p>&lt;</p>", 2, options)).toBe("<p>&lt;</p>");
    expect(clip("<p>&amp;</p>", 1, options)).toBe("<p>&amp;</p>");
    expect(clip("<p>&amp;</p>", 2, options)).toBe("<p>&amp;</p>");

    expect(clip("foo & bar", 5, options)).toBe("foo &");
    expect(clip("foo & bar", 9, options)).toBe("foo & bar");
    // Ideally "bar" wouldn't have been broken, but we accept this
    // limitation when encountering tags during backtracking:
    expect(clip("foo&<i>bar</i>", 5, options)).toBe("foo&<i>b</i>");
    expect(clip("foo&<i>bar</i>", 7, options)).toBe("foo&<i>bar</i>");
    expect(clip("foo&&& bar", 5, options)).toBe("foo&&");
    expect(clip("foo&&& bar", 10, options)).toBe("foo&&& bar");

    expect(clip('<a href="http://example.com/?x=1&y=2">foo</a>', 3, options)).toBe(
        '<a href="http://example.com/?x=1&y=2">foo</a>',
    );
    expect(clip("&123", 4, options)).toBe("&123");
    expect(clip("&abc", 4, options)).toBe("&abc");
    expect(clip("foo &0 bar", 10, options)).toBe("foo &0 bar");
    expect(clip("foo &lolwat bar", 15, options)).toBe("foo &lolwat bar");
});

test("html: test ampersand without indicator and break words", () => {
    const options = { breakWords: true, html: true, indicator: "" };

    expect(clip("&", 1, options)).toBe("&");
    expect(clip("&", 2, options)).toBe("&");
    expect(clip("&lt;", 1, options)).toBe("&lt;");
    expect(clip("&lt;", 2, options)).toBe("&lt;");
    expect(clip("&amp;", 1, options)).toBe("&amp;");
    expect(clip("&amp;", 2, options)).toBe("&amp;");
    expect(clip("<p>&</p>", 1, options)).toBe("<p>&</p>");
    expect(clip("<p>&</p>", 2, options)).toBe("<p>&</p>");
    expect(clip("<p>&lt;</p>", 1, options)).toBe("<p>&lt;</p>");
    expect(clip("<p>&lt;</p>", 2, options)).toBe("<p>&lt;</p>");
    expect(clip("<p>&amp;</p>", 1, options)).toBe("<p>&amp;</p>");
    expect(clip("<p>&amp;</p>", 2, options)).toBe("<p>&amp;</p>");

    expect(clip("foo & bar", 5, options)).toBe("foo &");
    expect(clip("foo & bar", 9, options)).toBe("foo & bar");
    expect(clip("foo&<i>bar</i>", 5, options)).toBe("foo&<i>b</i>");
    expect(clip("foo&<i>bar</i>", 7, options)).toBe("foo&<i>bar</i>");
    expect(clip("foo&&& bar", 5, options)).toBe("foo&&");
    expect(clip("foo&&& bar", 10, options)).toBe("foo&&& bar");

    expect(clip('<a href="http://example.com/?x=1&y=2">foo</a>', 3, options)).toBe(
        '<a href="http://example.com/?x=1&y=2">foo</a>',
    );
    expect(clip("&123", 4, options)).toBe("&123");
    expect(clip("&abc", 4, options)).toBe("&abc");
    expect(clip("foo &0 bar", 10, options)).toBe("foo &0 bar");
    expect(clip("foo &lolwat bar", 15, options)).toBe("foo &lolwat bar");
});

test("html: test edge cases", () => {
    const options = { breakWords: true, html: true, indicator: "..." };

    expect(clip('one <a href="#">two - three <br>four</a> five', 0, options)).toBe("...");
    expect(clip('<p>one <a href="#">two - three <br>four</a> five</p>', 0, options)).toBe("");
    expect(clip('<p>one <a href="#">two - three <br>four</a> five</p>', 6, options)).toBe(
        "<p>one...</p>",
    );
});
