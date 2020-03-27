import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";

export type Predicate = (scale: Scale, ...previousChords: HarmonizedChord[]) => boolean;
export type Producer = (scale: Scale, ...previousChords: HarmonizedChord[]) => IncompleteChord[];

const withChordSymbol = (chordSymbol: string) => (scale: Scale, chord: HarmonizedChord) => chordSymbol == chord.romanNumeral.name;
const yieldChord = ( chordSymbol: string ) => (scale: Scale, ...previousChords: HarmonizedChord[]) => [new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) })];
const yieldChords = ( ...chordSymbols: string[] ) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbols.map(chordSymbol => new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) }));

//TODO flags instead of grouping
export namespace Progression {
    export namespace Major {
        export const basicRoot = [
            /* I-V */
            [ withChordSymbol('I'), yieldChord('V') ],
            [ withChordSymbol('V'), yieldChord('I') ],

            /* I-V7 */
            [ withChordSymbol('I'),  yieldChord('V7') ],
            [ withChordSymbol('V7'), yieldChord('I') ],

            /* V-V7 intensification */
            [ withChordSymbol('V'),  yieldChord('V7') ],
        ] as [Predicate, Producer][];

        export const firstInversions = [
            /* I-I6 arpeggiation */
            [ withChordSymbol('I'),  yieldChord('I6') ],
            [ withChordSymbol('I6'), yieldChord('I') ],

            /* V6 */
            [ withChordSymbol('I'),  yieldChord('V6') ],
            [ withChordSymbol('V6'), yieldChord('I') ],

            /* viio */
            [ withChordSymbol('I'),  yieldChords('vii06', 'I6') ],
            [ withChordSymbol('I6'), yieldChords('vii06', 'I') ]
        ] as [Predicate, Producer][];

        export const fiveInversions = [
            /* V65 */
            [ withChordSymbol('I'),   yieldChord('V65') ],

            [ withChordSymbol('V65'), yieldChord('I') ],

            /* V43 */
            [ withChordSymbol('I'), yieldChord('V43') ],
            [ withChordSymbol('I6'), yieldChord('V43') ],

            [ withChordSymbol('V43'), yieldChord('I') ],
            [ withChordSymbol('V43'), yieldChord('I6') ],

            /* V42 */
            [ withChordSymbol('I'), yieldChord('V42') ],
            [ withChordSymbol('I6'), yieldChord('V42') ],

            [ withChordSymbol('V42'), yieldChord('I6') ],
            
            /* V6-V65 intensification */
            [ withChordSymbol('V6'),  yieldChord('V65') ],

            /* passing figures */
            [ withChordSymbol('V'),  yieldChord('V42') ],
            [ withChordSymbol('V7'), yieldChord('V42') ],

            /* double neighbor */
            [ withChordSymbol('I'),  yieldChords('V65', 'V43', 'I') ],
            [ withChordSymbol('I'), yieldChords('V43', 'V65', 'I') ],

            [ withChordSymbol('I6'),  yieldChords('V43', 'V42', 'I6') ],
            [ withChordSymbol('I6'), yieldChords('V42', 'V43', 'I6') ],

        ] as [Predicate, Producer][];

        export const predominants = [
            /* IV */
            [ withChordSymbol('I'),  yieldChord('IV') ],
            [ withChordSymbol('I6'), yieldChord('IV') ],

            [ withChordSymbol('IV'), yieldChord('V') ],
            [ withChordSymbol('IV'), yieldChord('V7') ],

            /* ii */
            [ withChordSymbol('I'),  yieldChord('ii') ],
            [ withChordSymbol('I6'),  yieldChord('ii') ],

            [ withChordSymbol('ii'), yieldChord('V') ],
            [ withChordSymbol('ii'), yieldChord('V7') ],

            /* ii6 */
            [ withChordSymbol('ii6'), yieldChord('V') ],
            [ withChordSymbol('ii6'), yieldChord('V7') ],

            /* ii-ii6 arpeggiation */
            [ withChordSymbol('ii'),  yieldChord('ii6') ],
            [ withChordSymbol('ii6'), yieldChord('ii') ],

            /* ii-ii6 with passing */
            [ withChordSymbol('ii'),  yieldChords('I6', 'ii6') ],
            [ withChordSymbol('ii6'), yieldChords('I6', 'ii') ],

            /* IV-ii root motion by 3rd */
            [ withChordSymbol('IV'), yieldChord('ii6') ],
            [ withChordSymbol('IV'), yieldChord('ii') ]
        ] as [Predicate, Producer][];

        export const submediant = [
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
            
            [ withChordSymbol('vi'), yieldChord('V6') ],
            [ withChordSymbol('vi'), yieldChord('V65') ],
            [ withChordSymbol('IV6'), yieldChord('V6') ],
            [ withChordSymbol('IV6'), yieldChord('V65') ],
            // 12-5?
        ] as [Predicate, Producer][];

    }
}