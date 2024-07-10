import { assertEquals } from "jsr:@std/assert";

import clip from "../../src/index.ts";

Deno.test("examples: test examples from the README", () => {
    assertEquals(clip("foo", 3), "foo");
    assertEquals(clip("foo", 2), "f…");
    assertEquals(clip("foo bar", 5), "foo …");
    assertEquals(clip("foo\nbar", 5), "foo");
});
