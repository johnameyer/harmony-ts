if(!performance) {
    var { performance } = require('perf_hooks');
}

const start = performance.now();

import { Scale, Key, IncompleteChord, RomanNumeral, PartWriter, flattenResult, Harmonizer, PartWriterParameters } from "harmony-ts";

const postImports = performance.now();
console.log('Importing took', postImports - start, 'milliseconds');

const scale = [Key.C, Scale.Quality.MAJOR] as Scale;
const chords = ['I', 'ii42', 'V65', 'I', 'IV', 'viio', 'iii', 'vi', 'ii', 'I64', 'V', 'ii'];

const constraints = chords.map(chord => new IncompleteChord({romanNumeral: new RomanNumeral(chord, scale)}));

const postSetup = performance.now();

const harmonizer = new Harmonizer({ useProgressions: true });
const partWriter = new PartWriter({yieldOrdering: PartWriterParameters.depthOrdering}, undefined, harmonizer);

console.log('Setup took', postSetup - postImports, 'milliseconds');

const iterator = flattenResult(partWriter.voiceAll(constraints, scale));
const result = iterator.next().value;

const postHarmonize = performance.now();
console.log('Harmonizing took', postHarmonize - postSetup, 'milliseconds');

if(result && result.length === constraints.length) {
    throw new Error('Should have not been able to complete');
}