import { HarmonizedChord } from "../chord/harmonized-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Interval } from "../interval/interval";
import { IntervalQuality } from "../interval/interval-quality";
import { ComplexInterval } from "../interval/complex-interval";
import { Motion } from "../interval/motion";
import { zip } from "../util/zip";
import { makeLazyArray } from '../util/make-lazy-array';
import { ScaleDegree } from "../harmony/scale-degree";
import { Scale } from "../scale";
import { isDefined } from "../util";
import { IChord } from "../chord/ichord";
import { minGenerator } from "../util/min-generator";
import { IncompleteChord } from "../chord/incomplete-chord";
import { HarmonyParameters, Harmony } from "../harmony/harmony";
import { Note } from "../note/note";
import { RomanNumeral } from "../harmony/roman-numeral";
import { Accidental } from "../accidental";
import { CompleteChord } from "../chord/complete-chord";
import { NestedIterable, NestedLazyMultiIterable, convertToMultiIterator, resultsOfLength, flattenResults, unnestNestedIterable } from "../util/nested-iterable";
import { makePeekableIterator } from "../util/make-peekable-iterator";
import { arrayComparator } from "../util/array-comparator";
import { iteratorMap } from "../util/iterator-map";
import { nestedIterableMap } from "../util/nested-iterator-map";

function reconcileConstraints(one: IncompleteChord, two: IncompleteChord) {
    const compatible = <T>(one: T | undefined, two: T | undefined) => !one || !two || one == two;
    for(let voicePart in one.voices) {
        if(!compatible(one.voices[voicePart]?.name, two.voices[voicePart]?.name)) {
            return null;
        }
    }
    
    if(!compatible(one.romanNumeral?.root?.name, two.romanNumeral?.root?.name)) {
        return null;
    }
    if(!compatible(one.romanNumeral?.name, two.romanNumeral?.name)) {
        return null;
    }
    if(!compatible(one.romanNumeral?.scale[0], two.romanNumeral?.scale[0])) {
        return null;
    }
    if(!compatible(one.romanNumeral?.scale[1], two.romanNumeral?.scale[1])) {
        return null;
    }
    if(one.flags) {
        for(const key in one.flags) {
            if(two.flags && two.flags[key] !== undefined && one.flags[key] !== two.flags[key]) {
                return null;
            }
        }
    }
    if(two.flags) {
        for(const key in two.flags) {
            if(one.flags && one.flags[key] !== undefined && one.flags[key] !== two.flags[key]) {
                return null;
            }
        }
    }
    if(one.romanNumeral) {
        const romanNumeral = one.romanNumeral;
        const oneNotes = romanNumeral?.intervals.map(interval => romanNumeral.root ? interval.transposeUp(romanNumeral.root).simpleName : undefined);
        if(!two.voices.filter(isDefined).every(note => oneNotes.includes(note.simpleName))){
            return null;
        }
    } else if(two.romanNumeral) {
        const romanNumeral = two.romanNumeral;
        const twoNotes = romanNumeral.intervals.map(interval => romanNumeral.root ? interval.transposeUp(romanNumeral.root).simpleName : undefined);
        if(!one.voices.filter(isDefined).every(note => twoNotes.includes(note.simpleName))){
            return null;
        }
    }
    
    const romanNumeral = one.romanNumeral || two.romanNumeral;
    const voices = [...new Array(Math.max(one.voices.length, two.voices.length))].map((_, index) => one.voices[index] || two.voices[index]);
    const flags = {...(one.flags || {}), ...(two.flags || {})};
    return new IncompleteChord({romanNumeral, voices, flags});
}

const absoluteNote = (note: string) => new AbsoluteNote(note);

const numVoicesWithInterval = (intervals: Interval[], interval: string) => intervals.filter(Interval.ofSize(interval)).length;

export type PartWritingRule = (settings: any, ...chords: IChord[]) => boolean;
export type PartWritingPreference = (...chords: CompleteChord[]) => number;

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
    preferencesOrdering: (keyof U)[],
    yieldOrdering: (iterator: NestedIterable<CompleteChord>, previous: CompleteChord[], partWritingParams: PartWritingParameters) => NestedIterable<CompleteChord>
};

export class PartWriting {
    constructor(public params: PartWritingParameters = defaultPartWritingParameters, public harmonizer: Harmony = new Harmony({})) { }

    * voiceAll(constraints: IncompleteChord[], scale: Scale): NestedIterable<CompleteChord[]> {
        for(let i = 1; i < constraints.length; i++) {
            const failed = PartWriting.Rules.checkAll(this.params, constraints.slice(0, i + 1).reverse()).next().value;
            if(failed) {
                console.error('Failed rule ' + failed + ' on constraint ' + i);
                return;
            }
        }
        //TODO harmonize tonic or come up with options
        const start = new RomanNumeral(constraints[0]?.romanNumeral?.name || (scale[1] === Scale.Quality.MINOR ? 'i' : 'I'),  scale);
        const reconciledConstraint = reconcileConstraints(constraints[0], new IncompleteChord({romanNumeral: start}));
        if(!reconciledConstraint) {
            console.error('Failed to reconcile first constraint');
            return;
        }
        {
            const failed = PartWriting.Rules.checkSingular(this.params, reconciledConstraint).next().value;
            if(failed) {
                console.error('First reconciled constraint failed rule ' + failed);
                return;
            }
        }
        // let furthest = 0;
        // let results: HarmonizedChord[] = [];
        const harmonization = convertToMultiIterator(this.harmonizer.matchingCompleteHarmony(constraints, scale));

        const result = resultsOfLength(this.voiceWithContext(constraints, harmonization, scale), constraints.length);

        yield* result;
    }

    /**
     * Makes no guarantee that all yielded results will be complete, consider wrapping with resultsOfLength if that is needed
     */
    * voiceWithContext(constraints: IncompleteChord[], progression: NestedLazyMultiIterable<HarmonizedChord[]>, scale: Scale, previous: CompleteChord[] = []): NestedIterable<CompleteChord[]> {
        if(constraints.length == previous.length) {
            return;
        }
        for(const [current, future] of progression){
            const voicings = nestedIterableMap(this.chordVoicings(current, previous), (voicings, nestedPrevious) => this.params.yieldOrdering(voicings, [...nestedPrevious.slice().reverse(), ...previous], this.params));
            for(const voicing of unnestNestedIterable(voicings)) {
                const newPrevious = [...voicing.slice().reverse(), ...previous];
                const recurse = this.voiceWithContext(constraints, future, scale, newPrevious);
                yield [voicing, recurse];
            }
        }
    }

    * chordVoicings(constraints: HarmonizedChord[], previous: CompleteChord[] = []): NestedIterable<CompleteChord> {
        if(constraints.length === 0) {
            return;
        }
        
        for(const voicing of this.chordVoicing(constraints[0], previous)) {
            yield [voicing, this.chordVoicings(constraints.slice(1), [voicing, ...previous])];
        }
    }

    * chordVoicing(reconciledConstraint: HarmonizedChord, previous: CompleteChord[] = []) {
        const mapToNearby = (previous: AbsoluteNote) => (note: Note) => [
            new AbsoluteNote(note.name + [previous.octavePosition + 1]),
            new AbsoluteNote(note.name + [previous.octavePosition]),
            new AbsoluteNote(note.name + [previous.octavePosition - 1]),
        ];
        
        const romanNumeral = reconciledConstraint.romanNumeral;
        const needed = romanNumeral.intervals.map(interval => romanNumeral.root ? interval.transposeUp(romanNumeral.root) : undefined).filter(isDefined);
        let bassNote = romanNumeral.inversionInterval.transposeUp(romanNumeral.root);
        
        let sopranoNotes, altoNotes, tenorNotes, bassNotes;
        if(previous.length) {
            const get = (voicePart: number) => {
                let voice = reconciledConstraint.voices[voicePart];
                if(isDefined(voice)) {
                    return [voice];
                } else {
                    return [...needed].flatMap(mapToNearby(previous[0].voices[voicePart]));
                }
            };
            const compare = (note: AbsoluteNote) => (one: AbsoluteNote, two: AbsoluteNote) => Math.abs(note.midi - one.midi) - Math.abs(note.midi - two.midi);
            //try smaller intervals first
            sopranoNotes = get(0).sort(compare(previous[0].voices[0]));
            altoNotes = get(1).sort(compare(previous[0].voices[1]));
            tenorNotes = get(2).sort(compare(previous[0].voices[2]));
            if(reconciledConstraint.voices[3] == undefined) {
                bassNotes = mapToNearby(previous[0].voices[3])(bassNote).sort(compare(previous[0].voices[3]));
            } else {
                bassNotes = [reconciledConstraint.voices[3]];
            }
        } else {
            const get = (needed: Note[]) => (voicePart: number) => {
                let voice = reconciledConstraint.voices[voicePart];
                if(isDefined(voice)) {
                    return [voice];
                } else {
                    const low = voiceRange[voicePart][1].octavePosition;
                    const high = voiceRange[voicePart][2].octavePosition + 1;
                    const middle = (voiceRange[voicePart][1].midi + voiceRange[voicePart][2].midi) / 2;
                    return [...needed]
                        .flatMap(note => [...Array(high - low).keys()]
                        .map((i) => new AbsoluteNote(note.letterName + Accidental.toString(note.accidental) + (i + low))))
                        .sort((first, second) => Math.abs(first.midi - middle) - Math.abs(second.midi - middle));
                }
            };
            sopranoNotes = get(needed)(0);
            altoNotes = get(needed)(1);
            tenorNotes = get(needed)(2);
            bassNotes = get([bassNote])(3);
        }
        //TODO make more efficient by following doubling rules outright
        for(const bass of bassNotes) {
            for(const soprano of sopranoNotes) {
                for(const alto of altoNotes) {
                    for(const tenor of tenorNotes) {
                        const voicing = new CompleteChord([soprano, alto, tenor, bass], reconciledConstraint.romanNumeral, reconciledConstraint.flags);
                        if(previous.length) {
                            if(PartWriting.Rules.testAll(this.params, [voicing, ...previous])) {
                                yield voicing;
                            }
                        } else {
                            if(PartWriting.Rules.testSingular(this.params, voicing)) {
                                yield voicing;
                            }
                        }
                    }
                }
            }
        }
    }

}

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
    export function extendDefaultParameters<T extends PartWritingRules, U extends PartWritingPreferences>({ newRules, newPreferences, newSingularRules, newRuleParameters, newSingularPreferences, newPreferencesOrdering, newYieldOrdering }: {
        newRules?: T;
        newPreferences?: U;
        newSingularRules?: (keyof T)[];
        newRuleParameters?: Partial<{[ruleName in keyof RuleUnion<T>]: Parameters<RuleUnion<T>[ruleName]>[0] | boolean}>;
        newSingularPreferences?: (keyof U)[];
        newPreferencesOrdering?: (keyof PreferencesUnion<U>)[];
        newYieldOrdering?: (iterator: NestedIterable<CompleteChord[]>, previous: CompleteChord[], params: PartWritingParameters) => NestedIterable<CompleteChord[]>;
    } = {}) {
        return {
            rules: {...defaultPartWritingParameters.rules, ...(newRules || {})},
            singularRules: [...defaultPartWritingParameters.singularRules, ...(newSingularRules || [])],
            ruleParameters: {...defaultPartWritingParameters.ruleParameters, ...(newRuleParameters || {})},
            preferences: {...defaultPartWritingParameters.preferences, ...(newPreferences || {})},
            singularPreferences: [...defaultPartWritingParameters.singularPreferences, ...(newSingularPreferences || [])],
            preferencesOrdering: [...(newPreferencesOrdering || defaultPartWritingParameters.preferencesOrdering)],
            yieldOrdering: newYieldOrdering || defaultPartWritingParameters.yieldOrdering
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
            export function range(settings: {ranges: AbsoluteNote[][]}, { voices }: IChord) {
                for (const [range, toCheck] of zip(settings.ranges || voiceRange, voices) as [AbsoluteNote[], AbsoluteNote | undefined][]) {
                    if(!toCheck) {
                        continue;
                    }
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
            export function spelling(_: undefined, {romanNumeral, intervals, voices}: IChord) {
                if(!romanNumeral || !intervals) {
                    return true;
                }
                if(!intervals.filter(isDefined).every(interval => romanNumeral.intervals.map(interval => interval.name).includes(interval.name))) {
                    return false;
                }
                const bass = voices[voices.length - 1];
                if(!bass) {
                    return true;
                }
                return bass.simpleName === romanNumeral.inversionInterval.transposeUp(romanNumeral.root).name;
            }

            /**
             * Checks that the chord does not double the leading tone
             * @param chord the chord to check
             */
            export function leadingToneDoubling(_: undefined, {romanNumeral, intervals, flags}: IChord) {
                if(flags?.sequence) {
                    return true;
                }
                if(!romanNumeral || !intervals) {
                    return true;
                }
                if (romanNumeral.name.startsWith('V')) {
                    if (intervals.filter(Interval.ofSize('3')).length > 1) {
                        return false;
                    }
                } else if(romanNumeral.name.startsWith('viio')) {
                    if (intervals.filter(Interval.ofSize('U')).length > 1) {
                        return false;
                    }
                }
                return true;
            }

            /**
             * Checks that the chord does not double the seventh
             * @param chord the chord to check
             */
            export function seventhDoubling(_: undefined, {romanNumeral, intervals}: IChord) {
                if(!intervals) {
                    return true;
                }
                if (romanNumeral?.hasSeventh) {
                    if (intervals.filter(Interval.ofSize('7')).length > 1) {
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
            export function completeness(_: undefined, chord: IChord, prev?: IChord) {
                if(!chord.romanNumeral || !chord.intervals) {
                    return true;
                }
                if(!chord.voices.length || !chord.voices.every(isDefined)) {
                    return true;
                }
                const definedIntervals = chord.intervals.filter(isDefined);
                if(numVoicesWithInterval(definedIntervals, 'U') == 0) {
                    return false;
                }
                if(numVoicesWithInterval(definedIntervals, '3') == 0) {
                    return false;
                }
                if (chord.romanNumeral.hasSeventh) {
                    if(numVoicesWithInterval(definedIntervals, '7') == 0) {
                        return false;
                    }
                    // can leave out fifth of root position 7
                    if (chord.romanNumeral.inversionInterval.simpleSize != 'U') {
                        return numVoicesWithInterval(definedIntervals, '5') >= 1;
                    }
                } else {
                    if (chord.romanNumeral.inversionInterval.simpleSize =='U') {
                        if(!prev || !prev.romanNumeral || !prev.intervals) {
                            return true;
                        }
                        // can leave out fifth if preceded by complete V7
                        if(prev.romanNumeral.symbol != 'V' || !prev.romanNumeral.hasSeventh || numVoicesWithInterval(prev.intervals.filter(isDefined), '5') == 0) {
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
            export function spacingAndCrossing(_: undefined, {voices}: IChord) {
                let i = 0;
                for(i = 0; i < voices.length - 2; i ++) {
                    const higherVoice = voices[i];
                    const lowerVoice = voices[i + 1];
                    if(!higherVoice || !lowerVoice) {
                        continue;
                    }
                    if (higherVoice.midi - lowerVoice.midi > 12) {
                        return false;
                    }
                    if (higherVoice.midi < lowerVoice.midi) {
                        return false;
                    }
                }
                const higherVoice = voices[i];
                const lowerVoice = voices[i + 1];
                if(!higherVoice || !lowerVoice) {
                    return true;
                }
                if (higherVoice.midi < lowerVoice.midi) {
                    return false;
                }
                return true;
            }

            /**
             * Checks that a accented (cadential) 64 does not double the tonic
             * @param chord 
             */
            export function accented64Doubling(_: undefined, {romanNumeral, intervals}: IChord) {
                if(!romanNumeral || !intervals) {
                    return true;
                }
                if (romanNumeral.inversion === 2 && romanNumeral.hasSeventh === false) {
                    if (intervals.filter(Interval.ofSize('U')).length > 1) {
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
            export function parallels(_: undefined, {voices: currVoices}: IChord, {voices: prevVoices}: IChord) {
                const pairings = [
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [1, 2],
                    [1, 3],
                    [2, 3],
                ];
                return !(pairings
                    .map(([upper, lower]) => [prevVoices[upper], prevVoices[lower], currVoices[upper], currVoices[lower]])
                    .filter(voices => voices.every(isDefined)) as AbsoluteNote[][])
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
            export function contraryFifths(_: undefined, {voices: currVoices}: IChord, {voices: prevVoices}: IChord) {
                const pairings = currVoices.flatMap((_, outerIndex) => currVoices.map((_, innerIndex) => [outerIndex, innerIndex])).filter(([one, two]) => one < two);
                return !((pairings
                    .map(([upper, lower]) => [prevVoices[upper], prevVoices[lower], currVoices[upper], currVoices[lower]])
                    .filter(voices => voices.every(isDefined)) as AbsoluteNote[][])
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
            export function hiddenFifths(_: undefined, {voices: currVoices}: IChord, {voices: prevVoices, romanNumeral}: IChord) {
                const bassVoice = currVoices[currVoices.length - 1];
                const sopranoVoice = currVoices[0];
                const oldBassVoice = prevVoices[prevVoices.length - 1];
                const oldSopranoVoice = prevVoices[0];
                if(!bassVoice || !sopranoVoice || !oldBassVoice || !oldSopranoVoice) {
                    return true;
                }
                let interval = new ComplexInterval(bassVoice, sopranoVoice);
                if(interval.name == 'P5' && Motion.from(oldBassVoice, bassVoice, oldSopranoVoice, sopranoVoice) == Motion.SIMILAR) {
                    if(!romanNumeral) {
                        return true;
                    }
                    if(!romanNumeral.name.startsWith('V') && new Interval(romanNumeral.root, oldSopranoVoice).simpleSize != '3' && new Interval(oldSopranoVoice, sopranoVoice).name != 'm2') {
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
            export function voiceOverlap(_: undefined, {voices: currVoices}: IChord, {voices: prevVoices}: IChord) {
                for(let i = 0; i < currVoices.length - 1; i++) {
                    const lower = currVoices[i+1];
                    const upper = currVoices[i];
                    const oldLower = prevVoices[i+1];
                    const oldUpper = prevVoices[i];
                    if(upper && oldLower && upper.midi < oldLower.midi) {
                        return false;
                    }
                    if(oldUpper && lower && oldUpper.midi < lower.midi) {
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
            export function leadingToneResolution(settings: { frustratedLeadingTone: boolean }, {voices: currVoices, romanNumeral: currRomanNumeral, flags}: IChord, {voices: prevVoices, romanNumeral: prevRomanNumeral, intervals}: IChord) {
                if(flags?.sequence) {
                    return true;
                }
                //TODO delayed resolution
                if(!prevRomanNumeral || !currRomanNumeral || !intervals) {
                    return true;
                }
                if (prevRomanNumeral.symbol == 'V' && !(currRomanNumeral.symbol == 'V' || currRomanNumeral.symbol == 'viio')) {
                    const index = intervals.findIndex(Interval.ofSize('3'));
                    const prevVoice = prevVoices[index];
                    const currVoice = currVoices[index];
                    if(!prevVoice || !currVoice) {
                        return true;
                    }
                    if (new Interval(prevVoice, currVoice).simpleSize !== '2') {
                        if(prevVoice.midi < currVoice.midi) {
                            return false;
                        }
                        if(settings.frustratedLeadingTone) {
                            return false;
                        }
                        let resolvedInUpper = false;
                        for(let i = 0; i < index; i++) {
                            const upperVoice = currVoices[i];
                            if(!upperVoice) {
                                return true;
                            }
                            if(new Interval(prevVoice, currVoice).simpleSize === '2') {
                                resolvedInUpper = true;
                                break;
                            }
                        }
                        if(!resolvedInUpper) {
                            return false;
                        }
                    }
                } else if(prevRomanNumeral.symbol == 'viio' && !(currRomanNumeral.symbol == 'V' || currRomanNumeral.symbol == 'viio')) {
                    const index = intervals.findIndex(Interval.ofSize('U'));
                    const prevVoice = prevVoices[index];
                    const currVoice = currVoices[index];
                    if(!prevVoice || !currVoice) {
                        return true;
                    }
                    if (index === -1 || new Interval(prevVoice, currVoice).simpleSize != '2') {
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
            export function seventhPreparation(_: undefined, {intervals, romanNumeral: currRomanNumeral, voices: currVoices}: IChord, {romanNumeral: prevRomanNumeral, voices: prevVoices}: IChord) {
                if(!prevRomanNumeral || !currRomanNumeral?.hasSeventh) {
                    return true;
                }
                if(prevRomanNumeral.root === currRomanNumeral.root && prevRomanNumeral.hasSeventh) {
                    return true;
                }
                if (currRomanNumeral.symbol == 'V') {
                    return true;
                }
                if(!intervals) {
                    return true;
                }
                const index = intervals.findIndex(Interval.ofSize('7'));
                if(index === -1) {
                    return true;
                }
                const oldVoice = prevVoices[index];
                const voice = currVoices[index];
                if(!oldVoice || !voice) {
                    return true;
                }
                try {
                    const interval = new Interval(oldVoice, voice).simpleSize;
                    if(interval === 'U' || interval === '2') {
                        return true;
                    }
                } catch {}
                try {
                    const interval = new Interval(oldVoice, voice).simpleSize;
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
            export function seventhResolution(settings: { scope: number }, chord: IChord, prev: IChord, ...before: IChord[]) {
                //V42 can support 3 4 5
                if (before[0]
                    && before[0].romanNumeral?.symbol.toLowerCase() == 'i'
                    && before[0].romanNumeral?.inversionInterval.simpleSize == 'U'
                    && prev.romanNumeral?.symbol == 'V'
                    && prev.romanNumeral?.inversionInterval.simpleSize == '5'
                    && prev.romanNumeral?.hasSeventh
                    && chord.romanNumeral?.symbol.toLowerCase() == 'i'
                    && chord.romanNumeral?.inversionInterval.simpleSize == '3'
                ) {
                    const index = prev.intervals?.findIndex(Interval.ofSize('7'));
                    if(index
                        && index !== -1
                        && before[0].intervals
                        && prev.intervals
                        && chord.intervals
                        && before[0].intervals[index]?.simpleSize === '3'
                        && prev.intervals[index]?.simpleSize === '3'
                        && chord.intervals[index]?.simpleSize === '3'
                    ) {
                            return true;
                    }
                }
                // TODO O(n) check - is there a better way?
                // TODO resolution needs to be enforced at end
                const seventhChecks = [chord, prev, ...before];
                for(let i = 1; i < settings.scope; i++) {
                    const romanNumeral = seventhChecks[i].romanNumeral;
                    const intervals = seventhChecks[i].intervals;
                    if(!romanNumeral || !intervals) {
                        continue;
                    }
                    if(romanNumeral.hasSeventh) {
                        const index = intervals.findIndex(Interval.ofSize('7'));
                        const oldVoice = seventhChecks[i].voices[index];
                        if(!oldVoice) {
                            continue;
                        }
                        for(let j = i - 1; j >= 0; j--) {
                            const voice = seventhChecks[j].voices[index];
                            if(!voice) {
                                continue;
                            }
                            if(new Interval(voice, oldVoice).simpleSize === 'U') {
                                continue;
                            }
                            if (new Interval(voice, oldVoice).simpleSize !== '2') {
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
            export function diminishedFifthResolution(_: undefined, chord: IChord, prev: IChord, ...before: IChord[]) {
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
            export function invalidIntervals(_: undefined, {voices: currVoices}: IChord, {voices: prevVoices}: IChord) {
                for(let index = 0; index < prevVoices.length; index++) {
                    const oldVoice = prevVoices[index];
                    const voice = currVoices[index];
                    if(!oldVoice || !voice) {
                        continue;
                    }
                    const interval = new Interval(oldVoice, voice);
                    if(interval.simpleSize == '2' && interval.quality == IntervalQuality.AUGMENTED) {
                        return false;
                    } else if(interval.simpleSize == '7' && interval.quality == IntervalQuality.DIMINISHED) {
                        return false;
                    }

                    const difference = Math.abs(oldVoice.midi - voice.midi);
                    if(difference > 7 && !(index === 3 && interval.simpleSize === 'U' && interval.quality === IntervalQuality.PERFECT && oldVoice.midi - voice.midi > 0)) {
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
            export function accented64Preparation(_: undefined, {romanNumeral, voices: currVoices}: IChord, {voices: prevVoices}: IChord) {
                if (romanNumeral && romanNumeral.inversion === 2 && romanNumeral.hasSeventh === false) {
                    const fourthVoice = currVoices.findIndex(note => note && new Interval(romanNumeral.root, note).simpleSize === 'U');
                    if(fourthVoice === -1) {
                        return true;
                    }
                    const fourthNote = currVoices[fourthVoice];
                    const fourthPrep = prevVoices[fourthVoice];
                    if(!fourthNote || !fourthPrep) {
                        return true;
                    }
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
            export function accented64Resolution(_: undefined, {romanNumeral: currRomanNumeral, voices: currVoices}: IChord, {romanNumeral: prevRomanNumeral, voices: prevVoices}: IChord) {
                if (prevRomanNumeral && prevRomanNumeral.inversion === 2 && prevRomanNumeral.hasSeventh === false) {
                    if(currRomanNumeral && currRomanNumeral.root.simpleName !== prevRomanNumeral.inversionInterval.transposeUp(prevRomanNumeral.root).simpleName) {
                        return true;
                    }
                    const fourthVoice = prevVoices.findIndex(note => note && new Interval(prevRomanNumeral.root, note).simpleSize === 'U');
                    if(fourthVoice === -1) {
                        return true;
                    }
                    const fourthNote = prevVoices[fourthVoice];
                    const fourthResolution = currVoices[fourthVoice];
                    if(!fourthNote || !fourthResolution) {
                        return true;
                    }
                    try {
                        if(new ComplexInterval(fourthResolution, fourthNote).complexSize !== '2') {
                            return false;
                        }
                    } catch {
                        return false;
                    }
                    let sixthResolves = false;
                    for (let voice = 0; voice < currVoices.length; voice++) {
                        const note = prevVoices[voice];
                        if(!note) {
                            return true;
                        }
                        if(new Interval(prevRomanNumeral.root, note).simpleSize !== '3') {
                            continue;
                        }
                        const sixthNote = prevVoices[voice];
                        const sixthResolution = currVoices[voice];
                        if(!sixthNote || !sixthResolution) {
                            return true;
                        }
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

            export function cadenceType(_: undefined, {flags, romanNumeral: currRomanNumeral, voices: currVoices}: IChord, {romanNumeral: prevRomanNumeral}: IChord) {
                if(!currRomanNumeral || !prevRomanNumeral) {
                    return true;
                }
                if(flags.pac) {
                    if(Scale.getNotesOfScale(currRomanNumeral.scale) !== Scale.getNotesOfScale(prevRomanNumeral.scale)) {
                        return false;
                    }
                    if(currRomanNumeral.name.toLowerCase() !== 'i' || (prevRomanNumeral.name !== 'V' && prevRomanNumeral.name !== 'V7')) {
                        return false;
                    }
                    if(!currVoices[0]) {
                        return true;
                    }
                    if(new Interval(currRomanNumeral.root, currVoices[0]).simpleSize !== 'U') {
                        return false;
                    }
                } else if(flags.iac) {
                    if(Scale.getNotesOfScale(currRomanNumeral.scale) !== Scale.getNotesOfScale(prevRomanNumeral.scale)) {
                        return false;
                    }
                    // for our uses an IAC is V-I without 1 in the soprano
                    if(currRomanNumeral.name.toLowerCase() !== 'i' || (prevRomanNumeral.name !== 'V' && prevRomanNumeral.name !== 'V7')) {
                        return false;
                    }
                    if(!currVoices[0]) {
                        return true;
                    }
                    if(new Interval(currRomanNumeral.root, currVoices[0]).simpleSize === 'U') {
                        return false;
                    }
                } else if(flags.hc) {
                    if(Scale.getNotesOfScale(currRomanNumeral.scale) !== Scale.getNotesOfScale(prevRomanNumeral.scale)) {
                        return false;
                    }
                    if(currRomanNumeral.name !== 'V') {
                        return false;
                    }
                } else if(flags.dc) {
                    if(Scale.getNotesOfScale(currRomanNumeral.scale) !== Scale.getNotesOfScale(prevRomanNumeral.scale)) {
                        return false;
                    }
                    if((currRomanNumeral.name.toLowerCase() === 'i' || currRomanNumeral.name.toLowerCase() === 'V' || currRomanNumeral.name.toLowerCase() === 'vii') || (prevRomanNumeral.name !== 'V' && prevRomanNumeral.name !== 'V7')) {
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
            export function sequence(_: undefined, {flags: currFlags, voices: currVoices, romanNumeral: currRomanNumeral}: IChord, _middle: IChord, prev: IChord) {
                if(!prev) {
                    return true;
                }
                const {flags: prevFlags, romanNumeral: prevRomanNumeral, voices: prevVoices} = prev;
                if(currFlags.sequence && prevFlags.sequence) {
                    for(let index = 0; index < currVoices.length; index++) {
                        if(!currRomanNumeral || !prevRomanNumeral) {
                            continue;
                        }
                        const oldVoice = prevVoices[index];
                        const voice = currVoices[index];
                        if(!oldVoice || !voice) {
                            return true;
                        }
                        if(new Interval(currRomanNumeral.root, prevRomanNumeral.root).simpleSize !== new Interval(voice, oldVoice).simpleSize) {
                            return false;
                        }
                    }
                }
                return true;
            }


            //TODO better way?
            export function rapidKeyChange({scope}: {scope: number}, chord: IChord, ...prev: IChord[]) {
                if(chord.flags.pivot) {
                    for(let i = 0; i < prev.length && i < scope; i ++) {
                        if(prev[i].flags.pivot) {
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
        export function *checkAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chords: IChord[]): Generator<keyof T> {
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
        export function testAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chords: IChord[]) {
            return checkAll(parameters, chords).next().value === undefined;
        }

        /**
         * Checks a singular chord and returns the index of the failing
         * @param parameters 
         * @param chordToCheck 
         */
        export function *checkSingular<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: IChord): Generator<keyof T> {
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
        export function testSingular<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: IChord) {
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
            export function checkDoubling(chord: CompleteChord) {
                if(chord.romanNumeral.hasSeventh) {
                    if(numVoicesWithInterval(chord.intervals, '5') == 0) {
                        //prefer root doubled if no fifth
                        if(numVoicesWithInterval(chord.intervals, 'U') != 2) {
                            return -2;
                        }
                        return -1;
                    }
                } else {
                    if(numVoicesWithInterval(chord.intervals, '5') == 0 && chord.romanNumeral.inversionInterval.simpleSize == 'U') {
                        //prefer root tripled if no fifth
                        if(numVoicesWithInterval(chord.intervals, 'U') != 3) {
                            return -2;
                        }
                        return -1;
                    } else if(chord.romanNumeral.inversionInterval.simpleSize == 'U') {
                        //root position prefer double root
                        if(numVoicesWithInterval(chord.intervals, 'U') != 2) {
                            return -1;
                        }
                    } else if(chord.romanNumeral.inversionInterval.simpleSize == '3') {
                        //first inversion any can be doubled
                    } else {
                        //second inversion prefer doubling fifth
                        if(numVoicesWithInterval(chord.intervals, '5') != 2) {
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
            export function checkVoiceCrossing(chord: CompleteChord) {
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
            export function checkRange(chord: CompleteChord) {
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
            export function checkSharedPitch(chord: CompleteChord) {
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
            export function checkSequence(chord: CompleteChord) {
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
            export function checkVoiceOverlap(chord: CompleteChord, prev: CompleteChord) {
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
            export function checkVoiceDisjunction(chord: CompleteChord, prev: CompleteChord) {
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
            export function checkBassOctaveJump(chord: CompleteChord, prev: CompleteChord) {
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
                } else {
                    try {
                        if(new ComplexInterval(chord.voices[chord.voices.length-1], prev.voices[chord.voices.length-1]).name === 'P8') {
                            return -1;
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
            export function checkRepetition(chord: CompleteChord, previous: CompleteChord) {
                // TODO remove
                return chord.romanNumeral.name === previous.romanNumeral.name ? 0 : 1;
            }

            /**
             * Prefers that a pivot chord has a predominant function in the new key
             */
            export function modulationToPredominant(chord: CompleteChord){
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
            export function fewerModulations(chord: CompleteChord){
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
        export function evaluateSingle<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: CompleteChord): number[] {
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
        export function lazyEvaluateSingle<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: CompleteChord): number[] {
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
        export function evaluateAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: CompleteChord, prev: CompleteChord): number[] {
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
        export function lazyEvaluateAll<T extends PartWritingRules, U extends PartWritingPreferences>(parameters: PartWritingParameters<T, U>, chordToCheck: CompleteChord, prev: CompleteChord): number[] {
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
        },
        rapidKeyChange: {
            scope: 3
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
    ],
    // yieldOrdering: (iterator) => iterator,
    yieldOrdering: (iterator, previous, partWritingParams) => minGenerator(iterator, result => (previous.length ? PartWriting.Preferences.lazyEvaluateAll : PartWriting.Preferences.lazyEvaluateSingle)(partWritingParams, result[0], previous[0]), arrayComparator),
};