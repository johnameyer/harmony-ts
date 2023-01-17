import { RomanNumeral } from './roman-numeral';
import { Scale } from '../scale';
import { Key } from '../key';

const CMajor: Scale = [ Key.C, Scale.Quality.MAJOR ];
const CMinor: Scale = [ Key.C, Scale.Quality.MINOR ];

describe('RomanNumeral', () => {
    describe('valid', () => {
        describe('root position triad', () => {
            test.each([
                [ 'I', CMajor ],
                [ 'ii', CMajor ],
                [ 'viio', CMajor ],
                [ 'V/V', CMajor ],
                [ 'bVI', CMajor ],
            ])('%p', (value, scale) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                expect(romanNumeral.name).toBe(value);
            });
        });

        describe('inverted triad', () => {
            test.each([
                [ 'I6', CMajor ],
                [ 'ii6', CMajor ],
                [ 'viio6', CMajor ],
                [ 'bVII6', CMajor ],
            ])('%p', (value, scale) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                expect(romanNumeral.name).toBe(value);
            });
        });

        describe('root seventh', () => {
            test.each([
                [ 'ii7', CMajor ],
                [ 'V7', CMajor ],
                [ 'vii07', CMajor ],
                [ 'viio7', CMinor ],
                [ 'bVII7', CMajor ],
            ])('%p', (value, scale) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                expect(romanNumeral.name).toBe(value);
                expect(romanNumeral.hasSeventh).toBe(true);
            });
        });

        describe('inverted seventh', () => {
            test.each([
                [ 'ii43', CMajor ],
                [ 'V42', CMajor ],
                [ 'vii065', CMajor ],
                [ 'viio65', CMinor ],
                [ 'bVII42', CMajor ],
            ])('%p', (value, scale) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                expect(romanNumeral.name).toBe(value);
                expect(romanNumeral.hasSeventh).toBe(true);
            });
        });

        describe('applied chord', () => {
            test.each([
                [ 'V42/V', CMajor ],
                [ 'viio6/II', CMajor ],
                [ 'vii07/VI', CMajor ],
            ])('%p', (value, scale) => {
                const embellished = RomanNumeral.fromString(value, scale);
                const romanNumeral = RomanNumeral.fromString(value, scale);
                expect(embellished.name).toBe(value);
                expect(embellished.intervals).not.toBe(romanNumeral.intervals);
                // TODO or something similar
            });
        });

        describe('root', () => {
            test.each([
                [ 'I', CMajor, 'C' ],
                [ 'ii', CMajor, 'D' ],
                [ 'viio', CMajor, 'B' ],
                [ 'V/V', CMinor, 'D' ],
                [ 'i', CMinor, 'C' ],
                [ 'iio', CMinor, 'D' ],
                [ 'VII', CMinor, 'Bb' ],
                [ 'viio6', CMinor, 'B' ], // special case
                [ 'V/V', CMinor, 'D' ],
                [ 'bVI', CMajor, 'Ab' ],
                [ '#iii', CMinor, 'E' ],
            ])('%p', (value, scale, root) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                expect(romanNumeral.root.name).toBe(root);
            });
        });

        describe('relativeToScale', () => {
            test.each([
                [ 'i', CMinor, [ Key.EFlat, Scale.Quality.MAJOR ] as Scale, 'vi' ],
                [ 'iio6', CMinor, [ Key.EFlat, Scale.Quality.MAJOR ] as Scale, 'viio6' ],
                [ 'vi', CMajor, [ Key.G, Scale.Quality.MAJOR ] as Scale, 'ii' ],
                [ 'ii', CMajor, [ Key.F, Scale.Quality.MAJOR ] as Scale, 'vi' ],
                [ 'I', CMajor, [ Key.F, Scale.Quality.MAJOR ] as Scale, 'V' ],
                [ 'i7', CMinor, [ Key.BFlat, Scale.Quality.MAJOR ] as Scale, 'ii7' ],
                [ 'bVI', CMajor, [ Key.BFlat, Scale.Quality.MAJOR ] as Scale, 'bVII' ],
                [ 'bVII', CMajor, [ Key.BFlat, Scale.Quality.MAJOR ] as Scale, 'I' ],
                [ '#III', CMinor, [ Key.E, Scale.Quality.MAJOR ] as Scale, 'I' ],
            ])('%s %p %p %s', (value, scale, newScale: Scale, expected) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                const relative = romanNumeral.relativeToScale(newScale);
                expect(relative).not.toBe(null);
                if(relative === null) {
                    return;
                }
                expect(relative.name).toBe(expected);
                const back = relative.relativeToScale(scale);
                expect(back).not.toBe(null);
                if(back === null) {
                    return;
                }
                expect(back.name).toBe(value);
            });
        });

        describe('diatonicized', () => {
            test.each([
                [ 'I', CMajor, 'I' ],
                [ 'i', CMajor, 'I' ],
                [ 'I', CMinor, 'i' ],
                [ 'ii6', CMinor, 'iio6' ],
                [ 'ii7', CMinor, 'ii07' ],
                [ 'vi', CMinor, 'VI' ],
                [ 'viio', CMinor, 'VII' ],
                [ 'bIII', CMajor, 'iii' ],
            ])('%s %p %p %s', (value, scale, expected) => {
                const romanNumeral = RomanNumeral.fromString(value, scale);
                const relative = romanNumeral.diatonicized();
                expect(relative).not.toBe(null);
                if(relative === null) {
                    return;
                }
                expect(relative.name).toBe(expected);
            });
        });
    });

    describe('with', () => {
        test.each([
            [ 'I', CMajor ],
            [ 'ii', CMajor ],
            [ 'viio', CMajor ],
            [ 'V/V', CMinor ],
            [ 'i', CMinor ],
            [ 'iio', CMinor ],
            [ 'VII', CMinor ],
            [ 'viio6', CMinor ],
            [ 'V/V', CMinor ],
            [ 'bVI', CMajor ],
            [ '#iii', CMinor ],
        ])('%p', (value, scale) => {
            const romanNumeral = RomanNumeral.fromString(value, scale);
            expect(romanNumeral.name).toBe(value);
            const withRomanNumeral = romanNumeral.with({});
            expect(withRomanNumeral.name).toBe(value);
        });
    });
});
