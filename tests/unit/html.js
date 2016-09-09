const tape = require('tape');

const clip = require('../../src');

tape('html: test basic HTML', function(test) {
    test.plan(8);

    const options = { html: true };

    test.equal(clip('<p>Lorum ipsum</p>', 5, options), '<p>Loru\u2026</p>');
    test.equal(clip('<p><i>Lorum</i> <i>ipsum</i></p>', 5, options), '<p><i>Loru\u2026</i></p>');
    test.equal(clip('<p><i>Lorum</i> <i>ipsum</i></p>', 6, options), '<p><i>Lorum</i>\u2026</p>');
    test.equal(clip('<p><i>Lorum</i> <i>ipsum</i></p>', 7, options), '<p><i>Lorum</i> \u2026</p>');
    test.equal(clip('<p><i>Lorum</i>\n<i>ipsum</i></p>', 5, options), '<p><i>Lorum</i></p>');
    test.equal(clip('<p><i>Lorum</i><br><i>ipsum</i></p>', 5, options), '<p><i>Lorum</i></p>');

    test.equal(
        clip('<a href="http://just-a-link.com">Just a link</a>', 8, options),
        '<a href="http://just-a-link.com">Just a \u2026</a>'
    );

    test.equal(
        clip('<a href="http://just-a-link.com">Just a link</a>, yo', 13, options),
        '<a href="http://just-a-link.com">Just a link</a>,\u2026'
    );
});

tape('html: test HTML comments', function(test) {
    test.plan(2);

    const options = { html: true };

    test.equal(
        clip('<b><!-- this is bold -->bold</b>', 4, options),
        '<b><!-- this is bold -->bold</b>'
    );

    test.equal(
        clip('<b><!-- this is bold -->bold</b>', 3, options),
        '<b><!-- this is bold -->bo\u2026</b>'
    );
});

tape('html: test special characters in attribute values', function(test) {
    test.plan(6);

    const options = { html: true };

    test.equal(clip('<b class="<i>">bold</b>', 4, options), '<b class="<i>">bold</b>');
    test.equal(clip('<b class="<i>">bold</b>', 3, options), '<b class="<i>">bo\u2026</b>');
    test.equal(clip('<b class="\'test\'">bold</b>', 4, options), '<b class="\'test\'">bold</b>');

    test.equal(
        clip('<b class="\'test\'">bold</b>', 3, options),
        '<b class="\'test\'">bo\u2026</b>'
    );

    test.equal(
        clip('<b class=\'javascript:alert("hoi");\'>bold</b>', 4, options),
        '<b class=\'javascript:alert("hoi");\'>bold</b>'
    );

    test.equal(
        clip('<b class=\'javascript:alert("hoi");\'>bold</b>', 3, options),
        '<b class=\'javascript:alert("hoi");\'>bo\u2026</b>'
    );
});

tape('html: test embedded SVG', function(test) {
    test.plan(1);

    test.equal(
        clip(
            '<p>' +
                '<svg width="100%" height="100%" viewBox="0 0 100 100"' +
                    ' xmlns="http://www.w3.org/2000/svg">\n' +
                    '<style>\n' +
                        '/* <![CDATA[ */\n' +
                        'circle {\n' +
                            'fill: orange;\n' +
                            'stroke: black;\n' +
                            'stroke-width: 10px; ' +
                                       '// Note that the value of a pixel depend on the viewBox\n' +
                        '}\n' +
                        '/* ]]> */\n' +
                    '</style>\n' +
                    '\n' +
                    '<circle cx="50" cy="50" r="40" />\n' +
                '</svg>test\n' +
            '</p>',
            9,
            { html: true, imageWeight: 5 }
        ),
        '<p>' +
            '<svg width="100%" height="100%" viewBox="0 0 100 100"' +
                ' xmlns="http://www.w3.org/2000/svg">\n' +
                '<style>\n' +
                    '/* <![CDATA[ */\n' +
                    'circle {\n' +
                        'fill: orange;\n' +
                        'stroke: black;\n' +
                        'stroke-width: 10px; ' +
                                       '// Note that the value of a pixel depend on the viewBox\n' +
                    '}\n' +
                    '/* ]]> */\n' +
                '</style>\n' +
                '\n' +
                '<circle cx="50" cy="50" r="40" />\n' +
            '</svg>test' +
        '</p>'
    );
});

tape('html: test unicode surrogate pairs', function(test) {
    test.plan(7);

    const options = { html: true };

    test.equal(clip('Lorum 𝌆', 7, options), 'Lorum 𝌆');
    test.equal(clip('𝌆𝌆𝌆𝌆', 4, options), '𝌆𝌆𝌆𝌆');
    test.equal(clip('𝌆𝌆𝌆𝌆', 3, options), '𝌆𝌆…');
    test.equal(clip('😔🙏👙😃🏧', 6, options), '😔🙏👙😃🏧');
    test.equal(clip('😔🙏👙😃🏧', 5, options), '😔🙏👙😃🏧');
    test.equal(clip('😔🙏👙😃🏧', 4, options), '😔🙏👙…');
    test.equal(clip('😔🙏👙😃🏧', 3, options), '😔🙏…');
});

tape('html: test plain text', function(test) {
    test.plan(10);

    const options = { html: true };

    test.equal(clip('Lorum ipsum', 5, options), 'Loru\u2026');
    test.equal(clip('Lorum ipsum', 6, options), 'Lorum\u2026');
    test.equal(clip('Lorum ipsum', 7, options), 'Lorum \u2026');
    test.equal(clip('Lorum ipsum', 8, options), 'Lorum \u2026');
    test.equal(clip('Lorum ipsum', 9, options), 'Lorum \u2026');
    test.equal(clip('Lorum ipsum', 10, options), 'Lorum \u2026');
    test.equal(clip('Lorum ipsum', 11, options), 'Lorum ipsum');

    test.equal(clip('Lorum\nipsum', 10, options), 'Lorum');

    test.equal(clip('Lorum i', 7, options), 'Lorum i');
    test.equal(clip('Lorum \u2026', 7, options), 'Lorum \u2026');
});

tape('html: test word breaking', function(test) {
    test.plan(7);

    const options = { breakWords: true, html: true };

    test.equal(clip('Lorum ipsum', 5, options), 'Loru\u2026');
    test.equal(clip('Lorum ipsum', 6, options), 'Lorum\u2026');
    test.equal(clip('Lorum ipsum', 7, options), 'Lorum \u2026');
    test.equal(clip('Lorum ipsum', 8, options), 'Lorum i\u2026');
    test.equal(clip('Lorum ipsum', 9, options), 'Lorum ip\u2026');
    test.equal(clip('Lorum ipsum', 10, options), 'Lorum ips\u2026');
    test.equal(clip('Lorum ipsum', 11, options), 'Lorum ipsum');
});

tape('html: test max lines', function(test) {
    test.plan(5);

    test.equal(clip('Lorum\nipsum', 100, { html: true, maxLines: 2 }), 'Lorum\nipsum');
    test.equal(clip('Lorum\nipsum', 100, { html: true, maxLines: 1 }), 'Lorum');
    test.equal(clip('Lorum\n\nipsum', 100, { html: true, maxLines: 2 }), 'Lorum\n');

    test.equal(clip('Lorum\nipsum\n', 100, { html: true, maxLines: 2 }), 'Lorum\nipsum');
    test.equal(clip('Lorum\nipsum\n\n', 100, { html: true, maxLines: 2 }), 'Lorum\nipsum');
});

tape('html: test odd HTML', function(test) {
    test.plan(1);

    const options = { html: true };

    test.equal(clip('<p><i>Lorum>>></i> <i>ipsum</i></p>', 7, options),
               '<p><i>Lorum>\u2026</i></p>');
});
