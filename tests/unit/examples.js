const tape = require("tape");

const clip = require("../../src");

tape("examples: test examples from the README", function(test) {
    test.plan(4);

    test.strictEqual(clip("foo", 3), "foo");
    test.strictEqual(clip("foo", 2), "f…");
    test.strictEqual(clip("foo bar", 5), "foo …");
    test.strictEqual(clip("foo\nbar", 5), "foo");
});
