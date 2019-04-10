const tape = require("tape");

const clip = require("../../src");

tape("plain-text: test basics", function(test) {
    test.plan(10);

    test.equal(clip("Lorum ipsum", 5), "Loru\u2026");
    test.equal(clip("Lorum ipsum", 6), "Lorum\u2026");
    test.equal(clip("Lorum ipsum", 7), "Lorum \u2026");
    test.equal(clip("Lorum ipsum", 8), "Lorum \u2026");
    test.equal(clip("Lorum ipsum", 9), "Lorum \u2026");
    test.equal(clip("Lorum ipsum", 10), "Lorum \u2026");
    test.equal(clip("Lorum ipsum", 11), "Lorum ipsum");

    test.equal(clip("Lorum\nipsum", 10), "Lorum");

    test.equal(clip("Lorum i", 7), "Lorum i");
    test.equal(clip("Lorum \u2026", 7), "Lorum \u2026");
});

tape("plain-text: test unicode surrogate pairs", function(test) {
    test.plan(7);

    test.equal(clip("Lorum 𝌆", 7), "Lorum 𝌆");
    test.equal(clip("𝌆𝌆𝌆𝌆", 4), "𝌆𝌆𝌆𝌆");
    test.equal(clip("𝌆𝌆𝌆𝌆", 3), "𝌆𝌆…");
    test.equal(clip("😔🙏👙😃🏧", 6), "😔🙏👙😃🏧");
    test.equal(clip("😔🙏👙😃🏧", 5), "😔🙏👙😃🏧");
    test.equal(clip("😔🙏👙😃🏧", 4), "😔🙏👙…");
    test.equal(clip("😔🙏👙😃🏧", 3), "😔🙏…");
});

tape("plain-text: test word breaking", function(test) {
    test.plan(7);

    const options = { breakWords: true };

    test.equal(clip("Lorum ipsum", 5, options), "Loru\u2026");
    test.equal(clip("Lorum ipsum", 6, options), "Lorum\u2026");
    test.equal(clip("Lorum ipsum", 7, options), "Lorum \u2026");
    test.equal(clip("Lorum ipsum", 8, options), "Lorum i\u2026");
    test.equal(clip("Lorum ipsum", 9, options), "Lorum ip\u2026");
    test.equal(clip("Lorum ipsum", 10, options), "Lorum ips\u2026");
    test.equal(clip("Lorum ipsum", 11, options), "Lorum ipsum");
});

tape("plain-text: test word breaking without indicator", function(test) {
    test.plan(7);

    const options = { breakWords: true, indicator: "" };

    test.equal(clip("Lorum ipsum", 5, options), "Lorum");
    test.equal(clip("Lorum ipsum", 6, options), "Lorum ");
    test.equal(clip("Lorum ipsum", 7, options), "Lorum i");
    test.equal(clip("Lorum ipsum", 8, options), "Lorum ip");
    test.equal(clip("Lorum ipsum", 9, options), "Lorum ips");
    test.equal(clip("Lorum ipsum", 10, options), "Lorum ipsu");
    test.equal(clip("Lorum ipsum", 11, options), "Lorum ipsum");
});

tape("plain-text: test max lines", function(test) {
    test.plan(5);

    test.equal(clip("Lorum\nipsum", 100, { maxLines: 2 }), "Lorum\nipsum");
    test.equal(clip("Lorum\nipsum", 100, { maxLines: 1 }), "Lorum");
    test.equal(clip("Lorum\n\nipsum", 100, { maxLines: 2 }), "Lorum\n");

    test.equal(clip("Lorum\nipsum\n", 100, { maxLines: 2 }), "Lorum\nipsum");
    test.equal(clip("Lorum\nipsum\n\n", 100, { maxLines: 2 }), "Lorum\nipsum");
});
