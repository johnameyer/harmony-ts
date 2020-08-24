import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { ProgressionPredicate, ProgressionProducer, Progression } from "./progression";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { isDefined } from "../util";
import { Expansion, ExpansionOperator } from "./expansion";
import { Interval } from "../interval/interval";
import { Key } from "../key";
import { makePeekableIterator } from "../util/make-peekable-iterator";
import { NestedIterable } from "../util/nested-iterable";

/**
* 
* TODO does not need to be symmetric
*/
function reconcileConstraints(one: HarmonizedChord, two: IncompleteChord) {
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
    return new HarmonizedChord({romanNumeral, voices, flags});
}

/**
 * The parameters that the harmonizer uses
 */
export interface HarmonyParameters {
    /**
     * The roman numeral to begin on
     * Should agree with the initial constraint
     */
    start?: string;

    /**
     * The chords that are enabled if using progressions
     */
    enabledProgressions?: [ProgressionPredicate, ProgressionProducer][];

    /**
     * The expansions that are enabled if using progressions
     */
    enabledExpansions?: ExpansionOperator[];

    /*
    * If not greedy, the depth at which to sum through for comparisons
    * TODO?
    */
    // depth?: boolean;

    /**
     * Whether to check against the internal progressions or use as-is
     * Requires complete roman numerals
     * Will still prefer using sequences from internal progressions
     */
    useProgressions?: boolean;

    /*
     * Choose the least terrible of the failures, if not possible
     */
    // goodEnough?: boolean;

    /**
     * Whether or not to modulate
     * Defaults to falsy
     */
    canModulate?: boolean;

    /**
     * If enabled, the key areas that are allowed to modulate to
     * E.g. P5 in C major would allow to go to G major and back
     */
    modulationsAllowed?: Interval[];

    /**
     * Whether a cadence needs to happen in a key before the next modulation
     * Helps to reduce the search space
     */
    // modulateBeforeCadence: boolean;

    /**
     * Force the harmonizer to explore a certain number of children fully through at each level
     * Results in exponential time complexity
     */
    // forceSelection: number;

    /**
     * Force the harmonizer to explore a certain number of top-level options
     */
    // initOptions: number;

    /**
     * Whether to run the checks beforehand to see if the constraints are possible to satisfy
     * false is the 'old' behavior resulting in exponential backtracking for failure
     */
    // prechecks: boolean;
}

export namespace Harmony {
    export type CompleteHarmonyGenerator = NestedIterable<HarmonizedChord[]>;

    /**
     * Find the next possible chord to progress to (with modulations and expansions between) without looking at the constraints
     * @param params the params to generate harmony using
     * @param previous the previous chords
     */
    export function * nextHarmony(params: HarmonyParameters, constraints: IncompleteChord[], previous: HarmonizedChord[]) {
        if(previous.length >= constraints.length) {
            return;
        }
        if(!params.useProgressions) {
            const constraint = constraints[previous.length];
            if(constraint.romanNumeral) {
                // @ts-ignore
                yield [new HarmonizedChord({...constraint})];
            }
        }

        // Get options available to us from current chord
        const progressions = params.enabledProgressions || Progression.defaultProgressions;
        const scale = constraints[previous.length].romanNumeral?.scale || previous[0].romanNumeral.scale;
        let options = [...Progression.matchingProgressions(scale, previous, progressions)];
        // console.log('Previous are', previous.slice().reverse().map(chord => chord.romanNumeral.name).join(' '));
        // console.log('Options are', options.map(option => '[' + option.map(chord => chord.romanNumeral?.name).join(' ') + ']').join(' '));

        if(params.canModulate && !constraints[previous.length].romanNumeral?.scale) {
            const oldScale = previous[0].romanNumeral.scale;
            let modulationsAllowed = params.modulationsAllowed;

            const majorAndMinor = (key: Key) => [[key, Scale.Quality.MAJOR], [key, Scale.Quality.MINOR]] as Scale[];
            const possibleScales = modulationsAllowed ? modulationsAllowed.map(modulation => Key.fromString(modulation.transposeUp(Key.toNote(oldScale[0])).name)).flatMap(majorAndMinor) : Key.names.map(Key.fromString).flatMap(majorAndMinor);

            // TODO remove options of multiple length?
            options.push(...options.filter(option => option.length === 1)
                .flatMap(option => possibleScales.map(scale => {
                    if(scale === option[0].romanNumeral.scale) {
                        return undefined;
                    }
                    const romanNumeral = option[0].romanNumeral.relativeToScale(scale);
                    if(romanNumeral) {
                        const flags = {...option[0].flags};
                        flags.pivot = true;
                        return [new HarmonizedChord({...option[0], flags, romanNumeral})];
                    }
                    return undefined;
                }))
                .filter(isDefined));
                // console.log('Pivoted options are', options.map(option => '[' + option.map(chord => chord.romanNumeral?.name).join(' ') + ']').join(' '));
        }

        //use expansions
        const expansions = params.enabledExpansions || Expansion.defaultExpansions;
        let expandedOptions = options.flatMap(option => [...Expansion.matchingExpansion(scale, previous, option, expansions)]);
        // TODO option chaining
        expandedOptions.sort((a, b) => b.length - a.length);
        // TODO remove duplicates
        // console.log('Applied options are', expandedOptions.map(option => '[' + option.map(chord => chord.romanNumeral?.name).join(' ') + ']').join(' '));
        for(let option of expandedOptions) {
            if(previous.length + option.length <= constraints.length) {
                yield option;
            }
        }
    }

    /**
     * Find the next possible chord to progress to (with modulations and expansions between) checking that constraints can be satisfied
     * @param params the params to generate harmony using
     * @param previous the previous chords
     */
    export function * matchingHarmony(params: HarmonyParameters, constraints: IncompleteChord[], previous: HarmonizedChord[]) {
        if(previous.length >= constraints.length) {
            return;
        }
        for(const option of nextHarmony(params, constraints, previous)) {
            let index = 0;
            for(; index < option.length; index++) {
                const reconciled = reconcileConstraints(option[index], constraints[previous.length + index]);
                if(reconciled === null) {
                    break;
                }
                option[index] = reconciled;
            }
            if(index === option.length) {
                // console.log('Yielded ', option.map(chord => chord.romanNumeral?.name).join(' '));
                yield option;
            }
        }
    }

    /**
     * Finds the next possible complete harmonization of the constraints (with using the previous chords)
     * @param params the params to harmonize using
     * @param constraints the constraints to match against
     * @param previous the chords before this one
     */
    export function * matchingCompleteHarmonyWithContext(params: HarmonyParameters, constraints: IncompleteChord[], previous: HarmonizedChord[]): CompleteHarmonyGenerator {
        if(previous.length >= constraints.length) {
            return;
        }
        for(let match of matchingHarmony(params, constraints, previous)){
            // TODO consider doing something to prevent re-evaluation of first item
            const recurse = makePeekableIterator(matchingCompleteHarmonyWithContext(params, constraints, [...[...match].reverse(), ...previous]));
            if(recurse.hasItems || match.length + previous.length === constraints.length) {
                yield [match, recurse];
            }
        }
    }

    /**
     * Finds the next possible complete harmonization of the constraints
     * @param params the params to harmonize using
     */
    export function * matchingCompleteHarmony(params: HarmonyParameters, constraints: IncompleteChord[], scale: Scale): CompleteHarmonyGenerator {
        if(constraints.length === 0) {
            return;
        }
        const start = new RomanNumeral(params.start || constraints[0].romanNumeral?.name || 'I',  scale);

        const chord = reconcileConstraints(new HarmonizedChord({romanNumeral: start}), constraints[0]);
        if(chord === null) {
            return;
        }
        const recurse = makePeekableIterator(matchingCompleteHarmonyWithContext(params, constraints, [chord]));
        if(recurse.hasItems || constraints.length === 1) {
            yield [[chord], recurse];
        }
    }
}