import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Harmony } from "./harmony";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";

describe('Harmony', () => {
    describe('harmonizeAll', () => {
        test.each([
            [['E4', 'D4', 'E4']],
        ])('soprano line', (notes) => {
            // const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => new AbsoluteNote(note));
            const soprano = notes.map(note => new AbsoluteNote(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale = Scale.Major.notes;
            const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral('I', scale));
            expect(result).not.toBeNull();
            if(result != null) {
                expect(result.map(chords => chords.voices[0].name)).toEqual(notes);
            }
        });

        test.each([
            [['C3', 'G3', 'G3']],
        ])('bass line', (notes) => {
            // const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => new AbsoluteNote(note));
            const bass = notes.map(note => new AbsoluteNote(note));
            const constraints = bass.map(bass => new IncompleteChord({voices: [undefined, undefined, undefined, bass]}));
            const scale = Scale.Major.notes;
            const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral('I', scale));
            expect(result).not.toBeNull();
            if(result != null) {
                expect(result.map(chords => chords.voices[3].name)).toEqual(notes);
            }
        });

        test.each([
            [['I', 'I64', 'V', 'I']],
        ])('roman numerals', (numerals) => {
            const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, Scale.Major.notes)}));
            const scale = Scale.Major.notes;
            const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral(numerals[0], scale));
            expect(result).not.toBeNull();
            if(result != null) {
                expect(result.map(chords => chords.romanNumeral.name)).toEqual(numerals);
            }
        });
    });
});