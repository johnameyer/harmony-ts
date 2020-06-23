import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Harmony, HarmonyParameters } from "./harmony";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Progression } from "./progression";
import { Key } from "../key";

const useProgressions = true;

describe('Harmony', () => {
    describe('harmonizeAll', () => {
        describe.each([true, false])('greedy %s', greedy => {
            test.each([
                [['E4', 'D4', 'E4'], [...Progression.Major.basic]],
                [['E4', 'D4', 'D4'], [...Progression.Major.basic, ...Progression.Major.basicPredominant]],
                [['C5', 'C5', 'C5'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.tonicSubstitutes]],
                [['E4', 'F4', 'G4'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths]],
            ])('soprano line %s', (notes, enabled) => {
                const soprano = notes.map(note => new AbsoluteNote(note));
                const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
                const scale = Scale.Major.notes;
                const params: HarmonyParameters = {scale, enabled, constraints, greedy, useProgressions };
                const result = Harmony.harmonizeAll(params);
                expect(result.furthest).toBe(notes.length);
                expect(result.solution).not.toBeNull();
                if(result.solution != null) {
                    expect(result.solution.map(chords => chords.voices[0].name)).toEqual(notes);
                }
            });
            
            test.each([
                [['C3', 'G3', 'G3'], [...Progression.Major.basic]],
                [['C3', 'D3', 'E3'], [...Progression.Major.basic, ...Progression.Major.basicInversions]],
                [['C3', 'D3', 'E3'], [...Progression.Major.basic, ...Progression.Major.dominantSevenths]],
                [['C3', 'C3', 'B2', 'C3'], [...Progression.Major.basic, ...Progression.Major.dominantSevenths, ...Progression.Major.subdominantSevenths]],
            ])('bass line %s', (notes, enabled) => {
                // const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => new AbsoluteNote(note));
                const bass = notes.map(note => new AbsoluteNote(note));
                const constraints = bass.map(bass => new IncompleteChord({voices: [undefined, undefined, undefined, bass]}));
                const scale = Scale.Major.notes;
                const params: HarmonyParameters = {scale, enabled, constraints, greedy, useProgressions };
                const result = Harmony.harmonizeAll(params);
                expect(result.furthest).toBe(notes.length);
                expect(result.solution).not.toBeNull();
                if(result.solution != null) {
                    expect(result.solution.map(chords => chords.voices[3].name)).toEqual(notes);
                }
            });
            
            test.each([
                [['I', 'V', 'I'], [...Progression.Major.basic]],
                [['I', 'I6', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.basicInversions]],
                [['I', 'ii6', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.basicPredominant]],
                [['I', 'vi', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.submediant]],
                [['I', 'V65', 'I'], [...Progression.Major.basic, ...Progression.Major.dominantSevenths]],
                [['I', 'ii65', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.subdominantSevenths]],
                [['I', 'I64', 'V7', 'I'], [...Progression.Major.basic]],
                [['I', 'vi', 'I6'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.tonicSubstitutes]],
                [['I', 'vi', 'I6', 'viio6', 'I', 'ii42', 'V65', 'I', 'ii6', 'I64', 'V'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths, ...Progression.Major.basicPredominant, ...Progression.Major.subdominantSevenths, ...Progression.Major.tonicSubstitutes]],
                [['I', 'IV', 'ii7', 'V', 'V42', 'I6'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths, ...Progression.Major.basicPredominant, ...Progression.Major.subdominantSevenths, ...Progression.Major.tonicSubstitutes]],
                [['I', 'V', 'V42', 'I6'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths, ...Progression.Major.basicPredominant, ...Progression.Major.subdominantSevenths, ...Progression.Major.tonicSubstitutes]],
            ])('roman numerals %s', (numerals, enabled) => {
                const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, Scale.Major.notes)}));
                const scale = Scale.Major.notes;
                const params: HarmonyParameters = {scale, enabled, constraints, greedy, useProgressions };
                const result = Harmony.harmonizeAll(params);
                expect(result.furthest).toBe(numerals.length);
                expect(result).not.toBeNull();
                if(result.solution != null) {
                    expect(result.solution.map(chords => chords.romanNumeral.name)).toEqual(numerals);
                }
            });
            
            test.each([
                [Key.B,     ['F#4', 'E4', 'D#4']],
                [Key.AFlat, ['Eb4', 'Db4', 'C4']],
                [Key.F,     ['C4', 'C4', 'E4']],
            ])('major key %s', (key, notes) => {
                const soprano = notes.map(note => new AbsoluteNote(note));
                const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
                const scale = Scale.transpose(Scale.Major.notes, key);
                const enabled = [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths];
                const params: HarmonyParameters = {scale, enabled, constraints, greedy, useProgressions };
                const result = Harmony.harmonizeAll(params);
                expect(result.furthest).toBe(notes.length);
                expect(result.solution).not.toBeNull();
                if(result.solution != null) {
                    expect(result.solution.map(chords => chords.voices[0].name)).toEqual(notes);
                }
            });
        });
        
        test.each([
            [
                'I V I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['D4', 'B3', 'G3', 'G2'], 'V'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Major.basic]
            ],
            [
                'I V65 I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['F4', 'D4', 'G3', 'B2'], 'V65'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Major.basic, ...Progression.Major.dominantSevenths]
            ],
            [
                'I V64 V I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['E4', 'C4', 'G3', 'G2'], 'I64'] as [string[], string],
                    [['D4', 'B3', 'G3', 'G2'], 'V'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Major.basic]
            ],
            [
                'I ii42 V65 I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['F4', 'D4', 'A3', 'C3'], 'ii42'] as [string[], string],
                    [['F4', 'D4', 'G3', 'B2'], 'V65'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Major.basic, ...Progression.Major.dominantSevenths, ...Progression.Major.subdominantSevenths]
            ],
            [
                'I viio6 I6',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['D4', 'B3', 'F3', 'D3'], 'viio6'] as [string[], string],
                    [['C4', 'C4', 'G3', 'E3'], 'I6'] as [string[], string]
                ],
                [...Progression.Major.basic, ...Progression.Major.basicInversions]
            ],
            // [
            //     'I V7 vi',
            //     [
            //         [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
            //         [['D4', 'B3', 'F3', 'G2'], 'V7'] as [string[], string],
            //         [['C4', 'C4', 'E3', 'A2'], 'vi'] as [string[], string]
            //     ],
            //     [...Progression.Major.basic, ...Progression.Major.basicInversions]
            // ]
        ])('specific voicing %s with soprano', (_, expected, enabled) => {
            const scale = Scale.Major.notes;
            const constraints = [];
            let first = true;
            for(const [voices, romanNumeral] of expected) {
                if(first) {
                    constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                    first = false;
                } else {
                    constraints.push(new IncompleteChord({voices: [new AbsoluteNote(voices[0]), undefined, undefined, undefined], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                }
            }
            const params: HarmonyParameters = {scale, enabled, constraints, greedy: false, useProgressions };
            const result = Harmony.harmonizeAll(params);
            expect(result.furthest).toBe(expected.length);
            expect(result.solution).not.toBeNull();
            if(result.solution != null) {
                for(let i = 0; i < expected.length; i++) {
                    expect(result.solution[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
                }
            }
        });

        
        test.each([
            [
                'I V V7',
                [
                    [['C5', 'G4', 'E4', 'C3'], 'I'] as [string[], string],
                    [['B4', 'G4', 'D4', 'G3'], 'V'] as [string[], string],
                    [['B4', 'F4', 'D4', 'G2'], 'V7'] as [string[], string]
                ],
                [...Progression.Major.basic]
            ],
        ])('specific voicing %s with bassline', (_, expected, enabled) => {
            const scale = Scale.Major.notes;
            const constraints = [];
            let first = true;
            for(const [voices, romanNumeral] of expected) {
                if(first) {
                    constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                    first = false;
                } else {
                    constraints.push(new IncompleteChord({voices: [undefined, undefined, undefined, new AbsoluteNote(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                }
            }
            const params: HarmonyParameters = {scale, enabled, constraints, greedy: false, useProgressions };
            const result = Harmony.harmonizeAll(params);
            expect(result.furthest).toBe(expected.length);
            expect(result.solution).not.toBeNull();
            if(result.solution != null) {
                for(let i = 0; i < expected.length; i++) {
                    expect(result.solution[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
                }
            }
        });
    });
});