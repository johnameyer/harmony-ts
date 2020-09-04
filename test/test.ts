#!/usr/bin/env node

if(!performance) {
    var { performance } = require('perf_hooks');
}

const start = performance.now();


import yargs = require('yargs');

const argv = yargs
.scriptName('harmonizer-test')
.usage('$0 [args] ..progression')
.options({
    c: { type: 'boolean', default: true, alias: 'check', desc: 'Whether to check the progressions' },
    f: { type: 'boolean', default: false, alias: 'expectFailure', desc: 'Whether the provided progression should fail' },
    o: { choices: ['greedy', 'default', 'depth'], alias: 'ordering', desc: 'What order to generate results in' },
    k: { choices: ['Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B'], default: 'C', alias: 'key', desc: 'What key to use' },
    // m: { type: 'boolean', alias: 'minor', desc: 'Should be minor key' }
})
.strict()
.showHelpOnFail(false, 'Use --help for available options')
.help()
.argv;

import { Scale, Key, IncompleteChord, RomanNumeral, PartWriter, flattenResult, Harmonizer, PartWriterParameters } from "harmony-ts";

const postImports = performance.now();
console.log('Preparation took', postImports - start, 'milliseconds');

const scale = [Key.fromString(argv.k), Scale.Quality.MAJOR] as Scale;
const chords = argv._;

const constraints = chords.map(chord => new IncompleteChord({romanNumeral: new RomanNumeral(chord, scale)}));

const postSetup = performance.now();

const harmonizer = new Harmonizer({ useProgressions: argv.c });
const yieldOrdering = argv.o === 'greedy' ? PartWriterParameters.greedyOrdering : argv.o === 'depth' ? PartWriterParameters.depthOrdering : PartWriterParameters.defaultOrdering
const partWriter = new PartWriter({ yieldOrdering }, undefined, harmonizer);

console.log('Setup took', postSetup - postImports, 'milliseconds');

const iterator = flattenResult(partWriter.voiceAll(constraints, scale));
const result = iterator.next().value;

const postHarmonize = performance.now();
console.log('Harmonizing took', postHarmonize - postSetup, 'milliseconds');


if(argv.f) {
    console.log('Expecting no results');
    if(result && result.length === constraints.length) {
        throw new Error('Should have not been able to complete');
    }
} else {
    console.log('Expecting result');
    if(!result || result.length !== constraints.length) {
        throw new Error('Should have been able to complete');
    }
}
console.log('Success');