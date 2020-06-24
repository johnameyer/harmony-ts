import { AbsoluteNote } from "../note/absolute-note";
import { PartWriting } from "./part-writing";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";

const absoluteNote = (note: string) => new AbsoluteNote(note);

const pair = <T>(arr: T[]) => [...Array(arr.length - 1).keys()].map((index) => [arr[index], arr[index + 1]] as [T, T])

describe('PartWriting', () => {
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
    ]))('checkAll %s to %s', (prev: any, chord: any) => {
        chord = new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes)),
        prev = new HarmonizedChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], Scale.Major.notes)),
        expect(PartWriting.Rules.checkSingular(undefined, chord)).toBe(-1);
        expect(PartWriting.Rules.testSingular(undefined, chord)).toBe(true);
        expect(PartWriting.Rules.checkAll(undefined, [chord, prev]).next().value).toBe(undefined);
        expect(PartWriting.Rules.testAll(undefined, [chord, prev])).toBe(true);
    });

    test.each(pair([
        ['I',   'E5', 'G4', 'C4', 'C3'],
        ['I64',  'E5', 'G4', 'C4', 'G3'],
        ['V',   'D5', 'G4', 'B3', 'G3'],
    ]))('checkAll %s to %s', (prev: any, chord: any) => {
        chord = new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes)),
        prev = new HarmonizedChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], Scale.Major.notes)),
        expect(PartWriting.Rules.checkSingular(undefined, chord)).toBe(-1);
        expect(PartWriting.Rules.testSingular(undefined, chord)).toBe(true);
        expect(PartWriting.Rules.checkAll(undefined, [chord, prev]).next().value).toBe(undefined);
        expect(PartWriting.Rules.testAll(undefined, [chord, prev])).toBe(true);
    });

    //I IV viio iii vi ii V I
    test('checkAll sequence', () => {
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
        chords = chords.map(chord => new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes), {sequence: true}));
        
        for(let i = 1; i < chords.length; i++) {
            expect(PartWriting.Rules.checkSingular(undefined, chords[i])).toBe(-1);
            expect(PartWriting.Rules.testSingular(undefined, chords[i])).toBe(true);
            expect(PartWriting.Rules.checkAll(undefined, chords.slice(0, i + 1).reverse()).next().value).toBe(undefined);
            expect(PartWriting.Rules.testAll(undefined, chords.slice(0, i + 1).reverse())).toBe(true);
        }
    });

    test('invalid progression sequence', () => {
        let chords: any[] = [
            ['IV', 'C5', 'F4', 'A3', 'F3'],
            ['viio', 'D5', 'F4', 'B3', 'B2'],
            ['iii', 'E5', 'G4', 'B3', 'E3'],
            ['vi', 'E5', 'A4', 'C4', 'A3'],
            ['ii', 'F5', 'A4', 'D4', 'D3'],
        ];
        chords = chords.map(chord => new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes), {sequence: true}));
        for(let i of [3,4,5]) {
            expect(PartWriting.Rules.checkAll(undefined, chords.slice(0, i).reverse()).next().value).not.toBe(undefined);
            expect(PartWriting.Rules.testAll(undefined, chords.slice(0, i).reverse())).toBe(false);
        }
    });

    test.each(pair([
        ['I',   'E5', 'G4', 'C4', 'C3'],
        ['V6',  'D5', 'G4', 'D4', 'B2'],
        ['V42/V',  'D5', 'A4', 'F#4', 'C3'],
        ['V6',  'D5', 'G4', 'G4', 'B2'],
    ]))('checkAll %s to %s', (prev: any, chord: any) => {
        chord = new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes)),
        prev = new HarmonizedChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], Scale.Major.notes)),
        expect(PartWriting.Rules.checkSingular(undefined, chord)).toBe(-1);
        expect(PartWriting.Rules.testSingular(undefined, chord)).toBe(true);
        expect(PartWriting.Rules.checkAll(undefined, [chord, prev]).next().value).toBe(undefined);
        expect(PartWriting.Rules.testAll(undefined, [chord, prev])).toBe(true);
    });

    test.each([
        [['I', 'C5', 'E4' , 'G3', 'C4']]
    ])('checkAll %s should fail', (chord: any) => {
        chord = new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes)),
        expect(PartWriting.Rules.checkSingular(undefined, chord)).not.toBe(-1);
        expect(PartWriting.Rules.testSingular(undefined, chord)).toBe(false);
    });
});