const Benchmark = require("benchmark");

const clip = require("../../../dist");
const baseline = require("./baseline");
const trimHtml = require("trim-html");
const truncateHtml = require("truncate-html");
const htmlTruncate = require("html-truncate");

/* var TEST_STRING = (
    //'Dit is allemaal best een mooi verhaal, maar ik geloof er eigenlijk niet zo heel veel van.\n' +
    //'<table><tbody><tr><td>Hoi</td></tr></tbody></table>' +
    '<p>Laten we alvast brainstormen over een aantal van de belangrijkste thema&#39;s voor de ' +
    'vergadering die wij hebben over <img src=\'blaat\'> een paar dagen.of ' +
    '<a class="highlightable" href="http://www.nu.nl" rel="noopener noreferrer" target="_blank">' +
    'http://www.nu.nl</a></p>'
);*/
/* var TEST_STRING = '';
for (var i = 0; i < 100000; i++) {
    TEST_STRING += 'abcdefeghi';
}*/
const TEST_STRING = "Dit is een string die eigenlijk nog makkelijk past binnen de limiet.";
const TEST_LIMIT = 100;

const suite = new Benchmark.Suite();

// add tests
suite
    .add("text-clipper", function () {
        clip(TEST_STRING, TEST_LIMIT, { html: true });
    })
    .add("text-clipper-baseline", function () {
        baseline(TEST_STRING, TEST_LIMIT, { html: true });
    })
    .add("trim-html", function () {
        trimHtml(TEST_STRING, { limit: TEST_LIMIT });
    })
    .add("truncate-html", function () {
        truncateHtml(TEST_STRING, TEST_LIMIT);
    })
    .add("html-truncate", function () {
        htmlTruncate(TEST_STRING, TEST_LIMIT);
    })
    // add listeners
    .on("cycle", function (event) {
        console.log(String(event.target));
    })
    .on("complete", function () {
        console.log(`Fastest is ${this.filter("fastest").map("name")}`);
    })
    // run async
    .run({ async: true });
