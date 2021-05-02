import { AbsoluteNote } from '../note/absolute-note';
import { PartWriting, defaultPartWritingParameters } from './part-writing';
import { CompleteChord } from '../chord/complete-chord';
import { RomanNumeral } from '../harmony/roman-numeral';
import { Scale } from '../scale';
import { Key } from '../key';

const CMajor = [Key.C, Scale.Quality.MAJOR] as Scale;

const absoluteNote = (note: string) => AbsoluteNote.fromString(note);

const pair = <T>(arr: T[]) => [...Array(arr.length - 1).keys()].map((index) => [arr[index], arr[index + 1]] as [T, T]);

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
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), RomanNumeral.fromString(prev[0], CMajor)),
            expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, [chord, prev]).next().value).toBe(undefined);
            expect(PartWriting.Rules.testAll(defaultPartWritingParameters, [chord, prev])).toBe(true);
        });

        test.each(pair([
            ['I', 'E4', 'C4', 'G3', 'C3'],
            ['viio6', 'D4', 'B3', 'F3', 'D3'],
            ['I6', 'C4', 'C4', 'G3', 'E3']
        ]))('%s to %s', (prev: any, chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), RomanNumeral.fromString(prev[0], CMajor)),
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
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), RomanNumeral.fromString(prev[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).toBe(undefined);
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
            chords = chords.map(chord => new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor).with({ flags: {sequence: true} })));
            
            for(let i = 1; i < chords.length; i++) {
                expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chords[i]).next().value).toBe(undefined);
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
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor)),
            prev = new CompleteChord(prev.slice(1).map(absoluteNote), RomanNumeral.fromString(prev[0], CMajor)),
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
            chords = chords.map(chord => new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor).with({ flags: { sequence: true } })));
            for(const i of [3,4,5]) {
                expect(PartWriting.Rules.checkAll(defaultPartWritingParameters, chords.slice(0, i).reverse()).next().value).not.toBe(undefined);
                expect(PartWriting.Rules.testAll(defaultPartWritingParameters, chords.slice(0, i).reverse())).toBe(false);
            }
        });
    });

    describe('checkSingular', () => {
        test.each([
            [['I', 'C5', 'E4', 'G3', 'C4']]
        ])('%s should fail', (chord: any) => {
            chord = new CompleteChord(chord.slice(1).map(absoluteNote), RomanNumeral.fromString(chord[0], CMajor)),
            expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, chord).next().value).not.toBe(undefined);
            expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, chord)).toBe(false);
        });
    });
    
    test('new rule should be used', function() {
        const validChord = new CompleteChord(['E5', 'G4', 'C4', 'C3'].map(absoluteNote), RomanNumeral.fromString('I', CMajor));

        expect(PartWriting.Rules.checkSingular(defaultPartWritingParameters, validChord).next().value).toBe(undefined);
        expect(PartWriting.Rules.testSingular(defaultPartWritingParameters, validChord)).toBe(true);

        const newRule = () => false;

        const customRules = PartWriting.extendDefaultParameters({ newRules: { newRule }, newSingularRules: ['newRule'] });

        expect(PartWriting.Rules.checkSingular(customRules, validChord).next().value).toBe('newRule');
        expect(PartWriting.Rules.testSingular(customRules, validChord)).toBe(false);
    });
});