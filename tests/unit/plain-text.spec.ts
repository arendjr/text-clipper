import clip from "../../src";

test("plain-text: test basics", () => {
    expect(clip("Lorum ipsum", 5)).toBe("Loru\u2026");
    expect(clip("Lorum ipsum", 6)).toBe("Lorum\u2026");
    expect(clip("Lorum ipsum", 7)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 8)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 9)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 10)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 11)).toBe("Lorum ipsum");

    expect(clip("Lorum\nipsum", 10)).toBe("Lorum");

    expect(clip("Lorum i", 7)).toBe("Lorum i");
    expect(clip("Lorum \u2026", 7)).toBe("Lorum \u2026");
});

test("plain-text: test unicode surrogate pairs", () => {
    expect(clip("Lorum 𝌆", 7)).toBe("Lorum 𝌆");
    expect(clip("𝌆𝌆𝌆𝌆", 4)).toBe("𝌆𝌆𝌆𝌆");
    expect(clip("𝌆𝌆𝌆𝌆", 3)).toBe("𝌆𝌆…");
    expect(clip("😔🙏👙😃🏧", 6)).toBe("😔🙏👙😃🏧");
    expect(clip("😔🙏👙😃🏧", 5)).toBe("😔🙏👙😃🏧");
    expect(clip("😔🙏👙😃🏧", 4)).toBe("😔🙏👙…");
    expect(clip("😔🙏👙😃🏧", 3)).toBe("😔🙏…");
});

test("plain-text: test word breaking", () => {
    const options = { breakWords: true };

    expect(clip("Lorum ipsum", 5, options)).toBe("Loru\u2026");
    expect(clip("Lorum ipsum", 6, options)).toBe("Lorum\u2026");
    expect(clip("Lorum ipsum", 7, options)).toBe("Lorum \u2026");
    expect(clip("Lorum ipsum", 8, options)).toBe("Lorum i\u2026");
    expect(clip("Lorum ipsum", 9, options)).toBe("Lorum ip\u2026");
    expect(clip("Lorum ipsum", 10, options)).toBe("Lorum ips\u2026");
    expect(clip("Lorum ipsum", 11, options)).toBe("Lorum ipsum");
});

test("plain-text: test word breaking without indicator", () => {
    const options = { breakWords: true, indicator: "" };

    expect(clip("Lorum ipsum", 5, options)).toBe("Lorum");
    expect(clip("Lorum ipsum", 6, options)).toBe("Lorum ");
    expect(clip("Lorum ipsum", 7, options)).toBe("Lorum i");
    expect(clip("Lorum ipsum", 8, options)).toBe("Lorum ip");
    expect(clip("Lorum ipsum", 9, options)).toBe("Lorum ips");
    expect(clip("Lorum ipsum", 10, options)).toBe("Lorum ipsu");
    expect(clip("Lorum ipsum", 11, options)).toBe("Lorum ipsum");
});

test("plain-text: test max lines", () => {
    expect(clip("Lorum\nipsum", 100, { maxLines: 2 })).toBe("Lorum\nipsum");
    expect(clip("Lorum\nipsum", 100, { maxLines: 1 })).toBe("Lorum");
    expect(clip("Lorum\n\nipsum", 100, { maxLines: 2 })).toBe("Lorum\n");

    expect(clip("Lorum\nipsum\n", 100, { maxLines: 2 })).toBe("Lorum\nipsum");
    expect(clip("Lorum\nipsum\n\n", 100, { maxLines: 2 })).toBe("Lorum\nipsum");
});

test("plain-text: test edge cases", () => {
    const options = { breakWords: true, html: true, indicator: "..." };

    expect(clip("one two - three \nfour five", 0, options)).toBe("...");
    expect(clip("one two - three \nfour five", 6, options)).toBe("one...");
});
