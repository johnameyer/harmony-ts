if(!performance) {
    var { performance } = require('perf_hooks');
}

const start = performance.now();

import { Scale, Key, IncompleteChord, RomanNumeral, defaultPartWritingParameters, PartWriting } from "harmony-ts";

const postImports = performance.now();
console.log('Importing took', postImports - start, 'milliseconds');

const scale = [Key.C, Scale.Quality.MAJOR] as Scale;
const chords = ['I', 'ii42', 'V65', 'I', 'IV', 'viio', 'iii', 'vi', 'ii', 'I64', 'V', 'I'];

const constraints = chords.map(chord => new IncompleteChord({romanNumeral: new RomanNumeral(chord, scale)}));

const postSetup = performance.now();
console.log('Setup took', postSetup - postImports, 'milliseconds');

const harmonyParams = { constraints, scale, useProgressions: false };
const iterator = PartWriting.voiceAll(defaultPartWritingParameters, constraints, scale, harmonyParams);
const result = iterator.next().value;

const postHarmonize = performance.now();
console.log('Harmonizing took', postHarmonize - postSetup, 'milliseconds');

if(!result || result.length !== constraints.length) {
    throw new Error('Should have been able to complete');
}