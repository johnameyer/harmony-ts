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
    ]))('checkAll %s to %s', (prev: any, chord: any) => {
        chord = new HarmonizedChord(chord.slice(1).map(absoluteNote), new RomanNumeral(chord[0], Scale.Major.notes)),
        prev = new HarmonizedChord(prev.slice(1).map(absoluteNote), new RomanNumeral(prev[0], Scale.Major.notes)),
        expect(PartWriting.Rules.checkSingular(undefined, chord)).toBe(-1);
        expect(PartWriting.Rules.testSingular(undefined, chord)).toBe(true);
        expect(PartWriting.Rules.checkAll(undefined, chord, prev).next().value).toBe(undefined);
        expect(PartWriting.Rules.testAll(undefined, chord, prev)).toBe(true);
    })
});