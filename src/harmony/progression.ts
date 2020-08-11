import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { returnOrError } from "../util/return-or-error";

export type ProgressionPredicate = (scale: Scale, previousChords: HarmonizedChord[]) => boolean;
export type ProgressionProducer = (scale: Scale, previousChords: HarmonizedChord[]) => HarmonizedChord[];

const withChordSymbol = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => new RomanNumeral(chordSymbol, scale).diatonicized()?.name === previousChords[0].romanNumeral.name;
const withChordSymbolAsIs = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => new RomanNumeral(chordSymbol, scale).name === previousChords[0].romanNumeral.name;

//TODO play around with this
const withInversionsOf = (chordSymbol: string, ...inversions: number[]) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbol.toLowerCase() === previousChords[0].romanNumeral.symbol.toLowerCase() && inversions.some(inversion => inversion === previousChords[0].romanNumeral.inversion);

const yieldChord = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => [new HarmonizedChord({ romanNumeral: returnOrError(new RomanNumeral(chordSymbol, scale).diatonicized()) })];
const yieldChordAsIs = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => [new HarmonizedChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) })];

// TODO move away from IncompleteChord model?

export namespace Progression {
    export namespace Shared {
        export const identity = [
            [() => true, (scale: Scale, previousChords: HarmonizedChord[]) => [new HarmonizedChord({romanNumeral: new RomanNumeral(previousChords[0].romanNumeral.name, scale)})]]
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const basic = [
            /* I-V */
            [ withChordSymbol('I'), yieldChordAsIs('V') ],
            [ withChordSymbolAsIs('V'), yieldChord('I') ],

            /* I-V7 */
            [ withChordSymbol('I'),  yieldChordAsIs('V7') ],
            [ withChordSymbolAsIs('V7'), yieldChord('I') ],

            /* V-V7 intensification */
            [ withChordSymbolAsIs('V'),  yieldChordAsIs('V7') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const basicInversions = [
            /* I-I6 arpeggiation */
            [ withChordSymbol('I'),  yieldChord('I6') ],
            [ withChordSymbol('I6'), yieldChord('I') ],

            [ withChordSymbol('I6'), yieldChordAsIs('V') ],

            /* V6 */
            [ withChordSymbol('I'),  yieldChordAsIs('V6') ],
            [ withChordSymbolAsIs('V6'), yieldChord('I') ],

            [ withChordSymbolAsIs('V'),  yieldChordAsIs('V6') ],
            [ withChordSymbolAsIs('V6'), yieldChordAsIs('V') ],

            // [ withChordSymbolAsIs('viio6'), yieldChord('I') ]
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const dominantSevenths = [
            /* V65 */
            [ withInversionsOf('I', 0, 1), yieldChordAsIs('V65') ],

            [ withChordSymbolAsIs('V65'), yieldChord('I') ],

            /* V43 */
            [ withInversionsOf('I', 0, 1),  yieldChordAsIs('V43') ],

            [ withChordSymbolAsIs('V43'), yieldChord('I') ],
            [ withChordSymbolAsIs('V43'), yieldChord('I6') ],

            /* V42 */
            [ withInversionsOf('I', 0, 1),  yieldChordAsIs('V42') ],

            [ withChordSymbolAsIs('V42'), yieldChord('I6') ],

            [ withChordSymbolAsIs('V'), yieldChordAsIs('V42') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const basicPredominant = [
            /* IV */
            [ withInversionsOf('I', 0, 1),  yieldChord('IV') ],

            [ withInversionsOf('IV', 0), yieldChordAsIs('V') ],
            [ withInversionsOf('IV', 0), yieldChordAsIs('V7') ],

            /* ii */
            [ withInversionsOf('I', 0, 1),  yieldChord('ii') ],

            [ withInversionsOf('ii', 0), yieldChordAsIs('V') ],
            [ withInversionsOf('ii', 0), yieldChordAsIs('V6') ],
            [ withInversionsOf('ii', 0), yieldChordAsIs('V7') ],
            //viio6? V42?

            /* ii6 */
            [ withInversionsOf('I', 0, 1),  yieldChord('ii6') ],

            [ withChordSymbol('ii6'), yieldChordAsIs('V') ],
            [ withChordSymbol('ii6'), yieldChordAsIs('V7') ],

            /* ii-ii6 arpeggiation */
            [ withChordSymbol('ii'),  yieldChord('ii6') ],
            [ withChordSymbol('ii6'), yieldChord('ii') ],

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
            [ withChordSymbol('vi'), yieldChordAsIs('V') ],
            [ withChordSymbol('IV6'), yieldChordAsIs('V') ],
            // 12-5?
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const subdominantSevenths = [
            [ withInversionsOf('I', 0, 1), yieldChord('ii7') ],
            [ withInversionsOf('IV', 0, 1), yieldChord('ii7') ],
            [ withChordSymbol('vi'), yieldChord('ii7') ],

            [ withInversionsOf('I', 0, 1), yieldChord('ii65') ],
            
            [ withChordSymbol('I'), yieldChord('ii42') ],

            [ withChordSymbol('ii7'), yieldChordAsIs('V') ],
            [ withChordSymbol('ii65'), yieldChordAsIs('V') ],
            [ withChordSymbol('ii7'), yieldChordAsIs('V7') ],
            [ withChordSymbol('ii65'), yieldChordAsIs('V7') ],

            [ withChordSymbol('IV6'), yieldChord('ii65') ],
            [ withChordSymbol('IV'), yieldChord('ii7') ],
            [ withChordSymbol('ii65'), yieldChord('ii7') ],
            [ withChordSymbol('ii65'), yieldChordAsIs('V42') ],
            
            [ withChordSymbol('vi'), yieldChord('ii7') ],
            [ withChordSymbol('vi'), yieldChord('ii65') ],
            
            [ withChordSymbol('ii6'), yieldChord('ii7') ],

            [ withChordSymbol('ii42'), yieldChordAsIs('V6') ],
            [ withChordSymbol('ii42'), yieldChordAsIs('V65') ],
            
            [ withChordSymbol('I'), yieldChord('IV7') ],
            [ withChordSymbol('I6'), yieldChord('IV7') ],
            [ withChordSymbol('IV'), yieldChord('IV7') ],
            [ withChordSymbol('IV7'), yieldChordAsIs('V') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const tonicSubstitutes = [
            [ withChordSymbolAsIs('V'), yieldChord('vi') ],
            [ withChordSymbolAsIs('V'), yieldChord('IV6') ],
            [ withChordSymbolAsIs('V7'), yieldChord('vi') ],
            [ withChordSymbolAsIs('V7'), yieldChord('IV6') ],
        ] as [ProgressionPredicate, ProgressionProducer][];

        export const mediant = [
            [ withChordSymbol('I'), yieldChord('iii') ],
            [ withChordSymbol('iii'), yieldChord('V') ],
            [ withChordSymbol('iii'), yieldChord('V6') ],
            [ withChordSymbol('iii'), yieldChord('V43') ],
            [ withChordSymbol('iii'), yieldChord('V42') ],
            [ withChordSymbol('iii'), yieldChord('vi') ],
            [ withChordSymbol('iii'), yieldChord('IV') ],
            [ withChordSymbol('iii'), yieldChord('IV6') ],
            [ withChordSymbol('iii'), yieldChord('ii') ],
            [ withChordSymbol('iii'), yieldChord('ii6') ],

            [ withChordSymbol('i'), yieldChordAsIs('VII') ],
            [ withChordSymbol('i'), yieldChordAsIs('VII6') ],
            [ withChordSymbolAsIs('VII'), yieldChordAsIs('III') ],
            [ withChordSymbolAsIs('VII6'), yieldChordAsIs('III') ],

            [ withChordSymbolAsIs('VII'), yieldChordAsIs('V') ],
            [ withChordSymbolAsIs('VII'), yieldChordAsIs('V7') ],
            [ withChordSymbolAsIs('VII'), yieldChordAsIs('V6') ],
            [ withChordSymbolAsIs('VII'), yieldChordAsIs('V65') ],
        ] as [ProgressionPredicate, ProgressionProducer][];
    }

    export const defaultProgressions = [...Progression.Shared.identity, ...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths, ...Progression.Shared.basicPredominant, ...Progression.Shared.subdominantSevenths, ...Progression.Shared.submediant, ...Progression.Shared.tonicSubstitutes, ...Progression.Shared.mediant] as [ProgressionPredicate, ProgressionProducer][];
    
    export function * matchingProgressions(scale: Scale, previous: HarmonizedChord[], progressions: [ProgressionPredicate, ProgressionProducer][] = defaultProgressions): Generator<HarmonizedChord[]> {
        for(const [predicate, producer] of progressions) {
            if(predicate(scale, previous)) {
                yield producer(scale, previous);
            }
        }
    }
}