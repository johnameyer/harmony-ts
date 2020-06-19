import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { HarmonicFunction } from "./harmonic-function";
import { Interval } from "../interval/interval";
import { AbsoluteNote } from "../note/absolute-note";
import { isDefined } from "../util";

const findAll = <T>(arr: T[], filter: ((item: T) => boolean)) => arr.reduce<number[]>(function(arr, e, i) { if (filter(e)) arr.push(i); return arr; }, []);
const setAndReturn = <T>(arr: T[], i: number, t: T) => { arr[i] = t; return arr; }

export type Predicate = (scale: Scale, previousChords: HarmonizedChord[]) => boolean;
export type Producer = (scale: Scale, previousChords: HarmonizedChord[]) => IncompleteChord[][];

const withChordSymbol = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbol == previousChords[0].romanNumeral.name;
const ofFunction = (harmonicFunction: HarmonicFunction) => (scale: Scale, previousChords: HarmonizedChord[]) => harmonicFunction == previousChords[0].harmonicFunction;
const ofFunctions = (...harmonicFunctions: HarmonicFunction[]) => (scale: Scale, previousChords: HarmonizedChord[]) => harmonicFunctions.some(harmonicFunction => harmonicFunction == previousChords[0].harmonicFunction);
//TODO play around with this
const withInversionsOf = (chordSymbol: string, ...inversions: number[]) => (scale: Scale, previousChords: HarmonizedChord[]) => chordSymbol === previousChords[0].romanNumeral.symbol && inversions.some(inversion => inversion === previousChords[0].romanNumeral.inversion);

const yieldChord = (chordSymbol: string) => (scale: Scale, previousChords: HarmonizedChord[]) => [[new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) })]];
const yieldChords = (...chordSymbols: string[]) => (scale: Scale, previousChords: HarmonizedChord[]) => [chordSymbols.map(chordSymbol => new IncompleteChord({ romanNumeral: new RomanNumeral(chordSymbol, scale) }))];

const yieldChordsWithFunction = (harmonicFunction: HarmonicFunction, ...chordSymbols: string[]) => (scale: Scale, previousChords: HarmonizedChord[]) => [chordSymbols.map(chordSymbol => new IncompleteChord({ harmonicFunction, romanNumeral: new RomanNumeral(chordSymbol, scale) }))];

const cadential64Preparation = (cad64: string) => (scale: Scale, previousChords: HarmonizedChord[]) => {
    const cad64RomanNumeral = new RomanNumeral(cad64, scale);
    const potentialFourths = findAll(previousChords[0].voices.slice(0, previousChords[0].voices.length - 1), (note => ['U','2'].some(size => new Interval(cad64RomanNumeral.root, note).simpleSize == size)));
    return potentialFourths.map(fourthVoice => {
        const fourthInterval = cad64RomanNumeral.intervals.find(Interval.ofSize('U'));
        if(!fourthInterval) {
            throw 'This doesn\'t look like a cadential 64';
        }
        const fourth = AbsoluteNote.getClosest(fourthInterval.transposeUp(cad64RomanNumeral.root), previousChords[0].voices[fourthVoice]);
        return [new IncompleteChord({ voices: setAndReturn([], fourthVoice, fourth), romanNumeral: cad64RomanNumeral })];
    });
}

// TODO consider moving into part-writing
const cadential64Resolution = (resolution: string) => (scale: Scale, previousChords: HarmonizedChord[]) => {
    const cad64RomanNumeral = previousChords[0].romanNumeral;
    const resolutionRomanNumeral = new RomanNumeral(resolution, scale);
    const sixthVoices = findAll(previousChords[0].voices.slice(0, previousChords[0].voices.length - 1), note => new Interval(cad64RomanNumeral.root, note).simpleSize == '3');
    const sixthVoiceResolvesTo = resolutionRomanNumeral.intervals.find(Interval.ofSize('5'))?.transposeUp(resolutionRomanNumeral.root);
    const fourthVoice = previousChords[0].voices.findIndex(note => new Interval(cad64RomanNumeral.root, note).simpleSize == 'U');
    const fourthVoiceResolvesTo = resolutionRomanNumeral.intervals.find(Interval.ofSize('3'))?.transposeUp(resolutionRomanNumeral.root);
    if(!fourthVoiceResolvesTo || !sixthVoiceResolvesTo) return [];
    const fourthResolution = AbsoluteNote.getClosest(fourthVoiceResolvesTo, previousChords[0].voices[fourthVoice]);
    const voicesWithFourth: (AbsoluteNote | undefined)[] = [];
    voicesWithFourth[fourthVoice] = fourthResolution;
    return sixthVoices.map((sixthVoice) => {
        const sixthResolution = AbsoluteNote.getClosest(sixthVoiceResolvesTo, previousChords[0].voices[fourthVoice]);
        const voices = [...voicesWithFourth];
        voices[sixthVoice] = sixthResolution;
        return [new IncompleteChord({ voices, romanNumeral: resolutionRomanNumeral })];
    }).filter(isDefined);
}

//TODO flags instead of grouping
export namespace Progression {
    export namespace Major {
        export const basic = [
            /* I-V */
            [ withChordSymbol('I'), yieldChord('V') ],
            [ withChordSymbol('V'), yieldChord('I') ],

            /* I-V7 */
            [ withChordSymbol('I'),  yieldChord('V7') ],
            [ withChordSymbol('V7'), yieldChord('I') ],

            /* V-V7 intensification */
            [ withChordSymbol('V'),  yieldChord('V7') ],
        ] as [Predicate, Producer][];

        export const basicInversions = [
            /* I-I6 arpeggiation */
            [ withChordSymbol('I'),  yieldChord('I6') ],
            [ withChordSymbol('I6'), yieldChord('I') ],

            [ withChordSymbol('I6'), yieldChord('V') ],

            /* V6 */
            [ withChordSymbol('I'),  yieldChord('V6') ],
            [ withChordSymbol('V6'), yieldChord('I') ],

            /* viio */
            [ withChordSymbol('I'),  yieldChordsWithFunction(HarmonicFunction.TONIC, 'viio6', 'I6') ],
            [ withChordSymbol('I6'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'viio6', 'I') ]
        ] as [Predicate, Producer][];

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

            /* double neighbor */
            [ withChordSymbol('I'), yieldChordsWithFunction(HarmonicFunction.TONIC,'V65', 'V43', 'I') ],
            [ withChordSymbol('I'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'V43', 'V65', 'I') ],

            [ withChordSymbol('I6'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'V43', 'V42', 'I6') ],
            [ withChordSymbol('I6'), yieldChordsWithFunction(HarmonicFunction.TONIC, 'V42', 'V43', 'I6') ],

        ] as [Predicate, Producer][];

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

            /* ii6 */
            [ withInversionsOf('I', 0, 1),  yieldChord('ii6') ],

            [ withChordSymbol('ii6'), yieldChord('V') ],
            [ withChordSymbol('ii6'), yieldChord('V7') ],

            /* ii-ii6 arpeggiation */
            [ withChordSymbol('ii'),  yieldChord('ii6') ],
            [ withChordSymbol('ii6'), yieldChord('ii') ],

            /* ii-ii6 with passing */
            [ withChordSymbol('ii'),  yieldChordsWithFunction(HarmonicFunction.PREDOMINANT, 'I6', 'ii6') ],
            [ withChordSymbol('ii6'), yieldChordsWithFunction(HarmonicFunction.PREDOMINANT, 'I6', 'ii') ],

            /* IV-ii root motion by 3rd */
            [ withChordSymbol('IV'), yieldChord('ii6') ],
            [ withChordSymbol('IV'), yieldChord('ii') ]
        ] as [Predicate, Producer][];
        
        export const cad64 = [
            [ ofFunctions(HarmonicFunction.TONIC, HarmonicFunction.PREDOMINANT), cadential64Preparation('I64') ],
            [ withChordSymbol('I64'), cadential64Resolution('V')],
            [ withChordSymbol('I64'), cadential64Resolution('V7')],
            [ withChordSymbol('I64'), cadential64Resolution('V42')]
        ] as [Predicate, Producer][];

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
            
            [ withChordSymbol('vi'), yieldChord('V6') ],
            [ withChordSymbol('vi'), yieldChord('V65') ],
            [ withChordSymbol('IV6'), yieldChord('V6') ],
            [ withChordSymbol('IV6'), yieldChord('V65') ],
            
            [ withChordSymbol('V'), yieldChords('IV6', 'V6', 'I') ],
            [ withChordSymbol('V'), yieldChords('IV6', 'V65', 'I') ],
            // 12-5?
        ] as [Predicate, Producer][];

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
        ] as [Predicate, Producer][];

        export const tonicSubstitutes = [
            [ withChordSymbol('I'), yieldChords('IV', 'I') ],
            [ withChordSymbol('I6'), yieldChords('IV', 'I') ],
            [ withChordSymbol('I'), yieldChords('IV', 'I6') ],

            [ withChordSymbol('I'), yieldChords('IV6', 'I6') ],
            [ withChordSymbol('I'), yieldChords('vi', 'I6') ],

            [ withChordSymbol('V'), yieldChord('vi') ],
            [ withChordSymbol('V'), yieldChord('IV6') ],
            [ withChordSymbol('V7'), yieldChord('vi') ],
            [ withChordSymbol('V7'), yieldChord('IV6') ],

            [ withChordSymbol('V'), yieldChords('vi', 'V6') ],
            [ withChordSymbol('V'), yieldChords('vi', 'V65') ],
        ] as [Predicate, Producer][];

        export const secondaryDominant = [
            //TODO expand
            [ withInversionsOf('I', 0, 1), yieldChord('V/V')],
            [ withInversionsOf('ii', 0), yieldChord('V/V')],
            [ withInversionsOf('I', 0, 1), yieldChord('V7/V')],
            [ withInversionsOf('ii', 0), yieldChord('V7/V')],
            
            [ withChordSymbol('V/V'), yieldChord('V') ],
            [ withChordSymbol('V7/V'), yieldChord('V') ],
            [ withChordSymbol('V/V'), yieldChord('V7') ],
            [ withChordSymbol('V7/V'), yieldChord('V7') ],
            
            [ withInversionsOf('I', 1), yieldChord('V6/V')],
            [ withInversionsOf('ii', 1), yieldChord('V6/V')],
            [ withInversionsOf('IV', 0), yieldChord('V6/V')],
            [ withInversionsOf('I', 1), yieldChord('V65/V')],
            [ withInversionsOf('ii', 1), yieldChord('V65/V')],
            [ withInversionsOf('IV', 0), yieldChord('V65/V')],

            [ withChordSymbol('V6/V'), yieldChord('V') ],
            [ withChordSymbol('V65/V'), yieldChord('V') ],
            [ withChordSymbol('V6/V'), yieldChord('V7') ],
            [ withChordSymbol('V65/V'), yieldChord('V7') ],

            [ withChordSymbol('V43/V'), yieldChord('V') ],
            [ withChordSymbol('V43/V'), yieldChord('V6') ],

            [ withChordSymbol('V42/V'), yieldChord('V6') ],
        ] as [Predicate, Producer][];
    }
}