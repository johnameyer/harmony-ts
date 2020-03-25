import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Harmony } from "./harmony";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";

describe('Harmony', () => {
    test('harmonizeAll', () => {
        const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => new AbsoluteNote(note));
        const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
        const scale = Scale.Major.notes;
        const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral('I', scale));
        expect(result).not.toBeNull();
    });
});