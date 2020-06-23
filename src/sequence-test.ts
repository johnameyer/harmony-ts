import { Scale, IncompleteChord, RomanNumeral, Progression, Harmony } from '.';
import { Predicate, Producer } from './harmony/progression';

const numerals = ['I', 'IV', 'viio', 'iii', 'vi'];
const [key, minor] = ['C', 'false'];
const scale = minor === undefined ? Scale.transpose(Scale.Major.notes, key) : Scale.transpose(Scale.NaturalMinor.notes, key);
const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, scale)}));
const start = numerals[0];
const enabled: [Predicate, Producer][] = 
                [...Progression.Major.identity, ...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths, ...Progression.Major.basicPredominant, ...Progression.Major.subdominantSevenths, ...Progression.Major.submediant, ...Progression.Major.tonicSubstitutes, ...Progression.Major.secondaryDominant];

Harmony.harmonizeAll({scale, start, constraints, greedy: false, enabled, useProgressions: true});

console.log('Finished');