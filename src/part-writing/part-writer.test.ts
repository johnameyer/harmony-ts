import { HarmonizedChord } from "../chord/harmonized-chord";
import { RomanNumeral } from "../harmony/roman-numeral";
import { CompleteChord } from "../chord/complete-chord";
import { Progression } from "../harmony/progression";
import { AbsoluteNote } from "../note/absolute-note";
import { IncompleteChord } from "../chord/incomplete-chord";
import { Harmonizer } from "../harmony/harmonizer";
import { PartWriter } from './part-writer';
import { makePeekableIterator } from "../util/make-peekable-iterator";
import { flattenResult } from "../util/nested-iterable";
import { Key } from "../key";
import { Scale } from "../scale";
import { PartWriterParameters } from "..";

const absoluteNote = (note: string) => AbsoluteNote.fromString(note);

const CMajor = [Key.C, Scale.Quality.MAJOR] as Scale;
const GMajor = [Key.G, Scale.Quality.MAJOR] as Scale;
const CMinor = [Key.C, Scale.Quality.MINOR] as Scale;
const GMinor = [Key.G, Scale.Quality.MINOR] as Scale;

const defaultPartWriter = new PartWriter();

describe('PartWriter', () => {
    
    describe('chordVoicing', () => {
        test.each([
            ['I'],
            ['V'],
            ['viio6']
        ])('%s without previous', (chord) => {
            const constraint = new HarmonizedChord({romanNumeral: RomanNumeral.fromString(chord, CMajor)});

            const iterator = defaultPartWriter.chordVoicing(constraint);

            const first = iterator.next();
            expect(first.value).not.toBeUndefined();
        });

        
        test.each([
            ['V'],
            ['V6'],
            ['viio6']
        ])('%s with previous', (chord) => {
            const previous = new CompleteChord(['E4', 'C4', 'G3', 'C3'].map(absoluteNote), RomanNumeral.fromString('I', CMajor));
            const constraint = new HarmonizedChord({romanNumeral: RomanNumeral.fromString(chord, CMajor)});

            const iterator = defaultPartWriter.chordVoicing(constraint, [previous]);

            const first = iterator.next();
            expect(first.value).not.toBeUndefined();
        });
    });
    
    describe('voiceAll', () => {
        test.each([
            [['E4', 'D4', 'E4'], [...Progression.Shared.basic]],
            [['E4', 'D4', 'D4'], [...Progression.Shared.basic, ...Progression.Shared.basicPredominant]],
            [['C5', 'C5', 'C5'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.tonicSubstitutes]],
            [['E4', 'F4', 'G4'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths]],
        ])('soprano line %s', (notes, enabled) => {
            const soprano = notes.map(note => AbsoluteNote.fromString(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale = CMajor;

            const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriter(undefined, undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
            expect(result.map(chords => chords.voices[0].name)).toEqual(notes);
        });

        test.each([
            [['C3', 'G3', 'G3'], [...Progression.Shared.basic]],
            [['C3', 'D3', 'E3'], [...Progression.Shared.basic, ...Progression.Shared.basicInversions]],
            [['C3', 'D3', 'E3'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths]],
            [['C3', 'C3', 'B2', 'C3'], [...Progression.Shared.basic, ...Progression.Shared.dominantSevenths, ...Progression.Shared.subdominantSevenths]],
        ])('bass line %s', (notes, enabled) => {
            // const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => AbsoluteNote.fromString(note));
            const bass = notes.map(note => AbsoluteNote.fromString(note));
            const constraints = bass.map(bass => new IncompleteChord({voices: [undefined, undefined, undefined, bass]}));
            const scale = CMajor;

            const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriter(undefined, undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
            // @ts-ignore
            expect(result.map(chords => chords.voices[3].name)).toEqual(notes);
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
            [['I', 'IV', 'viio', 'iii', 'vi', 'ii', 'V', 'I'], [...Progression.Shared.basic]],
        ])('roman numerals %s', (numerals, enabled) => {
            const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: RomanNumeral.fromString(numeral, CMajor)}));
            const scale = CMajor;

            const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriter(undefined, undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
            // @ts-ignore
            expect(result.map(chords => chords.romanNumeral.name)).toEqual(numerals);
        });

        
        describe.each([
            ['greedy', PartWriterParameters.greedyOrdering],
            ['default', PartWriterParameters.defaultOrdering],
            ['depth', PartWriterParameters.depthOrdering]
        ])('ordering %s', (_, ordering) => {
            test.each([
                [['I', 'V', 'I']],
                [['I', 'ii42', 'V65', 'I']],
            ])('roman numerals %s', (numerals) => {
                const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: RomanNumeral.fromString(numeral, CMajor)}));
                const scale = CMajor;

                const harmonizer = new Harmonizer({ useProgressions: true });
                const partWriter = new PartWriter({yieldOrdering: ordering}, undefined, harmonizer);
                const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

                expect(iterator.hasItems).toBe(true);
                
                const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
                // @ts-ignore
                expect(result.map(chords => chords.romanNumeral.name)).toEqual(numerals);
            });
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

            const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriter(undefined, undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
            expect(result.map(chords => chords.voices[0].name)).toEqual(notes);
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
        ]
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
                constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [AbsoluteNote.fromString(voices[0]), undefined, undefined, undefined], romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
            }
        }
        
        const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions: true });
        const partWriter = new PartWriter(undefined, undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

        expect(iterator.hasItems).toBe(true);
        
        const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
        for(let i = 0; i < expected.length; i++) {
            expect(result[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
        }
        
    });

    test.each([
        [
            'I IV viio iii vi V',
            [
                [['E4', 'C4', 'G3', 'C3'], 'I'] as [string[], string],
                [['F4', 'C4', 'A3', 'F3'], 'IV'] as [string[], string],
                [['D4', 'B3', 'F3', 'B2'], 'viio'] as [string[], string],
                [['E4', 'B3', 'G3', 'E3'], 'iii'] as [string[], string],
                [['E4', 'C4', 'A3', 'A2'], 'vi'] as [string[], string],
                [['G4', 'D4', 'B3', 'G2'], 'V'] as [string[], string],
            ],
            [...Progression.Shared.basic, ...Progression.Shared.submediant, ...Progression.Shared.mediant]
        ]
    ])('fully specified %s', (_, expected, enabled) => {
        const scale = CMajor;
        const constraints = [];
        for(const [voices, romanNumeral] of expected) {
            constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
        }
        
        const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions: true });
        const partWriter = new PartWriter(undefined, undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

        expect(iterator.hasItems).toBe(true);
        
        const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
        for(let i = 0; i < expected.length; i++) {
            expect(result[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
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
                constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [undefined, undefined, undefined, AbsoluteNote.fromString(voices[3])], romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
            }
        }

        const harmonizer = new Harmonizer({ enabledProgressions: enabled, useProgressions: true });
        const partWriter = new PartWriter(undefined, undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
        for(let i = 0; i < expected.length; i++) {
            expect(result[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
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
                constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: RomanNumeral.fromString(romanNumeral, scale), flags}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [AbsoluteNote.fromString(voices[0]), undefined, undefined, AbsoluteNote.fromString(voices[3])], romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
            }
        }

        const harmonizer = new Harmonizer({ canModulate: true, useProgressions: true });
        const partWriter = new PartWriter(undefined, undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, CMajor));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
        
        for(let i = 0; i < expected.length; i++) {
            expect(result[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
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
                constraints.push(new IncompleteChord({voices: voices.map(str => AbsoluteNote.fromString(str)), romanNumeral: RomanNumeral.fromString(romanNumeral, scale), flags}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [AbsoluteNote.fromString(voices[0]), undefined, undefined, AbsoluteNote.fromString(voices[3])], romanNumeral: RomanNumeral.fromString(romanNumeral, scale)}));
            }
        }

        const harmonizer = new Harmonizer({ useProgressions: true });
        const partWriter = new PartWriter(undefined, undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, CMinor));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];// const result = Harmony.harmonizeAll(params);
        
        for(let i = 0; i < expected.length; i++) {
            expect(result[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
        }
    });

    test.each([
        [['C5', 'B4']],
        [['C5', 'D5', 'Eb5']],
        [['C5', 'B4', 'B4', 'C5']],
    ])('minor key %s', (soprano) => {
        const constraints = soprano.map(note => new IncompleteChord({voices: [AbsoluteNote.fromString(note), undefined, undefined, undefined] }));
        
        const harmonizer = new Harmonizer({ canModulate: false, useProgressions: true });
        const partWriter = new PartWriter(undefined, undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, CMinor));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResult(iterator[Symbol.iterator]()).next().value as CompleteChord[];
        
        for(let i = 0; i < constraints.length; i++) {
            expect(result[i].voices[0].name).toEqual(soprano[i]);
            expect(result[i].romanNumeral.scale).toEqual(CMinor);
        }
    });
});