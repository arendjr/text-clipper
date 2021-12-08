const { performance } = require("perf_hooks");

const clip = require("../../../dist").default;
const baseline = require("./baseline").default;
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

const MAX_RUN_TIME = 5000; // ms

const NUM_ITERATIONS_PER_MEASURE = 100;
const MAX_NUM_MEASURES = 1000;

const benchmarks = {
    "text-clipper": (string, limit) => clip(string, limit, { html: true }),
    "text-clipper-baseline": (string, limit) => baseline(string, limit, { html: true }),
    "trim-html": (string, limit) => trimHtml(string, { limit }),
    "truncate-html": truncateHtml,
    "html-truncate": htmlTruncate
};

for (const [name, fn] of Object.entries(benchmarks)) {
    console.log(`Benchmarking ${name}...`);

    let fastest = Infinity;
    let slowest = 0;

    const begin = performance.now();
    const measures = [];
    
    for (let i = 0; i < MAX_NUM_MEASURES; i++) {
        const start = performance.now();
        for (let j = 0; j < NUM_ITERATIONS_PER_MEASURE; j++) {
            const clipped = fn(TEST_STRING, TEST_LIMIT);

            // Just test to make sure the compiler doesn't eliminate everything.
            if (clipped.length > TEST_STRING.length) {
                process.exit("Clipped string is longer than input: " + clipped);
            }
        }
        const finish = performance.now();

        const time = finish - start;
        fastest = Math.min(fastest, time);
        slowest = Math.max(slowest, time);
        measures.push(time);

        if (finish - begin > MAX_RUN_TIME) {
            break;
        }
    }

    const average = measures.reduce((sum, measure) => sum + measure, 0) / measures.length;

    console.log(`Average ops/s: ${toOps(average)} (fastest: ${toOps(fastest)}, slowest: ${toOps(slowest)})`);
}

function toOps(measure) {
    return 1 / (measure / NUM_ITERATIONS_PER_MEASURE);
}
