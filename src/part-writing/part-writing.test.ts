import { AbsoluteNote } from "../note/absolute-note";
import { PartWriting, defaultPartWritingParameters, PartWritingParameters } from "./part-writing";
import { CompleteChord } from "../chord/complete-chord";
import { RomanNumeral } from "../harmony/roman-numeral";
import { Scale } from "../scale";
import { Key } from "../key";
import { Progression } from "../harmony/progression";
import { IncompleteChord } from "../chord/incomplete-chord";
import { HarmonyParameters, Harmony } from "../harmony/harmony";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { makePeekableIterator } from "../util/make-peekable-iterator";
import { flattenResults } from "../util/nested-iterable";

const CMajor = [Key.C, Scale.Quality.MAJOR] as Scale;
const GMajor = [Key.G, Scale.Quality.MAJOR] as Scale;
const CMinor = [Key.C, Scale.Quality.MINOR] as Scale;
const GMinor = [Key.G, Scale.Quality.MINOR] as Scale;

const absoluteNote = (note: string) => new AbsoluteNote(note);

const defaultPartWriter = new PartWriting();

const pair = <T>(arr: T[]) => [...Array(arr.length - 1).keys()].map((index) => [arr[index], arr[index + 1]] as [T, T])

describe('PartWriting', () => {
    describe('checkAll', () => {
        test.each(pair([
            ['I',   'C5', 'G4', 'E4', 'C4'],
            ['V65', 'D5', 'G4', 'F4', 'B3'],
            ['I',   'C5', 'G4', 'E4', 'C4'],
            ['ii42','D5', 'A4', 'F4', 'C4'],
            ['V65', 'D5', 'G4', 'F4', 'B3'],
            ['I',   'C5', 'G4', 'E4', 'C4'],
            ['I',   'C5', 'G4', 'E4', 'C4'],
            ['vi',  'C5', 'A4', 'E4', 'A3'],
            ['I6',  'C5', 'G4', 'E4', 'E3'],
            ['V43', 'B4', 'G4', 'F4', 'D3'],
            ['I',   'C5', 'G4', 'E4', 'C3'],
            ['V',   'B4', 'G4', 'D4', 'G3'],
            ['V42', 'B4', 'G4', 'D4', 'F3'],
            ['I6',  'C5', 'G4', 'E4', 'E3'],
            ['V',  'B4', 'G4', 'D4', 'G3'],
            ['V7',  'B4', 'F4', 'D4', 'G2'],
            ['I',   'C5', 'E4', 'C4', 'C3'],
            ['I',   'E5', 'G4', 'C4', 'C3'],
            ['I64',  'E5', 'G4', 'C4', 'G3'],
            ['V',   'D5', 'G4', 'B3', 'G3'],
        ]))('%s to %s', (prev: any, chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).toBe(undefined);
            expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chord)).toBe(true);
            expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, [chord, prev]).next().value).toBe(undefined);
            expect(PartWriting.Rules.testAll(defaultPartWritingParameters, [chord, prev])).toBe(true);
        });

        test.each(pair([
            ['I', 'E4', 'C4', 'G3', 'C3'],
            ['viio6', 'D4', 'B3', 'F3', 'D3'],
            ['I6', 'C4', 'C4', 'G3', 'E3']
        ]))('%s to %s', (prev: any, chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).toBe(undefined);
            expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chord)).toBe(true);
            expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, [chord, prev]).next().value).toBe(undefined);
            expect(PartWriting.Rules.testAll(defaultPartWritingParameters, [chord, prev])).toBe(true);
        });

        test.each(pair([
            ['I',   'E5', 'G4', 'C4', 'C3'],
            ['I64',  'E5', 'G4', 'C4', 'G3'],
            ['V',   'D5', 'G4', 'B3', 'G3'],
        ]))('%s to %s', (prev: any, chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).toBe(undefined);;
            expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chord)).toBe(true);
            expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, [chord, prev]).next().value).toBe(undefined);
            expect(PartWriting.Rules.testAll(defaultPartWritingParameters, [chord, prev])).toBe(true);
        });

        //I IV viio iii vi ii V I
        test('sequence', () => {
            let chords: any[] = [
                ['I', 'E5', 'G4', 'C4', 'C3'],
                ['IV', 'F5', 'A4', 'C4', 'F3'],
                ['viio', 'D5', 'F4', 'B3', 'B2'],
                ['iii', 'E5', 'G4', 'B3', 'E3'],
                ['vi', 'C5', 'E4', 'A3', 'A2'],
                ['ii', 'D5', 'F4', 'A3', 'D3'],
                ['V', 'B4', 'D4', 'G3', 'G2'],
                ['I', 'C5', 'E4', 'G3', 'C3']
            ];
            chords = chords.map(chord => new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor), {sequence: true}));
            
            for(let i = 1; i < chords.length; i++) {
                expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chords[i]).next().value).toBe(undefined);;
                expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chords[i])).toBe(true);
                expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, chords.slice(0, i + 1).reverse()).next().value).toBe(undefined);
                expect(PartWriting.Rules.testAll(defaultPartWritingParameters, chords.slice(0, i + 1).reverse())).toBe(true);
            }
        }); 

        test.each(pair([
            ['I',   'E5', 'G4', 'C4', 'C3'],
            ['V6',  'D5', 'G4', 'D4', 'B2'],
            ['V42/V',  'D5', 'A4', 'F#4', 'C3'],
            ['V6',  'D5', 'G4', 'G4', 'B2'],
        ]))('%s to %s', (prev: any, chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).toBe(undefined);
            expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chord)).toBe(true);
            expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, [chord, prev]).next().value).toBe(undefined);
            expect(PartWriting.Rules.testAll(defaultPartWritingParameters, [chord, prev])).toBe(true);
        });

        test('invalid sequence progression', () => {
            let chords: any[] = [
                ['IV', 'C5', 'F4', 'A3', 'F3'],
                ['viio', 'D5', 'F4', 'B3', 'B2'],
                ['iii', 'E5', 'G4', 'B3', 'E3'],
                ['vi', 'E5', 'A4', 'C4', 'A3'],
                ['ii', 'F5', 'A4', 'D4', 'D3'],
            ];
            chords = chords.map(chord => new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor), {sequence: true}));
            for(let i of [3,4,5]) {
                expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, chords.slice(0, i).reverse()).next().value).not.toBe(undefined);
                expect(PartWriting.Rules.testAll(defaultPartWritingParameters, chords.slice(0, i).reverse())).toBe(false);
            }
        });
    });

    describe('checkSingular', () => {
        test.each([
            [['I', 'C5', 'E4', 'G3', 'C4']]
        ])('%s should fail', (chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).not.toBe(undefined);
            expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chord)).toBe(false);
        });
    });
    
    test('new rule should be used', function() {
        const validChord = new CompleteChord(['E5', 'G4', 'C4', 'C3'].map(absoluteNote), new RomanNumeral('I', CMajor));

        expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, validChord).next().value).toBe(undefined);
        expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, validChord)).toBe(true);

        const newRule = () => false;

        const customRules = PartWriting.extendDefaultParameters({ newRules: { newRule }, newSingularRules: ['newRule'] });

        expect(PartWriting.Rules.checkSingular(customRules, validChord).next().value).toBe('newRule');
        expect(PartWriting.Rules.testSingular(customRules, validChord)).toBe(false);
    })

    describe('chordVoicing', () => {
        test.each([
            ['I'],
            ['V'],
            ['viio6']
        ])('%s without previous', (chord) => {
            const constraint = new HarmonizedChord({romanNumeral: new RomanNumeral(chord, CMajor)});

            const iterator = defaultPartWriter.chordVoicing(constraint);

            const first = iterator.next();
            expect(first.value).not.toBeUndefined();
        });

        
        test.each([
            ['V'],
            ['V6'],
            ['viio6']
        ])('%s with previous', (chord) => {
            const previous = new CompleteChord(['E4', 'C4', 'G3', 'C3'].map(absoluteNote), new RomanNumeral('I', CMajor));
            const constraint = new HarmonizedChord({romanNumeral: new RomanNumeral(chord, CMajor)});

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
            const soprano = notes.map(note => new AbsoluteNote(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale = CMajor;

            const harmonizer = new Harmony({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriting(undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResults(iterator).next().value as CompleteChord[];
            expect(result.map(chords => chords.voices[0].name)).toEqual(notes);
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

            const harmonizer = new Harmony({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriting(undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResults(iterator).next().value as CompleteChord[];
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
        ])('roman numerals %s', (numerals, enabled) => {
            const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, CMajor)}));
            const scale = CMajor;

            const harmonizer = new Harmony({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriting(undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResults(iterator).next().value as CompleteChord[];
            // @ts-ignore
            expect(result.map(chords => chords.romanNumeral.name)).toEqual(numerals);
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

            const harmonizer = new Harmony({ enabledProgressions: enabled, useProgressions : true });
            const partWriter = new PartWriting(undefined, harmonizer);
            const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

            expect(iterator.hasItems).toBe(true);
            
            const result = flattenResults(iterator).next().value as CompleteChord[];
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
        
        const harmonizer = new Harmony({ enabledProgressions: enabled, useProgressions: true });
        const params: PartWritingParameters = defaultPartWritingParameters;
        const partWriter = new PartWriting(params, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

        expect(iterator.hasItems).toBe(true);
        
        const result = flattenResults(iterator).next().value as CompleteChord[];
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
                constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale)}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [undefined, undefined, undefined, new AbsoluteNote(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
            }
        }

        const harmonizer = new Harmony({ enabledProgressions: enabled, useProgressions: true });
        const params: PartWritingParameters = defaultPartWritingParameters;
        const partWriter = new PartWriting(params, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, scale));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResults(iterator).next().value as CompleteChord[];
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
                constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale), flags}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [new AbsoluteNote(voices[0]), undefined, undefined, new AbsoluteNote(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
            }
        }

        const harmonizer = new Harmony({ canModulate: true, useProgressions: true });
        const partWriter = new PartWriting(undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, CMajor));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResults(iterator).next().value as CompleteChord[];// const result = Harmony.harmonizeAll(params);
        
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
                constraints.push(new IncompleteChord({voices: voices.map(str => new AbsoluteNote(str)), romanNumeral: new RomanNumeral(romanNumeral, scale), flags}));
                first = false;
            } else {
                constraints.push(new IncompleteChord({voices: [new AbsoluteNote(voices[0]), undefined, undefined, new AbsoluteNote(voices[3])], romanNumeral: new RomanNumeral(romanNumeral, scale)}));
            }
        }

        const harmonizer = new Harmony({ useProgressions: true });
        const partWriter = new PartWriting(undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, CMinor));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResults(iterator).next().value as CompleteChord[];// const result = Harmony.harmonizeAll(params);
        
        for(let i = 0; i < expected.length; i++) {
            expect(result[i].voices.map(voice => voice.name)).toEqual(expected[i][0]);
        }
    });

    test.each([
        [['C5', 'B4']],
        [['C5', 'D5', 'Eb5']],
        [['C5', 'B4', 'B4', 'C5']],
    ])('minor key %s', (soprano) => {
        const constraints = soprano.map(note => new IncompleteChord({voices: [new AbsoluteNote(note), undefined, undefined, undefined] }));
        
        const harmonizer = new Harmony({ canModulate: false, useProgressions: true });
        const partWriter = new PartWriting(undefined, harmonizer);
        const iterator = makePeekableIterator(partWriter.voiceAll(constraints, CMinor));

        expect(iterator.hasItems).toBe(true);

        const result = flattenResults(iterator).next().value as CompleteChord[];
        
        for(let i = 0; i < constraints.length; i++) {
            expect(result[i].voices[0].name).toEqual(soprano[i]);
            expect(result[i].romanNumeral.scale).toEqual(CMinor);
        }
    });
});