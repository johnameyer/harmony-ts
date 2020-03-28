import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { HarmonicFunction } from "./harmonic-function";
import { Interval } from "../interval/interval";
import { AbsoluteNote } from "../note/absolute-note";

const findAll = <T>(arr: T[], filter: ((item: T) => boolean)) => arr.reduce<number[]>(function(arr, e, i) { if (filter(e)) arr.push(i); return arr; }, []);
const setAndReturn = <T>(arr: T[], i: number, t: T) => { arr[i] = t; return arr; }

export type Predicate = (scale: Scale, previousChords: HarmonizedChord[]) => boolean;
export type Producer = (scale: Scale, previousChords: HarmonizedChord[]) => IncompleteChord[][];

const withChordSymbol = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbol == previousChords[0].romanNumeral.name;
const ofFunction = (harmonicFunction: HarmonicFunction) => (scale: Scale, previousChords: HarmonizedChord[]) => harmonicFunction == previousChords[0].romanNumeral.harmonicFunction;
const ofFunctions = (...harmonicFunctions: HarmonicFunction[]) => (scale: Scale, previousChords: HarmonizedChord[]) => harmonicFunctions.some(harmonicFunction => harmonicFunction == previousChords[0].romanNumeral.harmonicFunction);

const yieldChord = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => [[new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) })]];
const yieldChords = (...chordSymbols: string[]) => (scale: Scale, previousChords: HarmonizedChord[]) => [chordSymbols.map(chordSymbol => new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) }))];

const cadential64Resolution = (cad64: string, resolution: string) => (scale: Scale, previousChords: HarmonizedChord[]) => {
    const cad64RomanNumeral = new RomanNumeral(cad64, scale);
    const resolutionRomanNumeral = new RomanNumeral(cad64, scale);
    const potentialFourths = findAll(previousChords[0].voices, (note => ['U','2'].some(size => new Interval(cad64RomanNumeral.root, note).simpleSize == size)));
    return potentialFourths.map(fourthVoice => {
        const fourthInterval = cad64RomanNumeral.intervals.find(Interval.ofSize('U'));
        const thirdInterval = resolutionRomanNumeral.intervals.find(Interval.ofSize('3'));
        if(!fourthInterval || !thirdInterval) {
            throw 'This doesn\'t look like a cadential 64';
        }
        const fourth = AbsoluteNote.getClosest(fourthInterval.transposeUp(cad64RomanNumeral.root), previousChords[0].voices[fourthVoice]);
        const third = AbsoluteNote.getClosest(thirdInterval.transposeUp(cad64RomanNumeral.root), fourth);
        return [
            new IncompleteChord({ voices: setAndReturn([], fourthVoice, fourth), romanNumeral: new RomanNumeral(cad64, scale) }),
            new IncompleteChord({ voices: setAndReturn([], fourthVoice, third), romanNumeral: new RomanNumeral(resolution, scale) })
        ];
    });
}

//TODO flags instead of grouping
export namespace Progression {
    export namespace Major {
        export const basicRoot = [
            /* I-V */
            [ withChordSymbol('I'), yieldChord('V') ],
            [ withChordSymbol('V'), yieldChord('I') ],

            /* I-V7 */
            // [ withChordSymbol('I'),  yieldChord('V7') ],
            // [ withChordSymbol('V7'), yieldChord('I') ],

            /* V-V7 intensification */
            // [ withChordSymbol('V'),  yieldChord('V7') ],
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
            [ withChordSymbol('I'), yieldChord('V65') ],

            [ withChordSymbol('V65'), yieldChord('I') ],

            /* V43 */
            [ withChordSymbol('I'),  yieldChord('V43') ],
            [ withChordSymbol('I6'), yieldChord('V43') ],

            [ withChordSymbol('V43'), yieldChord('I') ],
            [ withChordSymbol('V43'), yieldChord('I6') ],

            /* V42 */
            [ withChordSymbol('I'),  yieldChord('V42') ],
            [ withChordSymbol('I6'), yieldChord('V42') ],

            [ withChordSymbol('V42'), yieldChord('I6') ],
            
            /* V6-V65 intensification */
            [ withChordSymbol('V6'), yieldChord('V65') ],

            /* passing figures */
            [ withChordSymbol('V'),  yieldChord('V42') ],
            [ withChordSymbol('V7'), yieldChord('V42') ],

            /* double neighbor */
            [ withChordSymbol('I'), yieldChords('V65', 'V43', 'I') ],
            [ withChordSymbol('I'), yieldChords('V43', 'V65', 'I') ],

            [ withChordSymbol('I6'), yieldChords('V43', 'V42', 'I6') ],
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

        export const cad64 = [
            [ ofFunctions(HarmonicFunction.TONIC, HarmonicFunction.PREDOMINANT), cadential64Resolution('I64', 'V') ],
            [ ofFunctions(HarmonicFunction.TONIC, HarmonicFunction.PREDOMINANT), cadential64Resolution('I64', 'V7') ],
            [ ofFunctions(HarmonicFunction.TONIC, HarmonicFunction.PREDOMINANT), cadential64Resolution('I64', 'V42') ],
        ] as [Predicate, Producer][];
    }
}