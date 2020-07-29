import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Note } from "../note/note";
import { PartWriting, PartWritingParameters, voiceRange, PartWritingRules, defaultPartWritingParameters, PartWritingPreferences } from "./part-writing";
import { ProgressionPredicate, ProgressionProducer, Progression } from "./progression";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Accidental } from "../accidental";
import { isDefined } from "../util";
import { Expansion, ExpansionOperator } from "./expansion";
import { minGenerator } from '../util/min-generator';
import { Interval } from "../interval/interval";
import { Key } from "../key";

const arrayComparator = <T>(a: T[], b: T[]) => {
    for(let i = 0; i < a.length && i < b.length; i++) {
        if(a[i] > b[i]){
            return -1;
        } else if(a[i] < b[i]) {
            return 1;
        }
    }
    return 0;
}

/**
* 
* TODO does not need to be symmetric
*/
function reconcileConstraints(one: IncompleteChord, two: IncompleteChord) {
    const compatible = <T>(one: T | undefined, two: T | undefined) => !one || !two || one == two;
    for(let voicePart in one.voices) {
        if(!compatible(one.voices[voicePart]?.name, two.voices[voicePart]?.name)) {
            return null;
        }
    }
    
    if(!compatible(one.root?.name, two.root?.name)) {
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
        // TODO one should always have root in this case
        const oneNotes = one.romanNumeral?.intervals.map(interval => one.root ? interval.transposeUp(one.root).simpleName : undefined);
        if(!two.voices.filter(isDefined).every(note => oneNotes.includes(note.simpleName))){
            return null;
        }
    } else if(two.romanNumeral) {
        const twoNotes = two.romanNumeral?.intervals.map(interval => two.root ? interval.transposeUp(two.root).simpleName : undefined);
        if(!one.voices.filter(isDefined).every(note => twoNotes.includes(note.simpleName))){
            return null;
        }
    }
    
    const romanNumeral = one.romanNumeral || two.romanNumeral;
    const voices = [...new Array(Math.max(one.voices.length, two.voices.length))].map((_, index) => one.voices[index] || two.voices[index]);
    const flags = {...(one.flags || {}), ...(two.flags || {})};
    return new IncompleteChord({romanNumeral, voices, flags});
}

function *findSolutions(reconciledConstraint: IncompleteChord, previous?: HarmonizedChord) {
    const mapToNearby = (previous: AbsoluteNote) => (note: Note) => [
        new AbsoluteNote(note.name + [previous.octavePosition + 1]),
        new AbsoluteNote(note.name + [previous.octavePosition]),
        new AbsoluteNote(note.name + [previous.octavePosition - 1]),
    ];
    
    if(!reconciledConstraint.romanNumeral) {
        return;
    }
    const needed = reconciledConstraint.romanNumeral.intervals.map(interval => reconciledConstraint.root ? interval.transposeUp(reconciledConstraint.root) : undefined).filter(isDefined);
    let bassNote = reconciledConstraint.romanNumeral.inversionInterval.transposeUp(reconciledConstraint.romanNumeral.root);
    
    let sopranoNotes, altoNotes, tenorNotes, bassNotes;
    if(previous) {
        const get = (voicePart: number) => {
            let voice = reconciledConstraint.voices[voicePart];
            if(isDefined(voice)) {
                return [voice];
            } else {
                return [...needed].flatMap(mapToNearby(previous.voices[voicePart]));
            }
        };
        const compare = (note: AbsoluteNote) => (one: AbsoluteNote, two: AbsoluteNote) => Math.abs(note.midi - one.midi) - Math.abs(note.midi - two.midi);
        //try smaller intervals first
        sopranoNotes = get(0).sort(compare(previous.voices[0]));
        altoNotes = get(1).sort(compare(previous.voices[1]));
        tenorNotes = get(2).sort(compare(previous.voices[2]));
        if(reconciledConstraint.voices[3] == undefined) {
            bassNotes = mapToNearby(previous.voices[3])(bassNote).sort(compare(previous.voices[3]));
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
                    yield [soprano, alto, tenor, bass];
                }
            }
        }
    }
}

/**
 * The parameters that the harmonizer uses
 */
export interface HarmonyParameters<T extends PartWritingRules = typeof defaultPartWritingParameters.rules, U extends PartWritingPreferences = typeof defaultPartWritingParameters.preferences> {
    /**
     * The roman numeral to begin on
     * Should agree with the initial constraint
     */
    start?: string;

    /**
     * The data to build the harmony around
     */
    constraints: IncompleteChord[];

    /**
     * The scale to start with
     */
    scale: Scale;

    /**
     * The chords that are enabled if using progressions
     */
    enabledProgressions?: [ProgressionPredicate, ProgressionProducer][];

    /**
     * The expansions that are enabled if using progressions
     */
    enabledExpansions?: ExpansionOperator[];

    /**
     * Whether to ignore preferences and just choose the first option that is valid
     */
    greedy?: boolean;

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
     * The settings to run the part-writing rule checks under
     */
    partWritingParameters?: PartWritingParameters<T, U>;

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

/**
 * The progressions that are enabled by the harmonizer by default
 */
export const defaultProgressions = [...Progression.Major.identity, ...Progression.Major.basic, ...Progression.Major.basicInversions, ...Progression.Major.dominantSevenths, ...Progression.Major.basicPredominant, ...Progression.Major.subdominantSevenths, ...Progression.Major.submediant, ...Progression.Major.tonicSubstitutes, ...Progression.Major.secondaryDominant];

/**
 * The expansions that are enabled by the harmonizer by default
 */
export const defaultExpansions = [...Expansion.identity, ...Expansion.basic, ...Expansion.basicInversions, ...Expansion.dominantInversions, ...Expansion.subdominant, ...Expansion.cadential64, ...Expansion.submediant, ...Expansion.tonicSubstitutes, ...Expansion.secondaryDominant, ...Expansion.secondaryDominants, ...Expansion.sequences, ...Expansion.otherSeventhChords];

/**
 * The result of a harmonization
 */
export interface HarmonyResult {
    /**
     * The generated solution, or null if could not resolve based on the parameters
     */
    solution: HarmonizedChord[] | null;

    /**
     * The furthest in the constraints the harmonizer made it
     */
    furthest: number;
}

export namespace Harmony {
    function * getOptions(params: HarmonyParameters, previous: HarmonizedChord[]) {
        if(!params.useProgressions && params.constraints[previous.length]) {
            yield [new IncompleteChord({})];
        }

        // Get options available to us from current chord
        const progressions = params.enabledProgressions || defaultProgressions;
        const scale = params.constraints[previous.length].romanNumeral?.scale || previous[0].romanNumeral.scale;
        let options = progressions.filter(([predicate, _]) => predicate(scale, previous)).flatMap(([_, producer]) => producer(scale, previous));
        
        if(params.canModulate && !params.constraints[previous.length].romanNumeral?.scale) {
            const oldScale = previous[0].romanNumeral.scale;
            let modulationsAllowed = params.modulationsAllowed;

            const majorAndMinor = (key: Key) => [[key, Scale.Quality.MAJOR], [key, Scale.Quality.MINOR]] as Scale[];
            const possibleScales = modulationsAllowed ? modulationsAllowed.map(modulation => Key.fromString(modulation.transposeUp(Key.toNote(oldScale[0])).name)).flatMap(majorAndMinor) : Key.names.map(Key.fromString).flatMap(majorAndMinor);

            possibleScales.splice(0, 0, oldScale);
        
            // console.log('Previous are', previous.slice().reverse().map(chord => chord.romanNumeral.name).join(' '));
            // console.log('Options are', options.map(option => '[' + option.map(chord => chord.romanNumeral?.name).join(' ') + ']').join(' '));

            // TODO remove options of multiple length?
            options.push(...options.filter(option => option.length === 1)
                .flatMap(option => possibleScales.map(scale => {
                    if(scale === option[0].romanNumeral?.scale) {
                        return undefined;
                    }
                    const romanNumeral = option[0].romanNumeral?.relativeToScale(scale);
                    if(romanNumeral) {
                        const flags = {...option[0].flags};
                        flags.pivot = true;
                        return [new IncompleteChord({...option[0], flags, romanNumeral})];
                    }
                    return undefined;
                }))
                .filter(isDefined));

                // console.log('Pivoted options are', options.map(option => '[' + option.map(chord => chord.romanNumeral?.name).join(' ') + ']').join(' '));
        }

        //use expansions
        const expansions = params.enabledExpansions || defaultExpansions;
        let expandedOptions = options.flatMap(option => expansions.map(operator => operator(params.scale, option, previous))).filter(arr => arr.length);
        // TODO option chaining
        expandedOptions.sort((a, b) => b.length - a.length);
        // TODO remove duplicates
        // console.log('Applied options are', expandedOptions.map(option => '[' + option.map(chord => chord.romanNumeral?.name).join(' ') + ']').join(' '));
        for(let option of expandedOptions) {
            if(previous.length + option.length <= params.constraints.length) {
                yield option;
            }
        }
    }
    
    function *harmonize(params: HarmonyParameters, previous: HarmonizedChord[]) {
        for (const option of getOptions(params, previous)) {
            let result = harmonizeOptions(params, option, previous);
            if(result !== null) {
                yield result;
            }
        }
    }

    function harmonizeOptions(params: HarmonyParameters, option: IncompleteChord[], previous: HarmonizedChord[]): HarmonizedChord[] | null {
        // console.log([...previous].reverse().map(chord => chord.romanNumeral.name), option[0].romanNumeral?.name);
        const optionChord = option[0];
        if(params.useProgressions && !optionChord) {
            return null;
        }
        const constraintChord = params.constraints[previous.length];
        if(!constraintChord) {
            return [];
        }
        const reconciledConstraint = optionChord ? reconcileConstraints(optionChord, constraintChord) : constraintChord;
        if(!reconciledConstraint || !reconciledConstraint.romanNumeral) {
            return null;
        }
        // console.log('Harmonizing options for', previous.slice().reverse().map(chord => chord.romanNumeral.name).join(' '), '+', option.map(chord => chord.romanNumeral?.name).join(' '));
        //instead of previous need to use previous fit
        let results: HarmonizedChord[] = [];
        for(const foundSolution of findSolutions(reconciledConstraint, previous[0])) {
            const [soprano, alto, tenor, bass] = foundSolution;
            const chord = new HarmonizedChord([soprano, alto, tenor, bass], reconciledConstraint.romanNumeral, reconciledConstraint.flags);
            const array = [chord, ...previous];
            const partWritingParams = params.partWritingParameters || defaultPartWritingParameters;
            if(!PartWriting.Rules.testAll(partWritingParams, array)) {
                continue;
            }
            if(option.length > 1) {
                if(params.greedy) {
                    const result = harmonizeOptions(params, option.slice(1), array);
                    if(result) {
                        return [chord, ...result];
                    }
                } else {
                    results.push(chord);
                }
            } else {
                if(params.greedy) {
                    return [chord];
                } else {
                    results.push(chord);
                }
            }
        }
        
        if(!params.greedy && results.length > 0) {
            // console.log('Harmonize options', previous[0].romanNumeral.name, option.map(chord => chord.romanNumeral?.name));
            // console.log(results.map(result => PartWriting.Preferences.evaluateAll(result, previous[0])));
            const partWritingParams = params.partWritingParameters || defaultPartWritingParameters;
            const bestResults = minGenerator(results, result => PartWriting.Preferences.lazyEvaluateAll(partWritingParams, result, previous[0]), arrayComparator);

            //TODO need to check or average over all in the results array
            for(let i of bestResults) {
                // TODO also need to be generator?
                const bestResult = results[i];
                // console.log('Best was', bestResult.romanNumeral.name, PartWriting.Preferences.evaluateAll(partWritingParams, bestResult, previous[0]));
                if(option.length > 1) {
                    const result = harmonizeOptions(params, option.slice(1), [bestResult, ...previous]);
                    if(result == null) {
                        return null;
                    }
                    return [bestResult, ...result];
                } else {
                    return [bestResult];
                }
            }
        }
        return null;
    }
    
    /**
     * Harmonize based on the given parameters
     * @param params the parameters to harmonize
     */
    export function harmonizeAll(params: HarmonyParameters): HarmonyResult {
        //TODO harmonize tonic or come up with options
        const start = new RomanNumeral(params.start || 'I',  params.scale);
        const reconciledConstraint = reconcileConstraints(params.constraints[0], new IncompleteChord({romanNumeral: start}));
        if(!reconciledConstraint) {
            console.error('Failed to reconcile first constraint');
            return {solution: null, furthest: 0};
        }
        let furthest = 0;
        let results: HarmonizedChord[] = [];
        // TODO enable accumulate results before recursing
        for(const beginning of findSolutions(reconciledConstraint)) {
            const chord = new HarmonizedChord(beginning, start);
            const partWritingParams = params.partWritingParameters || defaultPartWritingParameters;
            if(!PartWriting.Rules.testSingular(partWritingParams, chord)) {
                continue;
            }
            if(params.greedy) {
                const result = harmonizeRecursive(params, [chord], params.scale);
                if(result.solution != null) {
                    return {solution: [chord, ...result.solution], furthest: result.furthest};
                } else {
                    furthest = result.furthest > furthest ? result.furthest : furthest;
                }
            } else {
                results.push(chord);
            }
        }
        if(!params.greedy && results.length > 0) {
            const partWritingParams = params.partWritingParameters || defaultPartWritingParameters;
            const scores = minGenerator(results, result => PartWriting.Preferences.lazyEvaluateSingle(partWritingParams, result), arrayComparator);
            // console.log('Harmonize all scores');
            // console.log(results.map(result => PartWriting.Preferences.evaluateSingle(result)));
            for(let i of scores) {
                let chord = results[i];
                const result = harmonizeRecursive(params, [chord], params.scale);
                if(result.solution != null) {
                    return {solution: [chord, ...result.solution], furthest: result.furthest};
                } else {
                    furthest = result.furthest > furthest ? result.furthest : furthest;
                }
            }
        }
        return {solution: null, furthest: furthest};
    }
    
    function harmonizeRecursive(params: HarmonyParameters, previous: HarmonizedChord[], scale: Scale): HarmonyResult {
        if(params.constraints.length == previous.length) {
            return {solution: [], furthest: previous.length};
        }
        let furthest = previous.length;
        let results: HarmonizedChord[][] = [];
        for(let solution of harmonize(params, previous)){
            if(params.greedy) {
                const result = harmonizeRecursive(params, [...[...solution].reverse(), ...previous], solution[solution.length - 1].romanNumeral.scale);
                if(result.solution != null) {
                    return {solution: [...solution, ...result.solution], furthest: result.furthest};
                } else {
                    furthest = result.furthest > furthest ? result.furthest : furthest;
                }
            } else {
                results.push(solution);
            }
        }
        if(!params.greedy && results.length > 0) {
            const partWritingParams = params.partWritingParameters || defaultPartWritingParameters;
            const scores = minGenerator(results, result => PartWriting.Preferences.lazyEvaluateAll(partWritingParams, result[0], previous[0]), arrayComparator);
            // console.log('Harmonize recursive scores after', previous[0].romanNumeral.name);
            // console.log(results.map(result => PartWriting.Preferences.evaluateAll(result[0], previous[0])));
            for(let i of scores) {
                let solution = results[i];
                const result = harmonizeRecursive(params, [...[...solution].reverse(), ...previous], solution[solution.length - 1].romanNumeral.scale);
                if(result.solution) {
                    return {solution: [...solution, ...result.solution], furthest: result.furthest};
                } else {
                    furthest = result.furthest > furthest ? result.furthest : furthest;
                }
            }
        }
        return {solution: null, furthest: furthest};
    }
}