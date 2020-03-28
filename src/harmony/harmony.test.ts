import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Harmony } from "./harmony";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Progression } from "./progression";

describe('Harmony', () => {
    describe('harmonizeAll', () => {
        test.each([
            [['E4', 'D4', 'E4'], [...Progression.Major.basic]],
            [['E4', 'D4', 'D4'], [...Progression.Major.basic, ...Progression.Major.basicPredominant]],
            [['C4', 'C4', 'C4'], [...Progression.Major.basic, ...Progression.Major.tonicSubstitutes]],
        ])('soprano line %s', (notes, featureSet) => {
            const soprano = notes.map(note => new AbsoluteNote(note));
            const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
            const scale = Scale.Major.notes;
            const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral('I', scale), featureSet);
            expect(result).not.toBeNull();
            if(result != null) {
                expect(result.map(chords => chords.voices[0].name)).toEqual(notes);
            }
        });

        test.each([
            [['C3', 'G3', 'G3'], [...Progression.Major.basic]],
            [['C3', 'D3', 'E3'], [...Progression.Major.basic, ...Progression.Major.basicInversions]],
            [['C3', 'D3', 'E3'], [...Progression.Major.basic, ...Progression.Major.dominantSevenths]],
            [['C3', 'C3', 'B3', 'C3'], [...Progression.Major.basic, ...Progression.Major.dominantSevenths, ...Progression.Major.subdominantSevenths]],
        ])('bass line %s', (notes, featureSet) => {
            // const soprano = ['G4', 'F4', 'E4', 'D4', 'C4'].map(note => new AbsoluteNote(note));
            const bass = notes.map(note => new AbsoluteNote(note));
            const constraints = bass.map(bass => new IncompleteChord({voices: [undefined, undefined, undefined, bass]}));
            const scale = Scale.Major.notes;
            const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral('I', scale), featureSet);
            expect(result).not.toBeNull();
            if(result != null) {
                expect(result.map(chords => chords.voices[3].name)).toEqual(notes);
            }
        });

        test.each([
            [['I', 'V', 'I'], [...Progression.Major.basic]],
            [['I', 'I6', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.basicInversions]],
            [['I', 'ii6', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.basicPredominant]],
            [['I', 'vi', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.submediant]],
            [['I', 'V65', 'I'], [...Progression.Major.basic, ...Progression.Major.dominantSevenths]],
            [['I', 'ii65', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.subdominantSevenths]],
            [['I', 'I64', 'V', 'I'], [...Progression.Major.basic, ...Progression.Major.cad64]],
            [['I', 'vi', 'I6'], [...Progression.Major.basic, ...Progression.Major.tonicSubstitutes]],
            [['I', 'vi', 'I6', 'viio6', 'I', 'ii42', 'V65', 'I', 'ii6', 'I64', 'V'], [...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths, ...Progression.Major.basicPredominant, ...Progression.Major.subdominantSevenths, ...Progression.Major.cad64, ...Progression.Major.tonicSubstitutes]],
        ])('roman numerals %s', (numerals, featureSet) => {
            const constraints = numerals.map(numeral => new IncompleteChord({romanNumeral: new RomanNumeral(numeral, Scale.Major.notes)}));
            const scale = Scale.Major.notes;
            const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral(numerals[0], scale), featureSet);
            expect(result).not.toBeNull();
            if(result != null) {
                expect(result.map(chords => chords.romanNumeral.name)).toEqual(numerals);
            }
        });
    });
});