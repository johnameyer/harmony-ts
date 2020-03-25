import { Key } from "../key";
import { Interval } from "../interval/interval";
import { IntervalQuality } from "../interval/interval-quality";
import { AbsoluteNote } from "../note/absolute-note";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { Motion } from "./motion";
import { ComplexInterval } from "../interval/complex-interval";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";

export type Predicate = (scale: Scale, ...previousChords: HarmonizedChord[]) => boolean;
export type Producer = (scale: Scale, ...previousChords: HarmonizedChord[]) => IncompleteChord[];

const withChordSymbol = (chordSymbol: string) => (scale: Scale, chord: HarmonizedChord) => chordSymbol == chord.romanNumeral.name;
const yieldChord = ( chordSymbol: string ) => (scale: Scale, ...previousChords: HarmonizedChord[]) => [new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) })];
const yieldChords = ( ...chordSymbols: string[] ) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbols.map(chordSymbol => new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) }));

export namespace Progression {
    export namespace Major {
        export const basicRoot = [
            [ withChordSymbol('I'), yieldChord('V') ],
            [ withChordSymbol('V'), yieldChord('I') ],

            [ withChordSymbol('I'),  yieldChord('V7') ],
            [ withChordSymbol('V'),  yieldChord('V7') ],
            [ withChordSymbol('V7'), yieldChord('I') ],
        ] as [Predicate, Producer][];

        export const firstInversions = [
            [ withChordSymbol('I'),  yieldChord('I6') ],
            [ withChordSymbol('I6'), yieldChord('I') ],

            [ withChordSymbol('I'),  yieldChord('V6') ],
            [ withChordSymbol('V6'), yieldChord('I') ],

            
            [ withChordSymbol('I'),  yieldChords('vii06', 'I6') ],
            [ withChordSymbol('I6'), yieldChords('vii06', 'I') ]
        ] as [Predicate, Producer][];

        export const fiveInversions = [
            [ withChordSymbol('I'),   yieldChord('V65') ],
            [ withChordSymbol('V65'), yieldChord('I') ],

            [ withChordSymbol('I'), yieldChords('V43', 'I6') ],
            //passing?
            [ withChordSymbol('I6'), yieldChords('V43',  'I') ],

            [ withChordSymbol('V'),  yieldChords('V42', 'I6') ],
            [ withChordSymbol('V7'), yieldChords('V42', 'I6') ],
        ] as [Predicate, Producer][];

        export const predominants = [
            [ withChordSymbol('I'),  yieldChord('IV') ],
            [ withChordSymbol('I6'), yieldChord('IV') ],

            
            [ withChordSymbol('IV'), yieldChord('V') ],
            [ withChordSymbol('IV'), yieldChord('V7') ],

            [ withChordSymbol('I'),  yieldChord('ii') ],
            [ withChordSymbol('ii'), yieldChord('V') ],
            [ withChordSymbol('ii'), yieldChord('V7') ],

            [ withChordSymbol('ii6'), yieldChord('V') ],
            [ withChordSymbol('ii6'), yieldChord('V7') ],

            [ withChordSymbol('ii'),  yieldChord('ii6') ],
            [ withChordSymbol('ii6'), yieldChord('ii') ],

            [ withChordSymbol('ii'),  yieldChords('I6', 'ii6') ],
            [ withChordSymbol('ii6'), yieldChords('I6', 'ii') ],

            [ withChordSymbol('IV'), yieldChord('ii6') ],
            [ withChordSymbol('IV'), yieldChord('ii') ]
        ] as [Predicate, Producer][];
    }
}