import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Harmony, HarmonyParameters } from "./harmony";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Progression } from "./progression";
import { Key } from "../key";

const useProgressions = true;

const CMajor: Scale = [Key.C, Scale.Quality.MAJOR];
const CMinor: Scale = [Key.C, Scale.Quality.MINOR];
const GMajor: Scale = [Key.G, Scale.Quality.MAJOR];

describe('Harmony', () => {
    describe('harmonizeAll', () => {
        describe.each([true, false])('greedy %s', greedy => {
            test.each([
                [['E4', 'D4', 'E4'], [...Progression.Shared.basic]],
                [['E4', 'D4', 'D4'], [...Progression.Shared.basic, ...Progression.Shared.basicPredominant]],
                [['C5', 'C5', 'C5'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.tonicSubstitutes]],
                [['E4', 'F4', 'G4'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths]],
            ])('soprano line %s', (notes, enabled) => {
                const soprano = notes.map(note => new AbsoluteNote(note));
                const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
                const scale = CMajor;
                const params: HarmonyParameters = {scale, enabledProgressions: enabled, constraints, greedy, useProgressions };
                const result = Harmony.harmonizeAll(params);
                expect(result.furthest).toBe(notes.length);
                expect(result.solution).not.toBeNull();
                if(result.solution != null) {
                    expect(result.solution.map(chords => chords.voices[0].name)).toEqual(notes);
                }
            });
            
            test.each([
                [['C3', 'G3', 'G3'], [...Progression.Shared.basic]],
                [['C3', 'D3', 'E3'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions]],
                [['C3', 'D3', 'E3'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths]],
                [['C3', 'C3', 'B2', 'C3'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths, ...Progression.Shared.subdominantSevenths]],
            ])('bass line %s', (notes, enabled) => {
                // const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => new AbsoluteNote(note));
                const bass = notes.map(note => new AbsoluteNote(note));
                const constraints = bass.map(bass => new IncompleteChord({voices: [undefined, undefined, undefined, bass]}));
                const scale = CMajor;
                const params: HarmonyParameters = {scale, enabledProgressions: enabled, constraints, greedy, useProgressions };
                const result = Harmony.harmonizeAll(params);
                expect(result.furthest).toBe(notes.length);
                expect(result.solution).not.toBeNull();
                if(result.solution != null) {
                    expect(result.solution.map(chords => chords.voices[3].name)).toEqual(notes);
                }
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
                const params: HarmonyParameters = {scale, enabledProgressions: enabled, constraints, greedy, useProgressions };
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
                const scale: Scale = [key, Scale.Quality.MAJOR];
                const enabled = [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths];
                const params: HarmonyParameters = {scale, enabledProgressions: enabled, constraints, greedy, useProgressions };
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
                [...Progression.Shared.basic]
            ],
            [
                'I V65 I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['F4', 'D4', 'G3', 'B2'], 'V65'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths]
            ],
            [
                'I V64 V I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['E4', 'C4', 'G3', 'G2'], 'I64'] as [string[], string],
                    [['D4', 'B3', 'G3', 'G2'], 'V'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Shared.basic]
            ],
            [
                'I ii42 V65 I',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['F4', 'D4', 'A3', 'C3'], 'ii42'] as [string[], string],
                    [['F4', 'D4', 'G3', 'B2'], 'V65'] as [string[], string],
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string]
                ],
                [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths, ...Progression.Shared.subdominantSevenths]
            ],
            [
                'I viio6 I6',
                [
                    [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                    [['D4', 'B3', 'F3', 'D3'], 'viio6'] as [string[], string],
                    [['C4', 'C4', 'G3', 'E3'], 'I6'] as [string[], string]
                ],
                [...Progression.Shared.basic, ...Progression.Shared.basicInversions]
            ],
            // [
            //     'I V7 vi',
            //     [
            //         [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
            //         [['D4', 'B3', 'F3', 'G2'], 'V7'] as [string[], string],
            //         [['C4', 'C4', 'E3', 'A2'], 'vi'] as [string[], string]
            //     ],
            //     [...Progression.Shared.basic, ...Progression.Shared.basicInversions]
            // ]
        ])('specific voicing %s with soprano', (_, expected, enabled) => {
            const scale = CMajor;
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
            const params: HarmonyParameters = {scale, enabledProgressions: enabled, constraints, greedy: false, useProgressions };
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
                [...Progression.Shared.basic]
            ],
        ])('specific voicing %s with bassline', (_, expected, enabled) => {
            const scale = CMajor;
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
            const params: HarmonyParameters = {scale, enabledProgressions: enabled, constraints, greedy: false, useProgressions };
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
                    constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale), flags}));
                    first = false;
                } else {
                    constraints.push(new IncompleteChord({voices: [new AbsoluteNote(voices[0]), undefined, undefined, new AbsoluteNote(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                }
            }
            const params: HarmonyParameters = {scale: CMajor, canModulate: true, constraints, greedy: false, useProgressions };
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
                    constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale), flags}));
                    first = false;
                } else {
                    constraints.push(new IncompleteChord({voices: [new AbsoluteNote(voices[0]), undefined, undefined, new AbsoluteNote(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                }
            }
            const params: HarmonyParameters = {scale: CMinor, canModulate: false, constraints, greedy: false, useProgressions };
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
            [['C5', 'B4']],
            [['C5', 'D5', 'Eb5']],
            [['C5', 'B4', 'B4', 'C5']],
        ])('minor key %s', (soprano) => {
            const constraints = soprano.map(note => new IncompleteChord({voices: [new AbsoluteNote(note), undefined, undefined, undefined] }));
            const params: HarmonyParameters = {scale: CMinor, canModulate: true, constraints, greedy: false, useProgressions };
            const result = Harmony.harmonizeAll(params);
            expect(result.furthest).toBe(constraints.length);
            expect(result.solution).not.toBeNull();
            if(result.solution != null) {
                for(let i = 0; i < constraints.length; i++) {
                    expect(result.solution[i].voices[0].name).toEqual(soprano[i]);
                    expect(result.solution[i].romanNumeral.scale).toEqual(CMinor);
                }
            }
        });
    });
});