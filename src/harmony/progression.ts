import { Chord } from "../chord/chord";
import { Key } from "../key";
import { Note } from "../note/note";
import { Interval } from "../interval/interval";
import { IntervalQuality } from "../interval/interval-quality";
import { AbsoluteNote } from "../note/absolute-note";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { Motion } from "./motion";
import { ComplexInterval } from "../interval/complex-interval";

export type Predicate = (key: Key, ...previousChords: HarmonizedChord[]) => boolean;
export type Producer = (key: Key, ...previousChords: HarmonizedChord[]) => IncompleteChord[];

const withChordSymbol = (chordSymbol: string) => (key: Key, chord: HarmonizedChord) => chordSymbol == chord.romanNumeral.name;
const yieldChord = ( chordSymbol: string ) => (key: Key, ...previousChords: HarmonizedChord[]) => [];
const yieldChords = ( ...chordSymbols: string[] ) => (key: Key, previousChords: HarmonizedChord[]) => [];

const absoluteNote = (note: string) => new AbsoluteNote(note);

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
    export namespace Checks {
        const sopranoRange = ['B3', 'C4', 'G5', 'A5'].map(absoluteNote);
        const altoRange = ['G3', 'G3', 'C5', 'D5'].map(absoluteNote);
        const tenorRange = ['G3', 'C3', 'G4', 'A4'].map(absoluteNote);
        const bassRange = ['D2', 'E2', 'C4', 'D4'].map(absoluteNote);

        /**
         * Checks that the chord maintains proper vocal ranges
         * @param chord the chord to check
         */
        export function checkRange(chord: Chord) {
            for (const [range, toCheck] of [
                [sopranoRange, chord.soprano],
                [altoRange, chord.alto],
                [tenorRange, chord.tenor],
                [bassRange, chord.bass],
            ] as [AbsoluteNote[], AbsoluteNote][]) {
                if (toCheck.midi < range[1].midi) {
                    if (toCheck.midi < range[0].midi) {
                        return false;
                    } else {
                        //warning
                        console.log(toCheck, 'low');
                    }
                }
                if (range[2].midi < toCheck.midi) {
                    if (range[3].midi < toCheck.midi) {
                        return false;
                    } else {
                        //warning
                        console.log(toCheck, 'high');
                    }
                }
            }
            return true;
        }

        /**
         * Checks that the chord does not double the leading tone
         * @param chord the chord to check
         */
        function checkLeadingToneDoubling(chord: HarmonizedChord) {
            if (chord.romanNumeral.name.startsWith('V')) {
                if (chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('3')).length > 1) {
                    return false;
                }
            } else if(chord.romanNumeral.name.startsWith('viio')) {
                if (chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('U')).length > 1) {
                    return false;
                }
            }
        }

        /**
         * Checks that the chord does not double the seventh
         * @param chord the chord to check
         */
        function checkSeventhDoubling(chord: Chord) {
            if (chord.seventhQuality) {
                if (chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('7')).length > 1) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Checks that the chord meets the basic doubling requirements
         * @param chord the chord to check
         * @param prev the chord before this chord
         */
        function checkCompleteness(chord: HarmonizedChord, prev: HarmonizedChord) {
            //chord necessarially has root
            if(chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('3')).length == 0) {
                return false;
            }
            if (!chord.seventhQuality) {
                //chord has seventh for this to be present
                if (chord.inversion == 0) {
                    // can leave out fifth
                } else {
                    return chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('5')).length >= 1;
                }
            } else {
                if (chord.inversion == 0) {
                    // can leave out fifth if preceded by complete V7
                    if(!prev.romanNumeral.name.startsWith('V7')) { //TODO and is complete
                        return chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('5')).length >= 1;
                    }
                } else {
                    return chord.notes.map(note => new Interval(chord.root, note)).filter(Interval.ofSize('5')).length >= 1;
                }
            }
        }

        /**
         * Checks that the chord does not have too much space between the voice parts
         * @param chord the chord to check
         */
        function checkSpacing(chord: Chord) {
            if (chord.soprano.midi - chord.alto.midi > 12) {
                return false;
            }
            if (chord.alto.midi - chord.tenor.midi > 12) {
                return false;
            }
            return true;
        }

        /**
         * Checks that the chord has no parallel unisons, fifths, or octaves from the previous
         * @param chord the chord to check
         * @param prev the chord before this chord
         */
        function checkParallels(chord: Chord, prev: Chord) {
            const pairings = [
                [0, 1],
                [0, 2],
                [0, 3],
                [1, 2],
                [1, 3],
                [2, 3],
            ];
            return !pairings
                .map(([upper, lower]) => [prev.notes[upper], prev.notes[lower], chord.notes[upper], chord.notes[lower]])
                .filter(([prevUpper, prevLower, currUpper, currLower]) => prevLower != currLower || prevUpper != currUpper)
                .map(([prevUpper, prevLower, currUpper, currLower]) => [
                    new Interval(prevLower, prevUpper),
                    new Interval(currLower, currUpper),
                ])
                .some(
                    ([prevInterval, currentInterval]) =>
                        prevInterval.simpleSize != '4' && prevInterval.quality == IntervalQuality.PERFECT && prevInterval.name == currentInterval.name,
                );
        }

        /**
         * Checks that the chord has no parallels by contrary motion (e.g. 15th to 8ve)
         * @param chord the chord to check
         * @param prev the chord before this chord
         */
        function checkContraryFifths(chord: Chord, prev: Chord) {
            const pairings = [
                [0, 1],
                [0, 2],
                [0, 3],
                [1, 2],
                [1, 3],
                [2, 3],
            ];
            return !pairings
                .map(([upper, lower]) => [prev.notes[upper], prev.notes[lower], chord.notes[upper], chord.notes[lower]])
                .filter(([prevUpper, prevLower, currUpper, currLower]) => prevLower != currLower || prevUpper != currUpper)
                .map(([prevUpper, prevLower, currUpper, currLower]) => [
                    new Interval(prevLower, prevUpper),
                    new Interval(currLower, currUpper),
                ])
                .some(
                    ([prevInterval, currentInterval]) =>
                        prevInterval.simpleSize != '4' && prevInterval.quality == IntervalQuality.PERFECT && prevInterval.name == currentInterval.name,
                );
        }

        /**
         * Checks whether there are hidden fifths in the soprano and bass
         * Hidden fifths being perfect fifths arrived at through similar motion where the soprano is not moving up by step
         * @param chord the chord to check
         * @param prev the chord before this chord
         */
        function checkHiddenFifths(chord: HarmonizedChord, prev: HarmonizedChord) {
            let interval = new ComplexInterval(chord.bass, chord.soprano);
            if(interval.name == 'P5' && Motion.from(prev.bass, chord.bass, prev.soprano, chord.soprano) == Motion.SIMILAR) {
                if(!prev.romanNumeral.name.startsWith('V') && new Interval(prev.root, prev.soprano).simpleSize != '3' && new Interval(prev.soprano, chord.soprano).name != 'm2') {
                    return false;
                }
            }
            return true;
        }

        /**
         * Checks whether any of the parts cross with where the notes where previously
         * @param chord the chord to check
         * @param prev the chord before this chord
         */
        function checkVoiceCrossingAndOverlap(chord: Chord, prev: Chord) {
            if(chord.soprano < prev.alto || chord.alto < prev.soprano) {
                return false;
            }
            if(chord.alto < prev.tenor || chord.tenor < prev.alto) {
                return false;
            }
            if(chord.tenor < prev.bass || chord.bass < prev.tenor) {
                return false;
            }
            return true;
        }

        /**
         * Checks whether notes in the previous chord resolve correctly
         * @param chord the chord to check
         * @param prev the chord before this chord
         */
        function checkTendencyTones(chord: HarmonizedChord, prev: HarmonizedChord) {
            if (prev.romanNumeral.name.startsWith('V')) {
                let index = prev.notes.map(note => new Interval(chord.root, note)).findIndex(Interval.ofSize('3'));
                if (new Interval(prev.notes[index], chord.notes[index]).simpleSize != '2') {
                    return false;
                }
            } else if(prev.romanNumeral.name.startsWith('viio')) {
                let index = prev.notes.map(note => new Interval(chord.root, note)).findIndex(Interval.ofSize('U'));
                if (new Interval(prev.notes[index], chord.notes[index]).simpleSize != '2') {
                    return false;
                }
            }
        }

        /**
         * Checks if there is a melodic A2
         * @param chord 
         * @param prev 
         */
        function checkInvalidIntervals(chord: Chord, prev: Chord) {
            for(const voice in [0,1,2,3]) {
                const interval = new Interval(prev.notes[voice], chord.notes[voice]);
                if(interval.simpleSize == '2' && interval.quality == IntervalQuality.AUGMENTED) {
                    return false;
                } else if(interval.simpleSize == '7' && interval.quality == IntervalQuality.DIMINISHED) {
                    return false;
                }
            }
        }

        export function checkAll(chordToCheck: HarmonizedChord, prev: HarmonizedChord) {
            //TODO make combined version of previous
            return [
                checkCompleteness,
                checkContraryFifths,
                checkHiddenFifths,
                checkInvalidIntervals,
                checkLeadingToneDoubling,
                checkParallels,
                checkRange,
                checkSeventhDoubling,
                checkSpacing,
                checkTendencyTones,
            ].every(func => func.apply(null, [chordToCheck, prev]));
        }
    }
}