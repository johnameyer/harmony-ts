import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { HarmonicFunction } from "./harmonic-function";

export type ProgressionPredicate = (scale: Scale, previousChords: HarmonizedChord[]) => boolean;
export type ProgressionProducer = (scale: Scale, previousChords: HarmonizedChord[]) => IncompleteChord[][];

const withChordSymbol = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbol == previousChords[0].romanNumeral.name;
//TODO play around with this
const withInversionsOf = (chordSymbol: string, ...inversions: number[]) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbol === previousChords[0].romanNumeral.symbol && inversions.some(inversion => inversion === previousChords[0].romanNumeral.inversion);

const yieldChord = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => [[new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) })]];
const yieldChords = (...chordSymbols: string[]) => (scale: Scale, previousChords: HarmonizedChord[]) => [chordSymbols.map(chordSymbol => new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) }))];

const yieldChordsWithFunction = (harmonicFunction: HarmonicFunction, ...chordSymbols: string[]) => (scale: Scale, previousChords: HarmonizedChord[]) => [chordSymbols.map(chordSymbol => new IncompleteChord({ harmonicFunction, romanNumeral: new RomanNumeral(chordSymbol, scale) }))];

// TODO move away from IncompleteChord model?

export namespace Progression {
    export namespace Major {
        export const identity = [
            [() => true, (scale: Scale, previousChords: HarmonizedChord[]) => [[new IncompleteChord({romanNumeral: new RomanNumeral(previousChords[0].romanNumeral.name, scale)})]]]
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const basic = [
            /* I-V */
            [ withChordSymbol('I'), yieldChord('V') ],
            [ withChordSymbol('V'), yieldChord('I') ],

            /* I-V7 */
            [ withChordSymbol('I'),  yieldChord('V7') ],
            [ withChordSymbol('V7'), yieldChord('I') ],

            /* V-V7 intensification */
            [ withChordSymbol('V'),  yieldChord('V7') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const basicInversions = [
            /* I-I6 arpeggiation */
            [ withChordSymbol('I'),  yieldChord('I6') ],
            [ withChordSymbol('I6'), yieldChord('I') ],

            [ withChordSymbol('I6'), yieldChord('V') ],

            /* V6 */
            [ withChordSymbol('I'),  yieldChord('V6') ],
            [ withChordSymbol('V6'), yieldChord('I') ],

            [ withChordSymbol('V'),  yieldChord('V6') ],
            [ withChordSymbol('V6'), yieldChord('V') ],

            /* viio */
            // [ withChordSymbol('I'),  yieldChordsWithFunction(HarmonicFunction.TONIC, 'viio6', 'I6') ],
            // [ withChordSymbol('I6'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'viio6', 'I') ]
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const dominantSevenths = [
            /* V65 */
            [ withInversionsOf('I', 0, 1), yieldChord('V65') ],

            [ withChordSymbol('V65'), yieldChord('I') ],

            /* V43 */
            [ withInversionsOf('I', 0, 1),  yieldChord('V43') ],

            [ withChordSymbol('V43'), yieldChord('I') ],
            [ withChordSymbol('V43'), yieldChord('I6') ],

            /* V42 */
            [ withInversionsOf('I', 0, 1),  yieldChord('V42') ],

            [ withChordSymbol('V42'), yieldChord('I6') ],
            
            /* V6-V65 intensification */
            [ withChordSymbol('V6'), yieldChord('V65') ],

            /* passing figures */
            [ withChordSymbol('V'), yieldChord('V42') ],

            // /* double neighbor */
            // [ withChordSymbol('I'), yieldChordsWithFunction(HarmonicFunction.TONIC,'V65', 'V43', 'I') ],
            // [ withChordSymbol('I'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'V43', 'V65', 'I') ],

            // [ withChordSymbol('I6'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'V43', 'V42', 'I6') ],
            // [ withChordSymbol('I6'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'V42', 'V43', 'I6') ],

        ] as [ProgressionPredicate, ProgressionProducer][];

        export const basicPredominant = [
            /* IV */
            [ withInversionsOf('I', 0, 1),  yieldChord('IV') ],

            [ withInversionsOf('IV', 0), yieldChord('V') ],
            [ withInversionsOf('IV', 0), yieldChord('V7') ],

            /* ii */
            [ withInversionsOf('I', 0, 1),  yieldChord('ii') ],

            [ withInversionsOf('ii', 0), yieldChord('V') ],
            [ withInversionsOf('ii', 0), yieldChord('V6') ],
            [ withInversionsOf('ii', 0), yieldChord('V7') ],
            //viio6? V42?

            /* ii6 */
            [ withInversionsOf('I', 0, 1),  yieldChord('ii6') ],

            [ withChordSymbol('ii6'), yieldChord('V') ],
            [ withChordSymbol('ii6'), yieldChord('V7') ],

            /* ii-ii6 arpeggiation */
            [ withChordSymbol('ii'),  yieldChord('ii6') ],
            [ withChordSymbol('ii6'), yieldChord('ii') ],

            // /* ii-ii6 with passing */
            // [ withChordSymbol('ii'),  yieldChordsWithFunction(HarmonicFunction.PREDOMINANT, 'I6', 'ii6') ],
            // [ withChordSymbol('ii6'), yieldChordsWithFunction(HarmonicFunction.PREDOMINANT, 'I6', 'ii') ],

            /* IV-ii root motion by 3rd */
            // [ withChordSymbol('IV'), yieldChord('ii6') ],
            [ withChordSymbol('IV'), yieldChord('ii') ]
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const submediant = [
            [ withChordSymbol('I'), yieldChord('vi') ],
            [ withChordSymbol('I'), yieldChord('IV6') ],

            /* vi root motion by 3rd */
            [ withChordSymbol('vi'), yieldChord('IV') ],
            [ withChordSymbol('vi'), yieldChord('IV6') ],

            /* IV6 root motion by 3rd */
            [ withChordSymbol('IV6'), yieldChord('ii6') ],
            
            /* vi root motion by 5th */
            [ withChordSymbol('vi'), yieldChord('ii') ],
            [ withChordSymbol('vi'), yieldChord('ii6') ],

            /* vi-V */
            [ withChordSymbol('vi'), yieldChord('V') ],
            [ withChordSymbol('IV6'), yieldChord('V') ],
            
            // [ withChordSymbol('vi'), yieldChord('V6') ],
            // [ withChordSymbol('vi'), yieldChord('V65') ],
            // [ withChordSymbol('IV6'), yieldChord('V6') ],
            // [ withChordSymbol('IV6'), yieldChord('V65') ],
            
            [ withChordSymbol('V'), yieldChords('IV6', 'V6', 'I') ],
            [ withChordSymbol('V'), yieldChords('IV6', 'V65', 'I') ],
            // 12-5?
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const subdominantSevenths = [
            [ withInversionsOf('I', 0, 1), yieldChord('ii7') ],
            [ withInversionsOf('IV', 0, 1), yieldChord('ii7') ],
            [ withChordSymbol('vi'), yieldChord('ii7') ],

            [ withInversionsOf('I', 0, 1), yieldChord('ii65') ],
            
            [ withChordSymbol('I'), yieldChord('ii42') ],

            [ withChordSymbol('ii7'), yieldChord('V') ],
            [ withChordSymbol('ii65'), yieldChord('V') ],
            [ withChordSymbol('ii7'), yieldChord('V7') ],
            [ withChordSymbol('ii65'), yieldChord('V7') ],

            [ withChordSymbol('IV6'), yieldChord('ii65') ],
            [ withChordSymbol('IV'), yieldChord('ii7') ],
            [ withChordSymbol('ii65'), yieldChord('ii7') ],
            [ withChordSymbol('ii65'), yieldChordsWithFunction(HarmonicFunction.PREDOMINANT, 'I6', 'ii7') ],
            [ withChordSymbol('ii'), yieldChordsWithFunction(HarmonicFunction.PREDOMINANT, 'I6', 'ii65') ],
            [ withChordSymbol('ii65'), yieldChord('V42') ],
            
            [ withChordSymbol('vi'), yieldChords('ii7') ],
            [ withChordSymbol('vi'), yieldChords('ii65') ],
            
            [ withChordSymbol('ii6'), yieldChords('ii7') ],

            [ withChordSymbol('ii42'), yieldChords('V6') ],
            [ withChordSymbol('ii42'), yieldChords('V65') ],
            
            [ withChordSymbol('I'), yieldChords('IV7') ],
            [ withChordSymbol('I6'), yieldChord('IV7') ],
            [ withChordSymbol('IV'), yieldChords('IV7') ],
            [ withChordSymbol('IV7'), yieldChords('V') ],

            [ withChordSymbol('V'), yieldChords('IV65', 'V6', 'I') ],
            [ withChordSymbol('V'), yieldChords('IV65', 'V65', 'I') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const tonicSubstitutes = [
            // [ withChordSymbol('I'), yieldChords('IV', 'I') ],
            // [ withChordSymbol('I6'), yieldChords('IV', 'I') ],
            // [ withChordSymbol('I'), yieldChords('IV', 'I6') ],

            // [ withChordSymbol('I'), yieldChords('IV6', 'I6') ],
            // [ withChordSymbol('I'), yieldChords('vi', 'I6') ],

            [ withChordSymbol('V'), yieldChord('vi') ],
            [ withChordSymbol('V'), yieldChord('IV6') ],
            [ withChordSymbol('V7'), yieldChord('vi') ],
            [ withChordSymbol('V7'), yieldChord('IV6') ],

            // [ withChordSymbol('V'), yieldChords('vi', 'V6') ],
            // [ withChordSymbol('V'), yieldChords('vi', 'V65') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const secondaryDominant = [
            //TODO expand
            // [ withInversionsOf('I', 0, 1), yieldChord('V/V')],
            // [ withInversionsOf('ii', 0), yieldChord('V/V')],
            // [ withInversionsOf('I', 0, 1), yieldChord('V7/V')],
            // [ withInversionsOf('ii', 0), yieldChord('V7/V')],
            
            // [ withChordSymbol('V/V'), yieldChord('V') ],
            // [ withChordSymbol('V7/V'), yieldChord('V') ],
            // [ withChordSymbol('V/V'), yieldChord('V7') ],
            // [ withChordSymbol('V7/V'), yieldChord('V7') ],
            
            // [ withInversionsOf('I', 1), yieldChord('V6/V')],
            // [ withInversionsOf('ii', 1), yieldChord('V6/V')],
            // [ withInversionsOf('IV', 0), yieldChord('V6/V')],
            // [ withInversionsOf('I', 1), yieldChord('V65/V')],
            // [ withInversionsOf('ii', 1), yieldChord('V65/V')],
            // [ withInversionsOf('IV', 0), yieldChord('V65/V')],

            // [ withChordSymbol('V6/V'), yieldChord('V') ],
            // [ withChordSymbol('V65/V'), yieldChord('V') ],
            // [ withChordSymbol('V6/V'), yieldChord('V7') ],
            // [ withChordSymbol('V65/V'), yieldChord('V7') ],

            // [ withChordSymbol('V43/V'), yieldChord('V') ],
            // [ withChordSymbol('V43/V'), yieldChord('V6') ],

            // [ withChordSymbol('V42/V'), yieldChord('V6') ],
        ] as [ProgressionPredicate, ProgressionProducer][];
    }
}