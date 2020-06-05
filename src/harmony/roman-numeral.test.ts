import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";

describe('RomanNumeral', () => {
    describe('valid', () => {
        describe('root position triad', () => {
            test.each([
                ['I', Scale.Major.notes],
                ['ii', Scale.Major.notes],
                ['viio', Scale.Major.notes],
                ['V/V', Scale.Major.notes]
            ])('%p', (value, scale) => {
                const romanNumeral = new RomanNumeral(value, scale);
                expect(romanNumeral.name).toBe(value);
            });
        });

        describe('inverted triad', () => {
            test.each([
                ['I6', Scale.Major.notes],
                ['ii6', Scale.Major.notes],
                ['viio6', Scale.Major.notes],
            ])('%p', (value, scale) => {
                const romanNumeral = new RomanNumeral(value, scale);
                expect(romanNumeral.name).toBe(value);
            });
        });

        describe('root seventh', () => {
            test.each([
                ['ii7', Scale.Major.notes],
                ['V7', Scale.Major.notes],
                ['vii07', Scale.Major.notes],
                ['viio7', Scale.NaturalMinor.notes],
            ])('%p', (value, scale) => {
                const romanNumeral = new RomanNumeral(value, scale);
                expect(romanNumeral.name).toBe(value);
                expect(romanNumeral.hasSeventh).toBe(true);
            });
        });

        describe('inverted seventh', () => {
            test.each([
                ['ii43', Scale.Major.notes],
                ['V42', Scale.Major.notes],
                ['vii065', Scale.Major.notes],
                ['viio65', Scale.HarmonicMinor.notes],
            ])('%p', (value, scale) => {
                const romanNumeral = new RomanNumeral(value, scale);
                expect(romanNumeral.name).toBe(value);
                expect(romanNumeral.hasSeventh).toBe(true);
            });
        });

        describe('applied chord', () => {
            test.each([
                ['V42/V', Scale.Major.notes],
                ['viio6/ii', Scale.Major.notes],
                ['vii07/vi', Scale.Major.notes],
            ])('%p', (value, scale) => {
                const embellished = new RomanNumeral(value, scale);
                const romanNumeral = new RomanNumeral(value, scale);
                expect(embellished.name).toBe(value);
                expect(embellished.intervals).not.toBe(romanNumeral.intervals);
                //TODO or something similar
            });
        });

        describe('root', () => {
            test.each([
                ['I', Scale.Major.notes, 'C'],
                ['ii', Scale.Major.notes, 'D'],
                ['viio', Scale.Major.notes, 'B'],
                ['V/V', Scale.NaturalMinor.notes, 'D']
            ])('%p', (value, scale, root) => {
                const romanNumeral = new RomanNumeral(value, scale);
                expect(romanNumeral.root.name).toBe(root);
            });
        });

        describe('root', () => {
            test.each([
                ['i', Scale.NaturalMinor.notes, 'C'],
                ['iio', Scale.NaturalMinor.notes, 'D'],
                ['VII', Scale.NaturalMinor.notes, 'Bb'],
                ['viio6', Scale.NaturalMinor.notes, 'B'], // special case
                ['V/V', Scale.NaturalMinor.notes, 'D']
            ])('%p', (value, scale, root) => {
                const romanNumeral = new RomanNumeral(value, scale);
                expect(romanNumeral.root.name).toBe(root);
            });
        });
    });
});