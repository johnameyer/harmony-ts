import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Harmonizer, HarmonizerParameters } from "./harmonizer";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Progression } from "./progression";
import { Key } from "../key";
import { HarmonizedChord } from "..";
import { flattenResults } from "../util/nested-iterable";

const useProgressions = true;

const CMajor: Scale = [Key.C, Scale.Quality.MAJOR];
const CMinor: Scale = [Key.C, Scale.Quality.MINOR];
const GMajor: Scale = [Key.G, Scale.Quality.MAJOR];

const setUpHarmonizer = (params: HarmonizerParameters) => new Harmonizer(params);

describe('Harmony', () => {
    describe('matchingCompleteHarmony', () => {
        test.each([
            [['E4', 'D4', 'E4'], [...Progression.Shared.basic]],
            [['E4', 'D4', 'D4'], [...Progression.Shared.basic, ...Progression.Shared.basicPredominant]],
            [['C5', 'C5', 'C5'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.tonicSubstitutes]],
            [['E4', 'F4', 'G4'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths]],
        ])('soprano line %s', (notes, enabled) => {
            const soprano = notes.map(note => AbsoluteNote.fromString(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale = CMajor;
            const harmonizer = setUpHarmonizer({ enabledProgressions: enabled, useProgressions });
            const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, scale));
            const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
            expect(result.value).toBeTruthy();
            expect(result.value.length).toBe(notes.length);
            expect(result.value.map(chords => chords.voices[0]?.name)).toEqual(notes);
        });

        test.each([
            [['C5', 'B4', 'Ab4'], [...Progression.Shared.basic]],
            [['C5', 'B4', 'B4', 'B4', 'Ab4'], [...Progression.Shared.basic]]
        ])('impossible soprano line %s', (notes, enabled) => {
            const soprano = notes.map(note => AbsoluteNote.fromString(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale = CMajor;
            const harmonizer = setUpHarmonizer({ enabledProgressions: enabled, useProgressions });
            const iterator = harmonizer.matchingCompleteHarmony(constraints, scale);
            const result = iterator.next();
            expect(result.value).toBe(undefined);
        });

        test.each([
            [['C3', 'G3', 'G3'], [...Progression.Shared.basic]],
            [['C3', 'D3', 'E3'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions]],
            [['C3', 'D3', 'E3'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths]],
            [['C3', 'C3', 'B2', 'C3'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths, ...Progression.Shared.subdominantSevenths]],
        ])('bass line %s', (notes, enabled) => {
            const bass = notes.map(note => AbsoluteNote.fromString(note));
            const constraints = bass.map(bass => new IncompleteChord({voices: [undefined, undefined, undefined, bass]}));
            const scale = CMajor;
            const harmonizer = setUpHarmonizer({ enabledProgressions: enabled, useProgressions });
            const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, scale));
            const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
            expect(result.value).toBeTruthy();
            expect(result.value.length).toBe(notes.length);
            expect(result.value.map(chords => chords.voices[3]?.name)).toEqual(notes);
        });

        
        test.each([
            [['I', 'V', 'I']],
            [['I', 'ii42', 'V65', 'I']],
        ])('roman numerals without check %s', (numerals) => {
            const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, CMajor)}));
            const scale = CMajor;
            const harmonizer = setUpHarmonizer({ useProgressions: false });
            const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, scale));
            const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
            expect(result.value).toBeTruthy();
            expect(result.value.length).toBe(numerals.length);
            expect(result.value.map(chords => chords.romanNumeral.name)).toEqual(numerals);
        });
        
        test.each([
            [['I', 'V', 'I'], [...Progression.Shared.basic]],
            [['I', 'I6', 'V', 'I'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions]],
            [['I', 'ii6', 'V', 'I'], [...Progression.Shared.basic, ...Progression.Shared.basicPredominant]],
            [['I', 'vi', 'V', 'I'], [...Progression.Shared.basic, ...Progression.Shared.submediant]],
            [['I', 'V65', 'I'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths]],
            [['I', 'ii65', 'V', 'I'], [...Progression.Shared.basic, ...Progression.Shared.subdominantSevenths]],
            [['I', 'I64', 'V7', 'I'], [...Progression.Shared.basic]],
            [['I', 'vi', 'I6'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.tonicSubstitutes]],
            [['I', 'vi', 'I6', 'viio6', 'I', 'ii42', 'V65', 'I', 'ii6', 'I64', 'V'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths, ...Progression.Shared.basicPredominant, ...Progression.Shared.subdominantSevenths, ...Progression.Shared.tonicSubstitutes]],
            [['I', 'IV', 'ii7', 'V', 'V42', 'I6'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths, ...Progression.Shared.basicPredominant, ...Progression.Shared.subdominantSevenths, ...Progression.Shared.tonicSubstitutes]],
            [['I', 'V', 'V42', 'I6'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths, ...Progression.Shared.basicPredominant, ...Progression.Shared.subdominantSevenths, ...Progression.Shared.tonicSubstitutes]],
        ])('roman numerals %s', (numerals, enabled) => {
            const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, CMajor)}));
            const scale = CMajor;
            const harmonizer = setUpHarmonizer({ enabledProgressions: enabled, useProgressions });
            const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, scale));
            const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
            expect(result.value).toBeTruthy();
            expect(result.value.length).toBe(numerals.length);
            expect(result.value.map(chords => chords.romanNumeral.name)).toEqual(numerals);
        });
        
        test.each([
            [Key.B,     ['F#4', 'E4', 'D#4']],
            [Key.AFlat, ['Eb4', 'Db4', 'C4']],
            [Key.F,     ['C4', 'C4', 'E4']],
        ])('major key %s', (key, notes) => {
            const soprano = notes.map(note => AbsoluteNote.fromString(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale: Scale = [key, Scale.Quality.MAJOR];
            const enabled = [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths];
            const harmonizer = setUpHarmonizer({ enabledProgressions: enabled, useProgressions });
            const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, scale));
            const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
            expect(result.value).toBeTruthy();
            expect(result.value.length).toBe(notes.length);
            expect(result.value.map(chords => chords.voices[0]?.name)).toEqual(notes);
        });
    });
    
    test.each([
        [
            'I vi/ii V I',
            [
                [['E4', 'C4', 'G3', 'C3'], 'I', CMajor, {}] as [string[], string, Scale, {}],
                [['E4', 'C4', 'A3', 'A2'], 'ii', GMajor, {pivot: true}] as [string[], string, Scale, {}],
                [['F#4', 'D4', 'A3', 'D3'], 'V', GMajor, {}] as [string[], string, Scale, {}],
                [['G4', 'D4', 'B3', 'G3'], 'I', GMajor, {pac: true}] as [string[], string, Scale, {}]
            ]
        ],
    ])('modulation %s', (_, expected) => {
        const constraints = [];
        let first = true;
        for(const [voices, romanNumeral, scale, flags] of expected) {
            if(first) {
                constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: new RomanNumeral(romanNumeral, scale), flags}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [AbsoluteNote.fromString(voices[0]), undefined, undefined, AbsoluteNote.fromString(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
            }
        }
        const harmonizer = setUpHarmonizer({ canModulate: true, useProgressions });
        const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, CMajor));
        const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
        expect(result.value).toBeTruthy();
        expect(result.value.length).toBe(expected.length);
        for(let i = 0; i < expected.length; i++) {
            expect(result.value[i].voices[0]?.name).toEqual(expected[i][0][0]);
            expect(result.value[i].voices[3]?.name).toEqual(expected[i][0][3]);
        }
    });

    test.each([
        [
            'i V',
            [
                [['Eb4', 'C4', 'G3', 'C3'], 'i', CMinor, {}] as [string[], string, Scale, {}],
                [['D4', 'B3', 'G3', 'G2'], 'V', CMinor, {}] as [string[], string, Scale, {}],
            ]
        ],
        [
            'i V i',
            [
                [['Eb4', 'C4', 'G3', 'C3'], 'i', CMinor, {}] as [string[], string, Scale, {}],
                [['D4', 'B3', 'G3', 'G2'], 'V', CMinor, {}] as [string[], string, Scale, {}],
                [['Eb4', 'C4', 'G3', 'C3'], 'i', CMinor, {iac: true}] as [string[], string, Scale, {}],
            ]
        ],
        [
            'i VII iv6 V',
            [
                [['C5', 'Eb4', 'G3', 'C3'], 'i', CMinor, {}] as [string[], string, Scale, {}],
                [['D5', 'F4', 'Bb3', 'Bb2'], 'VII', CMinor, {}] as [string[], string, Scale, {}],
                [['C5', 'F4', 'C4', 'Ab2'], 'iv6', CMinor, {}] as [string[], string, Scale, {}],
                [['B4', 'G4', 'D4', 'G2'], 'V', CMinor, { hc: true }] as [string[], string, Scale, {}],
            ]
        ],
    ])('minor key %s', (_, expected) => {
        const constraints = [];
        let first = true;
        for(const [voices, romanNumeral, scale, flags] of expected) {
            if(first) {
                constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: new RomanNumeral(romanNumeral, scale), flags}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [AbsoluteNote.fromString(voices[0]), undefined, undefined, AbsoluteNote.fromString(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
            }
        }
        const harmonizer = setUpHarmonizer({ canModulate: false, useProgressions });
        const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, CMinor));
        const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
        expect(result.value).toBeTruthy();
        expect(result.value.length).toBe(expected.length);
        for(let i = 0; i < expected.length; i++) {
            expect(result.value[i].voices[0]?.name).toEqual(expected[i][0][0]);
            expect(result.value[i].voices[3]?.name).toEqual(expected[i][0][3]);
        }
    });

    test.each([
        [['C5', 'B4']],
        [['C5', 'D5', 'Eb5']],
        [['C5', 'B4', 'B4', 'C5']],
    ])('minor key %s', (soprano) => {
        const constraints = soprano.map(note => new IncompleteChord({voices: [AbsoluteNote.fromString(note), undefined, undefined, undefined] }));
        const harmonizer = setUpHarmonizer({ canModulate: true, useProgressions });
        const iterator = flattenResults(harmonizer.matchingCompleteHarmony(constraints, CMinor));
        const result = iterator.next() as IteratorResult<HarmonizedChord[], never>;
        expect(result.value).toBeTruthy();
        expect(result.value.length).toBe(constraints.length);
        for(let i = 0; i < constraints.length; i++) {
            expect(result.value[i].voices[0]?.name).toEqual(soprano[i]);
            expect(result.value[i].romanNumeral.scale).toEqual(CMinor);
        }
    });
});