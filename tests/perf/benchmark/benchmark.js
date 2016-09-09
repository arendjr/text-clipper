var Benchmark = require('benchmark');

var clip = require('../../../dist');
var baseline = require('./baseline');
var trimHtml = require('trim-html');
var truncateHtml = require('truncate-html');
var htmlTruncate = require('html-truncate');

var TEST_STRING = (
    //'Dit is allemaal best een mooi verhaal, maar ik geloof er eigenlijk niet zo heel veel van.\n' +
    //'<table><tbody><tr><td>Hoi</td></tr></tbody></table>' +
    '<p>Laten we alvast brainstormen over een aantal van de belangrijkste thema&#39;s voor de ' +
    'vergadering die wij hebben over <img src=\'blaat\'> een paar dagen.of ' +
    '<a class="highlightable" href="http://www.nu.nl" rel="noopener noreferrer" target="_blank">' +
    'http://www.nu.nl</a></p>'
);
var TEST_LIMIT = 100;

var suite = new Benchmark.Suite;

// add tests
suite.add('text-clipper', function() {
    clip(TEST_STRING, TEST_LIMIT, { html: true });
})
.add('text-clipper-baseline', function() {
    baseline(TEST_STRING, TEST_LIMIT, { html: true });
})
.add('trim-html', function() {
    trimHtml(TEST_STRING, { limit: TEST_LIMIT });
})
.add('truncate-html', function() {
    truncateHtml(TEST_STRING, TEST_LIMIT);
})
.add('html-truncate', function() {
    htmlTruncate(TEST_STRING, TEST_LIMIT);
})
// add listeners
.on('cycle', function(event) {
    console.log(String(event.target));
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });
