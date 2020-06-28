import { Scale, IncompleteChord, RomanNumeral, Harmony } from "harmony-ts";

const scale = Scale.Major.notes;
const chords = ['I', 'ii42', 'V65', 'I', 'IV', 'viio', 'iii', 'vi', 'ii', 'I64', 'V', 'ii'];

const constraints = chords.map(chord => new IncompleteChord({romanNumeral: new RomanNumeral(chord, scale)}));

const result = Harmony.harmonizeAll({constraints, scale, useProgressions: true});

if(result.furthest === constraints.length) {
    throw new Error('Should have not been able to complete');
}