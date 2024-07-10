import { assertEquals } from "jsr:@std/assert";

import clip from "../../src/index.ts";

Deno.test("plain-text: test basics", () => {
    assertEquals(clip("Lorum ipsum", 5), "Loru\u2026");
    assertEquals(clip("Lorum ipsum", 6), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 7), "Lorum \u2026");
    assertEquals(clip("Lorum ipsum", 8), "Lorum \u2026");
    assertEquals(clip("Lorum ipsum", 9), "Lorum \u2026");
    assertEquals(clip("Lorum ipsum", 10), "Lorum \u2026");
    assertEquals(clip("Lorum ipsum", 11), "Lorum ipsum");

    assertEquals(clip("Lorum\nipsum", 10), "Lorum");

    assertEquals(clip("Lorum i", 7), "Lorum i");
    assertEquals(clip("Lorum \u2026", 7), "Lorum \u2026");
});

Deno.test("plain-text: test unicode surrogate pairs", () => {
    assertEquals(clip("Lorum 𝌆", 7), "Lorum 𝌆");
    assertEquals(clip("𝌆𝌆𝌆𝌆", 4), "𝌆𝌆𝌆𝌆");
    assertEquals(clip("𝌆𝌆𝌆𝌆", 3), "𝌆𝌆…");
    assertEquals(clip("😔🙏👙😃🏧", 6), "😔🙏👙😃🏧");
    assertEquals(clip("😔🙏👙😃🏧", 5), "😔🙏👙😃🏧");
    assertEquals(clip("😔🙏👙😃🏧", 4), "😔🙏👙…");
    assertEquals(clip("😔🙏👙😃🏧", 3), "😔🙏…");
});

Deno.test("plain-text: test word breaking", () => {
    const options = { breakWords: true };

    assertEquals(clip("Lorum ipsum", 5, options), "Loru\u2026");
    assertEquals(clip("Lorum ipsum", 6, options), "Lorum\u2026");
    assertEquals(clip("Lorum ipsum", 7, options), "Lorum \u2026");
    assertEquals(clip("Lorum ipsum", 8, options), "Lorum i\u2026");
    assertEquals(clip("Lorum ipsum", 9, options), "Lorum ip\u2026");
    assertEquals(clip("Lorum ipsum", 10, options), "Lorum ips\u2026");
    assertEquals(clip("Lorum ipsum", 11, options), "Lorum ipsum");
});

Deno.test("plain-text: test word breaking without indicator", () => {
    const options = { breakWords: true, indicator: "" };

    assertEquals(clip("Lorum ipsum", 5, options), "Lorum");
    assertEquals(clip("Lorum ipsum", 6, options), "Lorum ");
    assertEquals(clip("Lorum ipsum", 7, options), "Lorum i");
    assertEquals(clip("Lorum ipsum", 8, options), "Lorum ip");
    assertEquals(clip("Lorum ipsum", 9, options), "Lorum ips");
    assertEquals(clip("Lorum ipsum", 10, options), "Lorum ipsu");
    assertEquals(clip("Lorum ipsum", 11, options), "Lorum ipsum");
});

Deno.test("plain-text: test max lines", () => {
    assertEquals(clip("Lorum\nipsum", 100, { maxLines: 2 }), "Lorum\nipsum");
    assertEquals(clip("Lorum\nipsum", 100, { maxLines: 1 }), "Lorum");
    assertEquals(clip("Lorum\n\nipsum", 100, { maxLines: 2 }), "Lorum\n");

    assertEquals(clip("Lorum\nipsum\n", 100, { maxLines: 2 }), "Lorum\nipsum");
    assertEquals(clip("Lorum\nipsum\n\n", 100, { maxLines: 2 }), "Lorum\nipsum");
});

Deno.test("plain-text: test edge cases", () => {
    const options = { breakWords: true, html: true, indicator: "..." };

    assertEquals(clip("one two - three \nfour five", 0, options), "...");
    assertEquals(clip("one two - three \nfour five", 6, options), "one...");
});
