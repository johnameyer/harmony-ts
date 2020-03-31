import { HarmonizedChord } from "../chord/harmonized-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Interval } from "../interval/interval";
import { IntervalQuality } from "../interval/interval-quality";
import { ComplexInterval } from "../interval/complex-interval";
import { Motion } from "./motion";
import { Scale } from "..";

const absoluteNote = (note: string) => new AbsoluteNote(note);

export namespace PartWriting {
    const sopranoRange = ['B3', 'C4', 'G5', 'A5'].map(absoluteNote);
    const altoRange = ['G3', 'G3', 'C5', 'D5'].map(absoluteNote);
    const tenorRange = ['G3', 'C3', 'G4', 'A4'].map(absoluteNote);
    const bassRange = ['D2', 'E2', 'C4', 'D4'].map(absoluteNote);

    export const voiceRange = [sopranoRange, altoRange, tenorRange, bassRange];

    /**
     * Checks that the chord maintains proper vocal ranges
     * @param chord the chord to check
     */
    export function checkRange(chord: HarmonizedChord) {
        for (const [range, toCheck] of [
            [sopranoRange, chord.voices[0]],
            [altoRange, chord.voices[1]],
            [tenorRange, chord.voices[2]],
            [bassRange, chord.voices[3]],
        ] as [AbsoluteNote[], AbsoluteNote][]) {
            if (toCheck.midi < range[1].midi) {
                if (toCheck.midi < range[0].midi) {
                    return false;
                } else {
                    //warning
                    // console.log(toCheck, 'low');
                }
            }
            if (range[2].midi < toCheck.midi) {
                if (range[3].midi < toCheck.midi) {
                    return false;
                } else {
                    //warning
                    // console.log(toCheck, 'high');
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
            if (chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).filter(Interval.ofSize('3')).length > 1) {
                return false;
            }
        } else if(chord.romanNumeral.name.startsWith('viio')) {
            if (chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).filter(Interval.ofSize('U')).length > 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks that the chord does not double the seventh
     * @param chord the chord to check
     */
    function checkSeventhDoubling(chord: HarmonizedChord) {
        if (chord.romanNumeral.hasSeventh) {
            if (chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).filter(Interval.ofSize('7')).length > 1) {
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
    export function checkCompleteness(chord: HarmonizedChord, prev?: HarmonizedChord) {
        const numVoicesWithInterval = (chord: HarmonizedChord, interval: string) => chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).filter(Interval.ofSize(interval)).length;
        if(numVoicesWithInterval(chord, 'U') == 0) {
            return false;
        }
        if(numVoicesWithInterval(chord, '3') == 0) {
            return false;
        }
        if (chord.romanNumeral.hasSeventh) {
            if(numVoicesWithInterval(chord, '7') == 0) {
                return false;
            }
            // can leave out fifth of V7
            if (chord.romanNumeral.symbol != 'V' || chord.romanNumeral.inversion.name != 'PU') {
                return numVoicesWithInterval(chord, '5') >= 1;
            }
        } else {
            if (chord.romanNumeral.inversion.name =='PU') {
                // can leave out fifth if preceded by complete V7
                if(!prev || prev.romanNumeral.symbol != 'V' || !prev.romanNumeral.hasSeventh || numVoicesWithInterval(prev, '5') >= 0) {
                    return chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).filter(Interval.ofSize('5')).length >= 1;
                }
            } else {
                return chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).filter(Interval.ofSize('5')).length >= 1;
            }
        }
        return true;
    }

    /**
     * Checks that the chord does not have too much space between the voice parts or that one voice is above another
     * @param chord the chord to check
     */
    function checkSpacing(chord: HarmonizedChord) {
        for(let i = 0; i < chord.voices.length - 2; i ++) {
            if (chord.voices[i].midi - chord.voices[i + 1].midi > 12) {
                return false;
            }
            if (chord.voices[i].midi < chord.voices[i + 1].midi) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks that the chord has no parallel unisons, fifths, or octaves from the previous
     * @param chord the chord to check
     * @param prev the chord before this chord
     */
    function checkParallels(chord: HarmonizedChord, prev: HarmonizedChord) {
        const pairings = [
            [0, 1],
            [0, 2],
            [0, 3],
            [1, 2],
            [1, 3],
            [2, 3],
        ];
        return !pairings
            .map(([upper, lower]) => [prev.voices[upper], prev.voices[lower], chord.voices[upper], chord.voices[lower]])
            .filter(([prevUpper, prevLower, currUpper, currLower]) => prevLower.name != currLower.name || prevUpper.name != currUpper.name)
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
    function checkContraryFifths(chord: HarmonizedChord, prev: HarmonizedChord) {
        const pairings = chord.voices.flatMap((_, outerIndex) => chord.voices.map((_, innerIndex) => [outerIndex, innerIndex])).filter(([one, two]) => one < two);
        return !(pairings
            .map(([upper, lower]) => [prev.voices[upper], prev.voices[lower], chord.voices[upper], chord.voices[lower]])
            .filter(([prevUpper, prevLower, currUpper, currLower]) => Motion.from(prevUpper, prevLower, currUpper, currLower) == Motion.CONTRARY)
            .map(([prevUpper, prevLower, currUpper, currLower]) => [
                new Interval(prevLower, prevUpper),
                new Interval(currLower, currUpper),
            ])
            .some(
                ([prevInterval, currentInterval]) =>
                    prevInterval.simpleSize != '4' && prevInterval.quality == IntervalQuality.PERFECT && prevInterval.name == currentInterval.name,
            ));
    }

    /**
     * Checks whether there are hidden fifths in the soprano and bass
     * Hidden fifths being perfect fifths arrived at through similar motion where the soprano is not moving up by step
     * @param chord the chord to check
     * @param prev the chord before this chord
     */
    function checkHiddenFifths(chord: HarmonizedChord, prev: HarmonizedChord) {
        let interval = new ComplexInterval(chord.voices[chord.voices.length - 1], chord.voices[0]);
        if(interval.name == 'P5' && Motion.from(prev.voices[chord.voices.length - 1], chord.voices[chord.voices.length - 1], prev.voices[0], chord.voices[0]) == Motion.SIMILAR) {
            if(!prev.romanNumeral.name.startsWith('V') && new Interval(prev.romanNumeral.root, prev.voices[0]).simpleSize != '3' && new Interval(prev.voices[0], chord.voices[0]).name != 'm2') {
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
    function checkVoiceCrossingAndOverlap(chord: HarmonizedChord, prev: HarmonizedChord) {
        for(let i = 0; i < chord.voices.length - 1; i++) {
            if(chord.voices[i].midi < prev.voices[i+1].midi || prev.voices[i].midi < chord.voices[i+1].midi) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks whether notes in the previous chord resolve correctly
     * @param chord the chord to check
     * @param prev the chord before this chord
     */
    function checkTendencyTones(chord: HarmonizedChord, prev: HarmonizedChord, before?: HarmonizedChord) {
        //TODO frustrated leading tone and delayed resolution
        if (prev.romanNumeral.symbol == 'V' && !(chord.romanNumeral.symbol == 'V' || chord.romanNumeral.symbol == 'viio')) {
            const index = prev.voices.map(note => new Interval(prev.romanNumeral.root, note)).findIndex(Interval.ofSize('3'));
            if (new Interval(prev.voices[index], chord.voices[index]).simpleSize != '2') {
                return false;
            }
        } else if(prev.romanNumeral.symbol == 'viio' && !(chord.romanNumeral.symbol == 'V' || chord.romanNumeral.symbol == 'viio')) {
            const index = prev.voices.map(note => new Interval(prev.romanNumeral.root, note)).findIndex(Interval.ofSize('U'));
            if (new Interval(prev.voices[index], chord.voices[index]).simpleSize != '2') {
                return false;
            }
        }

        //check 7ths

        //TODO V42 can support 3 4 5
        if (before
            && before.romanNumeral.symbol.toLowerCase() == 'i'
            && before.romanNumeral.inversion.simpleSize == 'U'
            && prev.romanNumeral.symbol == 'V'
            && prev.romanNumeral.inversion.simpleSize == '5'
            && prev.romanNumeral.hasSeventh
            && chord.romanNumeral.symbol.toLowerCase() == 'i'
            && chord.romanNumeral.inversion.simpleSize == '3'
        ) {
            const index = prev.voices.map(note => new Interval(prev.romanNumeral.root, note)).findIndex(Interval.ofSize('7'));
            if(new Interval(before.voices[0], before.voices[index]).simpleSize == '3'
                && new Interval(prev.voices[0], prev.voices[index]).simpleSize == '3'
                && new Interval(chord.voices[0], chord.voices[index]).simpleSize == '3'
            ) {
                    return true;
            }
        }
        if(prev.romanNumeral.hasSeventh && prev.romanNumeral.symbol != chord.romanNumeral.symbol) {
            const index = prev.voices.map(note => new Interval(prev.romanNumeral.root, note)).findIndex(Interval.ofSize('7'));
            if (new Interval(chord.voices[index], prev.voices[index]).simpleSize != '2') {
                return false;
            }
        }
        
        if(chord.romanNumeral.hasSeventh && !(chord.romanNumeral.symbol == 'V')) {
            const index = chord.voices.map(note => new Interval(chord.romanNumeral.root, note)).findIndex(Interval.ofSize('7'));
            if (new Interval(chord.voices[index], prev.voices[index]).simpleSize != '2' &&
                new Interval(prev.voices[index], chord.voices[index]).simpleSize != '2' &&
                new Interval(chord.voices[index], prev.voices[index]).name != 'PU') {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if there is a melodic A2 or too large of intervals
     * @param chord 
     * @param prev 
     */
    function checkInvalidIntervals(chord: HarmonizedChord, prev: HarmonizedChord) {
        for(const voice in [0,1,2,3]) {
            const interval = new Interval(prev.voices[voice], chord.voices[voice]);
            if(interval.simpleSize == '2' && interval.quality == IntervalQuality.AUGMENTED) {
                return false;
            } else if(interval.simpleSize == '7' && interval.quality == IntervalQuality.DIMINISHED) {
                return false;
            }

            const difference = Math.abs(prev.voices[voice].midi - chord.voices[voice].midi);
            if(difference > 7 && !(voice == '3' && interval.simpleSize == 'U')) {
                return false;
            }
        }
        return true;
    }

    export function checkAll(chordToCheck: HarmonizedChord, prev: HarmonizedChord, before?: HarmonizedChord) {
        //TODO make combined version of previous
        let failed = [
            checkRange,
            checkVoiceCrossingAndOverlap,
            checkSpacing,
            checkCompleteness,
            checkParallels,
            checkContraryFifths,
            checkHiddenFifths,
            checkLeadingToneDoubling,
            checkSeventhDoubling,
            checkInvalidIntervals,
            checkTendencyTones,
        ].findIndex(func => !func.apply(null, [chordToCheck, prev, before]));
        return failed;
    }
    
    export function testAll(chordToCheck: HarmonizedChord, prev: HarmonizedChord) {
        return checkAll(chordToCheck, prev) == -1;
    }

    export function checkSingular(chordToCheck: HarmonizedChord) {
        //TODO make combined version of previous
        let failed = [
            checkRange,
            checkSpacing,
            checkCompleteness,
            checkLeadingToneDoubling,
            checkSeventhDoubling,
        ].findIndex(func => !func.apply(null, [chordToCheck]));
        return failed;
    }

    export function testSingular(chordToCheck: HarmonizedChord) {
        return checkSingular(chordToCheck) == -1;
    }
}