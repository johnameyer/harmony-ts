import { HarmonizedChord } from "../chord/harmonized-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Interval } from "../interval/interval";
import { IntervalQuality } from "../interval/interval-quality";
import { ComplexInterval } from "../interval/complex-interval";
import { Motion } from "./motion";
import { zip } from "../util/zip";
import { makeLazyArray } from '../util/make-lazy-array';
import { ScaleDegree } from "./scale-degree";

const absoluteNote = (note: string) => new AbsoluteNote(note);

const numVoicesWithInterval = (chord: HarmonizedChord, interval: string) => chord.intervals.filter(Interval.ofSize(interval)).length;

export type PartWritingRule = (settings: any, ...chords: HarmonizedChord[]) => boolean;
export type PartWritingPreference = (...chords: HarmonizedChord[]) => number;

const sopranoRange = ['B3', 'C4', 'G5', 'A5'].map(absoluteNote);
const altoRange = ['G3', 'G3', 'C5', 'D5'].map(absoluteNote);
const tenorRange = ['C3', 'C3', 'G4', 'A4'].map(absoluteNote);
const bassRange = ['D2', 'E2', 'C4', 'D4'].map(absoluteNote);

export const voiceRange = [sopranoRange, altoRange, tenorRange, bassRange];

// TODO clean up this file further (esp nicer typechecking)

export interface PartWritingRules {
    [ruleName: string]: PartWritingRule
};

export interface PartWritingPreferences {
    [ruleName: string]: PartWritingPreference
};

// Thanks to https://stackoverflow.com/questions/51419176/how-to-get-a-subset-of-keyof-t-whose-value-tk-are-callable-functions-in-typ
type ParamOfType<T extends PartWritingRules, U> = {[P in keyof T]: Parameters<T[P]>[0] extends U ? P : never}[keyof T]
type ParamNotOfType<T extends PartWritingRules, U> = {[P in keyof T]: Parameters<T[P]>[0] extends U ? never : P}[keyof T]

export interface PartWritingParameters<T extends PartWritingRules = typeof defaultPartWritingRules, U extends PartWritingPreferences = typeof defaultPartWritingPreferences>{
    rules: T,
    singularRules: (keyof T)[],
    ruleParameters: {
        [ruleName in ParamOfType<T, undefined>]?: false
    } & {
        [ruleName in ParamNotOfType<T, undefined>]: Parameters<T[ruleName]>[0] | false
    }
    preferences: U,
    singularPreferences: (keyof U)[],
    preferencesOrdering: (keyof U)[]
};

export namespace PartWriting {

    //TODO replace with full-blown factory
    type RuleUnion<T> = T & typeof defaultPartWritingParameters.rules;
    type PreferencesUnion<T> = T & typeof defaultPartWritingParameters.preferences;
    
    /**
     * Extend the default parameters with new rules, preferences
     * @param newRules the new rules
     * @param newPreferences the new preferences
     * @param newSingularRules the new rules that are singular
     * @param newRuleParameters the new parameters (can disable old rules by setting false)
     * @param newSingularPreferences the new preferences that are singular
     * @param newPreferencesOrdering the ordering of all the preferences
     */
    export function extendDefaultParameters<T extends PartWritingRules, U extends PartWritingPreferences>({ newRules, newPreferences, newSingularRules, newRuleParameters, newSingularPreferences, newPreferencesOrdering }: {
        newRules?: T;
        newPreferences?: U;
        newSingularRules?: (keyof T)[];
        newRuleParameters?: Partial<{[ruleName in keyof RuleUnion<T>]: Parameters<RuleUnion<T>[ruleName]>[0] | boolean}>;
        newSingularPreferences?: (keyof U)[];
        newPreferencesOrdering?: (keyof PreferencesUnion<U>)[];
    } = {}) {
        return {
            rules: {...defaultPartWritingParameters.rules, ...(newRules || {})},
            singularRules: [...defaultPartWritingParameters.singularRules, ...(newSingularRules || [])],
            ruleParameters: {...defaultPartWritingParameters.ruleParameters, ...(newRuleParameters || {})},
            preferences: {...defaultPartWritingParameters.preferences, ...(newPreferences || {})},
            singularPreferences: [...defaultPartWritingParameters.singularPreferences, ...(newSingularPreferences || [])],
            preferencesOrdering: [...(newPreferencesOrdering || defaultPartWritingParameters.preferencesOrdering)]
        } as PartWritingParameters<T & typeof defaultPartWritingRules, U & typeof defaultPartWritingPreferences>;
    }

    export namespace Rules {

        /**
         * Rules about how a singular chord should look
         */
        export namespace VoicingRules {
            /**
             * Checks that the chord maintains proper vocal ranges
             * @param chord the chord to check
             */
            export function range(settings: {ranges: AbsoluteNote[][]}, chord: HarmonizedChord) {
                for (const [range, toCheck] of zip(settings.ranges || voiceRange, chord.voices) as [AbsoluteNote[], AbsoluteNote][]) {
                    if (toCheck.midi < range[0].midi) {
                        return false;
                    }
                    if (range[3].midi < toCheck.midi) {
                        return false;
                    }
                }
                return true;
            }

            /**
             * Checks that the notes in the chord properly spells the chord
             * @param settings
             * @param chord the chord under consideration
             */
            export function spelling(_: undefined, chord: HarmonizedChord) {
                if(!chord.intervals.every(interval => chord.romanNumeral.intervals.map(interval => interval.name).includes(interval.name))) {
                    return false;
                }
                return chord.voices[chord.voices.length - 1].simpleName == chord.romanNumeral.inversionInterval.transposeUp(chord.romanNumeral.root).name;
            }

            /**
             * Checks that the chord does not double the leading tone
             * @param chord the chord to check
             */
            export function leadingToneDoubling(_: undefined, chord: HarmonizedChord) {
                if(chord.flags?.sequence) {
                    return true;
                }
                if (chord.romanNumeral.name.startsWith('V')) {
                    if (chord.intervals.filter(Interval.ofSize('3')).length > 1) {
                        return false;
                    }
                } else if(chord.romanNumeral.name.startsWith('viio')) {
                    if (chord.intervals.filter(Interval.ofSize('U')).length > 1) {
                        return false;
                    }
                }
                return true;
            }

            /**
             * Checks that the chord does not double the seventh
             * @param chord the chord to check
             */
            export function seventhDoubling(_: undefined, chord: HarmonizedChord) {
                if (chord.romanNumeral.hasSeventh) {
                    if (chord.intervals.filter(Interval.ofSize('7')).length > 1) {
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
            export function completeness(_: undefined, chord: HarmonizedChord, prev?: HarmonizedChord) {
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
                    // can leave out fifth of root position 7
                    if (chord.romanNumeral.inversionInterval.simpleSize != 'U') {
                        return numVoicesWithInterval(chord, '5') >= 1;
                    }
                } else {
                    if (chord.romanNumeral.inversionInterval.simpleSize =='U') {
                        if(!prev) {
                            return true;
                        }
                        // can leave out fifth if preceded by complete V7
                        if(prev.romanNumeral.symbol != 'V' || !prev.romanNumeral.hasSeventh || numVoicesWithInterval(prev, '5') == 0) {
                            return chord.intervals.filter(Interval.ofSize('5')).length >= 1;
                        }
                    } else {
                        return chord.intervals.filter(Interval.ofSize('5')).length >= 1;
                    }
                }
                return true;
            }

            /**
             * Checks that the chord does not have too much space between the voice parts or that one voice is above another
             * @param chord the chord to check
             */
            export function spacingAndCrossing(_: undefined, chord: HarmonizedChord) {
                let i = 0;
                for(i = 0; i < chord.voices.length - 2; i ++) {
                    if (chord.voices[i].midi - chord.voices[i + 1].midi > 12) {
                        return false;
                    }
                    if (chord.voices[i].midi < chord.voices[i + 1].midi) {
                        return false;
                    }
                }
                if (chord.voices[i].midi < chord.voices[i+1].midi) {
                    return false;
                }
                return true;
            }

            /**
             * Checks that a accented (cadential) 64 does not double the tonic
             * @param chord 
             */
            export function accented64Doubling(_: undefined, chord: HarmonizedChord) {
                if (chord.romanNumeral.inversion === 2 && chord.romanNumeral.hasSeventh === false) {
                    if (chord.intervals.filter(Interval.ofSize('U')).length > 1) {
                        return false;
                    }
                }
                return true;
            }
        }

        /**
         * Rules about how a chord should be in relation to the previous chords
         */
        export namespace HorizontalRules {
            /**
             * Checks that the chord has no parallel unisons, fifths, or octaves from the previous
             * @param chord the chord to check
             * @param prev the chord before this chord
             */
            export function parallels(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
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
                    .filter(([prevUpper, prevLower, currUpper, currLower]) => prevLower.name != currLower.name && prevUpper.name != currUpper.name)
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
            export function contraryFifths(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
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
            export function hiddenFifths(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
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
            export function voiceOverlap(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
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
            export function leadingToneResolution(settings: { frustratedLeadingTone: boolean }, chord: HarmonizedChord, prev: HarmonizedChord, ...before: HarmonizedChord[]) {
                if(chord.flags?.sequence) {
                    return true;
                }
                //TODO delayed resolution
                if (prev.romanNumeral.symbol == 'V' && !(chord.romanNumeral.symbol == 'V' || chord.romanNumeral.symbol == 'viio')) {
                    const index = prev.intervals.findIndex(Interval.ofSize('3'));
                    if (new Interval(prev.voices[index], chord.voices[index]).simpleSize != '2') {
                        if(prev.voices[index].midi < chord.voices[index].midi) {
                            return false;
                        }
                        if(settings.frustratedLeadingTone) {
                            return false;
                        }
                        let resolvedInUpper = false;
                        for(let i = 0; i < index; i++) {
                            if(new Interval(prev.voices[index], chord.voices[i]).simpleSize === '2') {
                                resolvedInUpper = true;
                                break;
                            }
                        }
                        if(!resolvedInUpper) {
                            return false;
                        }
                    }
                } else if(prev.romanNumeral.symbol == 'viio' && !(chord.romanNumeral.symbol == 'V' || chord.romanNumeral.symbol == 'viio')) {
                    const index = prev.intervals.findIndex(Interval.ofSize('U'));
                    if (index === -1 || new Interval(prev.voices[index], chord.voices[index]).simpleSize != '2') {
                        return false;
                    }
                }
                return true;
            }

            /**
             * Checks whether the seventh is prepared correctly (by step or unison)
             * V is exempt
             * @todo is applied V exempt?
             * @param chord the chord to check
             * @param prev the chord before this chord
             */
            export function seventhPreparation(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
                if(!chord.romanNumeral.hasSeventh) {
                    return true;
                }
                if(prev.romanNumeral.root === chord.romanNumeral.root && prev.romanNumeral.hasSeventh) {
                    return true;
                }
                if (chord.romanNumeral.symbol == 'V') {
                    return true;
                }
                const index = chord.intervals.findIndex(Interval.ofSize('7'));
                if(index === -1) {
                    return false;
                }
                try {
                    const interval = new Interval(prev.voices[index], chord.voices[index]).simpleSize;
                    if(interval === 'U' || interval === '2') {
                        return true;
                    }
                } catch {}
                try {
                    const interval = new Interval(chord.voices[index], prev.voices[index]).simpleSize;
                    if(interval === 'U' || interval === '2') {
                        return true;
                    }
                } catch {}
                return false;
            }

            /**
             * Checks that the seventh of a chord resolves down, except in a few exceptions
             * @param settings 
             * @param chord the chord under consideration
             * @param prev the chord before `chord`
             * @param before the chord before `prev`
             */
            export function seventhResolution(settings: { scope: number }, chord: HarmonizedChord, prev: HarmonizedChord, ...before: HarmonizedChord[]) {
                //V42 can support 3 4 5
                if (before[0]
                    && before[0].romanNumeral.symbol.toLowerCase() == 'i'
                    && before[0].romanNumeral.inversionInterval.simpleSize == 'U'
                    && prev.romanNumeral.symbol == 'V'
                    && prev.romanNumeral.inversionInterval.simpleSize == '5'
                    && prev.romanNumeral.hasSeventh
                    && chord.romanNumeral.symbol.toLowerCase() == 'i'
                    && chord.romanNumeral.inversionInterval.simpleSize == '3'
                ) {
                    const index = prev.intervals.findIndex(Interval.ofSize('7'));
                    if(before[0].intervals[index].simpleSize == '3'
                        && prev.intervals[index].simpleSize == '3'
                        && chord.intervals[index].simpleSize == '3'
                    ) {
                            return true;
                    }
                }
                // TODO O(n) check - is there a better way?
                // TODO resolution needs to be enforced at end
                const seventhChecks = [chord, prev, ...before];
                for(let i = 1; i < settings.scope; i++) {
                    if(seventhChecks[i].romanNumeral.hasSeventh) {
                        const index = seventhChecks[i].intervals.findIndex(Interval.ofSize('7'));
                        for(let j = i - 1; j >= 0; j--) {
                            if(new Interval(seventhChecks[j].voices[index], seventhChecks[i].voices[index]).simpleSize === 'U') {
                                continue;
                            }
                            if (new Interval(seventhChecks[j].voices[index], seventhChecks[i].voices[index]).simpleSize !== '2') {
                                return false;
                            }
                            break;
                        }
                    }
                }
                return true;
            }

            /**
             * Checks that diminished fifths resolve inwards
             * @todo implement
             * @todo is this necessary
             */
            export function diminishedFifthResolution(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord, ...before: HarmonizedChord[]) {
                // check that a d5 or A4 involving the bass resolves normally

                // TODO allow for exceptions as on page 415
                
                // check that tritone as d5 resolves inwards (A4 can go to P4) not to P5 unless 10ths with soprano bass (can be only the two chords)
                // for(let lowerVoice = 0; lowerVoice < prev.voices.length - 1; lowerVoice++) {
                //     for(let upperVoice = 0; upperVoice < prev.voices.length; upperVoice++) {
                //         try {
                //             if(new Interval(prev.voices[lowerVoice], prev.voices[upperVoice]).name == 'd5') {
                //                 if(new Interval(prev.voices[lowerVoice], chord.voices[lowerVoice]).simpleSize == '2' && 
                //                 new Interval(prev.voices[lowerVoice], prev.voices[upperVoice]).name == 'd5') {
                //                     return false;
                //                 }
                //             }
                //         }
                //     }
                // }
                return true;
            }

            /**
             * Checks if there is a melodic A2 or too large of intervals
             * @param chord 
             * @param prev 
             * @todo A2 is sometimes acceptable
             */
            export function invalidIntervals(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
                for(const voice in [0,1,2,3]) {
                    const interval = new Interval(prev.voices[voice], chord.voices[voice]);
                    if(interval.simpleSize == '2' && interval.quality == IntervalQuality.AUGMENTED) {
                        return false;
                    } else if(interval.simpleSize == '7' && interval.quality == IntervalQuality.DIMINISHED) {
                        return false;
                    }

                    const difference = Math.abs(prev.voices[voice].midi - chord.voices[voice].midi);
                    if(difference > 7 && !(voice === '3' && interval.simpleSize === 'U' && interval.quality === IntervalQuality.PERFECT && prev.voices[voice].midi - chord.voices[voice].midi > 0)) {
                        return false;
                    }
                }
                return true;
            }

            /**
             * Checks that an accented 64 is properly prepared
             * @param settings 
             * @param chord 
             * @param prev 
             */
            export function accented64Preparation(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
                if (chord.romanNumeral.inversion === 2 && chord.romanNumeral.hasSeventh === false) {
                    const fourthVoice = chord.voices.findIndex(note => new Interval(chord.romanNumeral.root, note).simpleSize === 'U');
                    if(fourthVoice === -1) {
                        return false;
                    }
                    const fourthNote = chord.voices[fourthVoice];
                    const fourthPrep = prev.voices[fourthVoice];
                    try {
                        if(new ComplexInterval(fourthNote, fourthPrep).complexSize === 'U'
                        || new ComplexInterval(fourthNote, fourthPrep).complexSize === '2') {
                            return true;
                        }
                    } catch {}
                    try {
                        if(new ComplexInterval(fourthPrep, fourthNote).complexSize === '2') {
                            return true;
                        }
                    } catch {}
                    return false;
                }
                return true;
            }

            /**
             * Checks that an accented 64 resolves properly
             * @param settings 
             * @param chord 
             * @param prev 
             */
            export function accented64Resolution(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
                if (prev.romanNumeral.inversion === 2 && prev.romanNumeral.hasSeventh === false) {
                    if(chord.romanNumeral.root.simpleName !== prev.romanNumeral.inversionInterval.transposeUp(prev.romanNumeral.root).simpleName) {
                        return true;
                    }
                    const fourthVoice = prev.voices.findIndex(note => new Interval(prev.romanNumeral.root, note).simpleSize === 'U');
                    if(fourthVoice === -1) {
                        return false;
                    }
                    const fourthNote = prev.voices[fourthVoice];
                    const fourthResolution = chord.voices[fourthVoice];
                    try {
                        if(new ComplexInterval(fourthResolution, fourthNote).complexSize !== '2') {
                            return false;
                        }
                    } catch {
                        return false;
                    }
                    let sixthResolves = false;
                    for (let voice = 0; voice < chord.voices.length; voice++) {
                        const note = prev.voices[voice];
                        if(new Interval(prev.romanNumeral.root, note).simpleSize !== '3') {
                            continue;
                        }
                        const sixthNote = prev.voices[voice];
                        const sixthResolution = chord.voices[voice];
                        try {
                            if(new ComplexInterval(sixthResolution, sixthNote).complexSize === '2') {
                                sixthResolves = true;
                                break;
                            }
                        } catch {}
                    }
                    if(!sixthResolves) {
                        return false;
                    }
                    
                }
                return true;
            }

            export function cadenceType(_: undefined, chord: HarmonizedChord, prev: HarmonizedChord) {
                if(chord.flags.pac) {
                    if(chord.romanNumeral.name !== 'I' || (prev.romanNumeral.name !== 'V' && prev.romanNumeral.name !== 'V7')) {
                        return false;
                    }
                    if(new Interval(chord.romanNumeral.root, chord.voices[0]).simpleSize !== 'U') {
                        return false;
                    }
                } else if(chord.flags.iac) {
                    // for our uses an IAC is V-I without 1 in the soprano
                    if(chord.romanNumeral.name !== 'I' || (prev.romanNumeral.name !== 'V' && prev.romanNumeral.name !== 'V7')) {
                        return false;
                    }
                    if(new Interval(chord.romanNumeral.root, chord.voices[0]).simpleSize === 'U') {
                        return false;
                    }
                } else if(chord.flags.hc) {
                    if(chord.romanNumeral.name !== 'V') {
                        return false;
                    }
                } else if(chord.flags.dc) {
                    if(chord.romanNumeral.name === 'I' || (prev.romanNumeral.name !== 'V' && prev.romanNumeral.name !== 'V7')) {
                        return false;
                    }
                }
                return true;
            }

            /**
             * Checks that the voices of a sequence maintain the same voicing over evey other chord
             * @param _ 
             * @param chord
             * @param prev 
             */
            export function sequence(_: undefined, chord: HarmonizedChord, _middle: HarmonizedChord, prev: HarmonizedChord) {
                // console.log(chord.flags);
                if(chord.flags?.sequence && prev?.flags?.sequence) {
                    // console.log(new Interval(chord.romanNumeral.root, prev.romanNumeral.root).simpleSize);
                    for(let voice = 0; voice < chord.voices.length; voice++) {
                        // console.log(new Interval(chord.voices[voice], prev.voices[voice]).simpleSize);
                        if(new Interval(chord.romanNumeral.root, prev.romanNumeral.root).simpleSize !== new Interval(chord.voices[voice], prev.voices[voice]).simpleSize) {
                            // console.log(false);
                            return false;
                        }
                    }
                }
                return true;
            }
        }

        /**
         * Creates a generator that returns the keys of failed rules
         * @param parameters 
         * @param chords 
         */
        export function *checkAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chords: HarmonizedChord[]): Generator<keyof T> {
            //TODO make combined version of previous
            for(const key of Object.keys(parameters.rules) as (keyof T)[]) {
                // @ts-ignore
                const ruleParams = parameters.ruleParameters[key];
                if(ruleParams !== false && !parameters.rules[key].apply(null, [ruleParams, ...chords])) {
                    yield key;
                }
            }
        }
        
        /**
         * Checks that no rule fails
         * @param parameters 
         * @param chords 
         */
        export function testAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chords: HarmonizedChord[]) {
            return checkAll(parameters, chords).next().value === undefined;
        }

        /**
         * Checks a singular chord and returns the index of the failing
         * @param parameters 
         * @param chordToCheck 
         */
        export function *checkSingular<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: HarmonizedChord): Generator<keyof T> {
            //TODO make combined version of previous
            for(const key of parameters.singularRules) {
                // Next line is needed because ts can't determine that the keys are preserved
                // @ts-ignore
                const ruleParams = parameters.ruleParameters[key];
                if(ruleParams !== false && !parameters.rules[key].apply(null, [ruleParams, chordToCheck])) {
                    yield key;
                }
            }
        }

        /**
         * Checks that no check is failed for a singular chord
         * @param parameters 
         * @param chordToCheck 
         */
        export function testSingular<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: HarmonizedChord) {
            return checkSingular(parameters, chordToCheck).next().value === undefined;
        }
    }

    export namespace Preferences {
        // TODO needless bass disjunction rule

        export namespace VoicingRules {
            /**
             * Prefer that chords have certain doublings over others
             * @param chord the chord under consideration
             */
            export function checkDoubling(chord: HarmonizedChord) {
                if(chord.romanNumeral.hasSeventh) {
                    if(numVoicesWithInterval(chord, '5') == 0) {
                        //prefer root doubled if no fifth
                        if(numVoicesWithInterval(chord, 'U') != 2) {
                            return -2;
                        }
                        return -1;
                    }
                } else {
                    if(numVoicesWithInterval(chord, '5') == 0 && chord.romanNumeral.inversionInterval.simpleSize == 'U') {
                        //prefer root tripled if no fifth
                        if(numVoicesWithInterval(chord, 'U') != 3) {
                            return -2;
                        }
                        return -1;
                    } else if(chord.romanNumeral.inversionInterval.simpleSize == 'U') {
                        //root position prefer double root
                        if(numVoicesWithInterval(chord, 'U') != 2) {
                            return -1;
                        }
                    } else if(chord.romanNumeral.inversionInterval.simpleSize == '3') {
                        //first inversion any can be doubled
                    } else {
                        //second inversion prefer doubling fifth
                        if(numVoicesWithInterval(chord, '5') != 2) {
                            return -1;
                        }
                    }
                }
                return 0;
            }

            /**
             * Prefer that voices do not cross
             * @param chord the chord under consideration
             */
            export function checkVoiceCrossing(chord: HarmonizedChord) {
                let count = 0;
                for(let i = 1; i < chord.voices.length - 2; i++) {
                    if(chord.voices[i].midi < chord.voices[i+1].midi) {
                        count -= 1;
                    }
                }
                return count;
            }

            /**
             * Prefer that voices remain within their core range
             * @param chord the chord under consideration
             */
            export function checkRange(chord: HarmonizedChord) {
                let result = 0;
                for (const [range, toCheck] of [
                    [sopranoRange, chord.voices[0]],
                    [altoRange, chord.voices[1]],
                    [tenorRange, chord.voices[2]],
                    [bassRange, chord.voices[3]],
                ] as [AbsoluteNote[], AbsoluteNote][]) {
                    if (toCheck.midi < range[1].midi) {
                        result -= 1;
                    }
                    if (range[2].midi < toCheck.midi) {
                        result -= 1;
                    }
                }
                return result;
            }

            /**
             * Prefer that voices do not share the same pitch
             * @param chord the chord under consideration
             */
            export function checkSharedPitch(chord: HarmonizedChord) {
                let count = 0;
                for(let i = 1; i < chord.voices.length - 1; i++) {
                    if(chord.voices[i].midi === chord.voices[i+1].midi) {
                        count -= 1;
                    }
                }
                return count;
            }

            /**
             * Prefer chord progressions using sequences
             * @param chord the chord to look at
             */
            export function checkSequence(chord: HarmonizedChord) {
                if(chord.flags?.sequence) {
                    return 1;
                }
                return 0;
            }
        }
        
        /**
         * Rules about how a chord should be in relation to the previous chords
         */
        export namespace HorizontalRules {
            /**
             * Prefer that inner voices do not overlap
             * @param chord the chord under consideration
             * @param prev the previous chord
             */
            export function checkVoiceOverlap(chord: HarmonizedChord, prev: HarmonizedChord) {
                let count = 0;
                for(let i = 1; i < chord.voices.length - 2; i++) {
                    if(chord.voices[i].midi < prev.voices[i+1].midi || prev.voices[i].midi < chord.voices[i+1].midi) {
                        count -= 1;
                    }
                }
                return count;
            }

            /**
             * Prefer smaller movements in soprano and inner voices
             * @param chord the chord under consideration
             * @param prev the previous chord
             * @todo implement restorative and soprano special rules
             */
            export function checkVoiceDisjunction(chord: HarmonizedChord, prev: HarmonizedChord) {
                //TODO prefer restorative
                let count = 0;
                for(let i = 0; i < chord.voices.length - 1; i++) {
                    count -= Math.abs(chord.voices[i].midi - prev.voices[i].midi);
                }
                return count;
            }

            /**
             * Prefer that the bass jumps down by an octave in cadential V progressions (e.g. V - V7)
             * @param chord the chord under consideration
             * @param prev the previous chord
             */
            export function checkBassOctaveJump(chord: HarmonizedChord, prev: HarmonizedChord) {
                if(
                    (prev.romanNumeral.name.toLowerCase() === 'i64' && chord.romanNumeral.name === 'V')
                    || 
                    (prev.romanNumeral.name.toLowerCase() === 'i64' && chord.romanNumeral.name === 'V7')
                    ||
                    (prev.romanNumeral.name === 'V' && chord.romanNumeral.name === 'V7')
                ) {
                    try {
                        if(new ComplexInterval(chord.voices[chord.voices.length-1], prev.voices[chord.voices.length-1]).name === 'P8') {
                            return 1;
                        }
                    } catch {}
                }
                return 0;
            }

            /**
             * Prefer proper succession of chromatic tones, as might result in ii - V/V
             * @param chord the chord under consideration
             * @param prev the previous chord
             */
            // export function checkCrossRelations(chord: HarmonizedChord, prev: HarmonizedChord) {
            //     //TODO
            //     // single voice best

            //     // applied leading tone in bass
            //     // where cross relation in inner voice
            //     // avoid leaps in upper voices

            //     // same register, different voice

            //     // chromaticized voice exchange
            //     // addtl make new voice exchange rule to promote exchange through passing chords?

            //     // outer voices avoided, except where soprano moves by step
            //     return true;
            // }

            /**
             * Prefer using a chord that is different from the previous
             */
            export function checkRepetition(chord: HarmonizedChord, previous: HarmonizedChord) {
                // TODO remove
                return chord.romanNumeral.name === previous.romanNumeral.name ? 0 : 1;
            }

            /**
             * Prefers that a pivot chord has a predominant function in the new key
             */
            export function modulationToPredominant(chord: HarmonizedChord){
                if(!chord.flags.pivot) {
                    return 0;
                }
                if(chord.romanNumeral.scaleDegree === ScaleDegree.TONIC || chord.romanNumeral.scaleDegree === ScaleDegree.DOMINANT) {
                    return -1;
                }
                return 0;
            }

            /**
             * Prefers that there are fewer modulations
             */
            export function fewerModulations(chord: HarmonizedChord){
                if(chord.flags.pivot) {
                    return -1;
                }
                return 0;
            }
        }

        /**
         * Evaluate the chord on all the preferences
         * @param chordToCheck the chord to evaluate
         */
        export function evaluateSingle<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: HarmonizedChord): number[] {
            //TODO make combined version of previous
            //TODO make ordering and selection parameterized
            let checks = parameters.preferencesOrdering
                .filter(preference => parameters.singularPreferences.includes(preference))
                .map(preference => parameters.preferences[preference])
                .map(func => func.apply(null, [chordToCheck]));
            return checks;
        }

        /**
         * Create a lazy array of the results of the preference checks
         * The checks will only be run if the index is called and the value is not already calculated
         * @param chordToCheck the chord to run the rules
         */
        export function lazyEvaluateSingle<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: HarmonizedChord): number[] {
            //TODO make combined version of previous
            let checks = makeLazyArray(parameters.preferencesOrdering
                .filter(preference => parameters.singularPreferences.includes(preference))
                .map(preference => parameters.preferences[preference])
                .map(func => () => func.apply(null, [chordToCheck]))
            );
            return checks;
        }

        /**
         * Evaluates all preferences for a given chord
         * @param chordToCheck the chord to check
         * @param prev the chord before the chord under consideration
         */
        export function evaluateAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: HarmonizedChord, prev: HarmonizedChord): number[] {
            //TODO make combined version of previous
            //TODO need V7 VI/vi prefer double 3rd?
            let checks = parameters.preferencesOrdering
                .map(preference => parameters.preferences[preference])
                .map(func => func.apply(null, [chordToCheck, prev]));
            return checks;
        }

        /**
         * Create a lazy array of the results of the preference checks
         * The checks will only be run if the index is called and the value is not already calculated
         * @param chordToCheck the chord to run the rules on
         * @param prev the chord before the one under consideration
         */
        export function lazyEvaluateAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: HarmonizedChord, prev: HarmonizedChord): number[] {
            //TODO make combined version of previous
            //TODO need V7 VI/vi prefer double 3rd?
            let checks = makeLazyArray(parameters.preferencesOrdering
                .map(preference => parameters.preferences[preference])
                .map(func => () => func.apply(null, [chordToCheck, prev]))
            );
            return checks;
        }
    }
}

const defaultPartWritingRules = {
    ...PartWriting.Rules.VoicingRules,
    ...PartWriting.Rules.HorizontalRules
};

const defaultPartWritingPreferences = {
    ...PartWriting.Preferences.VoicingRules,
    ...PartWriting.Preferences.HorizontalRules
};

export const defaultPartWritingParameters: PartWritingParameters<typeof defaultPartWritingRules, typeof defaultPartWritingPreferences> = {
    rules: defaultPartWritingRules,
    singularRules: Object.keys(PartWriting.Rules.VoicingRules) as (keyof typeof PartWriting.Rules.VoicingRules)[],
    ruleParameters: {
        range: {
            ranges: voiceRange
        },
        seventhResolution: {
            scope: 2
        },
        leadingToneResolution: {
            frustratedLeadingTone: true
        }
    },
    preferences: defaultPartWritingPreferences,
    singularPreferences: [
        'fewerModulations',
        'modulationToPredominant',
        'checkSequence',
        'checkRange',
        'checkDoubling',
        'checkSharedPitch'
    ],
    preferencesOrdering: [
        'fewerModulations',
        'modulationToPredominant',
        'checkSequence',
        'checkRepetition',
        'checkRange',
        'checkDoubling',
        'checkVoiceCrossing',
        'checkVoiceOverlap',
        'checkBassOctaveJump',
        'checkVoiceDisjunction',
        'checkSharedPitch'
    ]
};