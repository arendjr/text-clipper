import clip from "../../src";

test("examples: test examples from the README", () => {
    expect(clip("foo", 3)).toBe("foo");
    expect(clip("foo", 2)).toBe("f…");
    expect(clip("foo bar", 5)).toBe("foo …");
    expect(clip("foo\nbar", 5)).toBe("foo");
});
