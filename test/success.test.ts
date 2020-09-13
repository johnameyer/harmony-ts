#!/usr/bin/env node

if(!performance) {
    var { performance } = require('perf_hooks');
}

const start = performance.now();


import yargs = require('yargs');

const argv = yargs
.scriptName('harmonizer-test')
.usage('$0 [args] ..progression')
.example('$0 -c true -k F I V', 'Times how long it takes to harmonize the progression I V I with harmony checks and key F Major')
.options({
    o: { choices: ['greedy', 'default', 'depth'], alias: 'ordering', desc: 'What order to generate results in' },
    k: { choices: ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'], default: 'C', alias: 'key', desc: 'What key to use' },
    // m: { type: 'boolean', alias: 'minor', desc: 'Should be minor key' }
})
.strict()
.showHelpOnFail(false, 'Use --help for available options')
.help()
.argv;

import { Scale, Key, IncompleteChord, RomanNumeral, PartWriter, flattenResult, Harmonizer, PartWriterParameters, flattenResults } from "harmony-ts";

const postImports = performance.now();
console.log('Preparation took', postImports - start, 'milliseconds');

const scale = [Key.fromString(argv.k), Scale.Quality.MAJOR] as Scale;
const chords = argv._;
chords.push('I');

const constraints = chords.map(chord => new IncompleteChord({romanNumeral: new RomanNumeral(chord, scale)}));

const postSetup = performance.now();

const harmonizer = new Harmonizer({ useProgressions: false });
const yieldOrdering = argv.o === 'greedy' ? PartWriterParameters.greedyOrdering : argv.o === 'depth' ? PartWriterParameters.depthOrdering : PartWriterParameters.defaultOrdering
const partWriter = new PartWriter({ yieldOrdering }, undefined, harmonizer);

console.log('Setup took', postSetup - postImports, 'milliseconds');

const harmonyIterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, scale));
const total = [...harmonyIterator];

if(!total.length) {
    throw new Error('Should have been able to harmonize');
} else {
    console.log('Harmony options numbered:', total.length);
}

const postHarmonize = performance.now();
console.log('Harmonizing took', postHarmonize - postSetup, 'milliseconds');

const iterator = flattenResult(partWriter.voiceAll(constraints, scale));
const result = iterator.next().value;

const postPartWrite = performance.now();
console.log('Part-writing took', postPartWrite - postHarmonize, 'milliseconds');

console.log('Expecting result');
if(!result || result.length !== constraints.length) {
    throw new Error('Should have been able to complete');
} else {
    console.log('Success');
}