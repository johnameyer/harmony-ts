import { PartWritingParameters, defaultPartWritingParameters, voiceRange, PartWriting } from './part-writing';
import { Harmonizer } from '../harmony/harmonizer';
import { IncompleteChord } from '../chord/incomplete-chord';
import { Scale } from '../scale';
import { NestedIterable, convertToMultiIterator, resultsOfTotalLength, NestedLazyMultiIterable, resultsOfLength } from '../util/nested-iterable';
import { CompleteChord } from '../chord/complete-chord';
import { RomanNumeral } from '../harmony/roman-numeral';
import { HarmonizedChord } from '../chord/harmonized-chord';
import { postorderNestedIterableMap, preorderNestedIterableMap } from '../util/nested-iterator-map';
import { AbsoluteNote } from '../note/absolute-note';
import { Note } from '../note/note';
import { isDefined } from '../util';
import { minGenerator } from '../util/min-generator';
import { arrayComparator } from '../util/array-comparator';
import { nestedIterableFilter } from '../util/nested-iterator-filter';
import { makePeekableIterator } from '../util/make-peekable-iterator';
import { lazyArrayMerge } from '../util/lazy-array-merge';
import { minValueGenerator } from '../util/min-value-generator';
import { defaultChainedIterator } from '../util/default-chained-iterator';
import { ScaleDegree } from '../harmony/scale-degree';
import { ChordQuality } from '../chord/chord-quality';

function swap<T>(arr: T[], first: number, second: number) {
    [ arr[first], arr[second] ] = [ arr[second], arr[first] ];
}

const summer = (a: number, b: number) => a + b;

export function * nestedMinGenerator<T>(iterable: Iterable<T>, mapper: (value: T) => number[], innerMapper: (value: T) => number[]) {
    let start = 0;
    const arr = Array.from(iterable);
    const innerBest: (number[] | undefined)[] = new Array(arr.length);
    const mapped = arr.map(mapper);
    while(arr.length > start) {
        let min = start;
        for(let i = start + 1; i < arr.length; i++) {
            let innerBestMin = innerBest[min];
            if(!innerBestMin) {
                innerBestMin = innerMapper(arr[min]);
                innerBest[min] = innerBestMin;
            }
            const merged = lazyArrayMerge(mapped[min], innerBestMin, summer);
            // No need to save outside of loop since summing is low cost and the rest of the array is already memoized
            if(arrayComparator(merged, mapped[i]) > 0) {                
                min = i;
                // TODO does this shortcut always hold? Does some condition need to be placed on the results of PartWriting to make this hold?
                continue;
            }
            let innerBestI = innerBest[i];
            if(!innerBestI) {
                innerBestI = innerMapper(arr[i]);
                innerBest[i] = innerBestI;
            }
            
            if(arrayComparator(merged, lazyArrayMerge(mapped[i], innerBestI, summer)) > 0) {
                min = i;
            }
        }
        swap(arr, start, min);
        swap(innerBest, start, min);
        swap(mapped, start, min);
        yield arr[start];
        start++;
    }
}

function reconcileConstraints(one: IncompleteChord, two: IncompleteChord) {
    const compatible = <T>(one: T | undefined, two: T | undefined) => !one || !two || one == two;
    for(const voicePart in one.voices) {
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
        if(!two.voices.filter(isDefined).every(note => oneNotes.includes(note.simpleName))) {
            return null;
        }
    } else if(two.romanNumeral) {
        const romanNumeral = two.romanNumeral;
        const twoNotes = romanNumeral.intervals.map(interval => romanNumeral.root ? interval.transposeUp(romanNumeral.root).simpleName : undefined);
        if(!one.voices.filter(isDefined).every(note => twoNotes.includes(note.simpleName))) {
            return null;
        }
    }
    
    const romanNumeral = (one.romanNumeral || two.romanNumeral)?.with({ ...one.romanNumeral?.flags, ...two.romanNumeral?.flags });
    const voices = [ ...new Array(Math.max(one.voices.length, two.voices.length)) ].map((_, index) => one.voices[index] || two.voices[index]);
    const flags = { ...(one.flags || {}), ...(two.flags || {}) };
    return new IncompleteChord({ romanNumeral, voices, flags });
}

/**
 * Used to tell the PartWriter how to process the results it finds
 */
export interface PartWriterParameters {
    /**
     * Whether to check whether a voicing is possible between every pair of contiguous chords before / during searching
     * Increases runtime, but exponential time might result from an invalid progression without this
     */
    // TODO skipPairChecks?: boolean

    /**
     * Gives the ability to modify the order in which results are yielded
     * Allows for a variety of functionality like: greedy, local best, deep best
     */
    yieldOrdering: (iterator: NestedIterable<CompleteChord>, previous: CompleteChord[], partWriter: PartWriter) => NestedIterable<CompleteChord>,
}

/**
 * Holds the predefined yieldOrdering
 */
export namespace PartWriterParameters {
    /**
     * Simply returns the provided iterator as is, resulting in the first option found at each level
     * @param iterator the nested iterator
     */
    export const greedyOrdering: PartWriterParameters['yieldOrdering'] = (iterator) => iterator;
    
    /**
     * Returns the items in the iterator ranked by the PartWriting.Preferences
     * @param iterator the nested iterator
     * @param previous the previous chords in the harmonization for this context
     * @param partWriter the part writing instance
     */
    export const defaultOrdering: PartWriterParameters['yieldOrdering'] = (iterator, previous, partWriter) => minGenerator(iterator, result => (previous.length ? PartWriting.Preferences.lazyEvaluateAll : PartWriting.Preferences.lazyEvaluateSingle)(partWriter.partWritingParams, result[0], previous[0]), arrayComparator);

    export const depthOrdering: PartWriterParameters['yieldOrdering'] = (iterator, previous, partWriter) => nestedMinGenerator(iterator, result => (previous.length ? PartWriting.Preferences.lazyEvaluateAll : PartWriting.Preferences.lazyEvaluateSingle)(partWriter.partWritingParams, result[0], previous[0]), result => minValueGenerator(result[1], nested => PartWriting.Preferences.lazyEvaluateAll(partWriter.partWritingParams, nested[0], result[0]), arrayComparator).next().value || []);
}

/**
 * Class that writes parts, given parameters and constraints
 */
export class PartWriter {

    /**
     * Create a new instance using the following parameters
     * @param partWriterParams the parameters to use for generating results in this class
     * @param partWritingParams the parameters for shaping and part-writing the results generated
     * @param harmonizer the harmonizer to use
     */
    constructor(public partWriterParams: PartWriterParameters = { yieldOrdering: PartWriterParameters.defaultOrdering }, public partWritingParams: PartWritingParameters = defaultPartWritingParameters, public harmonizer: Harmonizer = new Harmonizer({})) { }

    /**
     * Voices the given constraints completely
     * @param constraints the constraints to voice for
     * @param scale the scale to begin in
     */
    * voiceAll(constraints: IncompleteChord[], scale: Scale): NestedIterable<CompleteChord> {
        for(let i = 1; i < constraints.length; i++) {
            const failed = PartWriting.Rules.checkAll(this.partWritingParams, constraints.slice(0, i + 1).reverse()).next().value;
            if(failed) {
                throw 'Failed rule ' + failed + ' on constraint ' + i;
            }
        }
        // TODO harmonize tonic or come up with options
        const start = constraints[0].romanNumeral || new RomanNumeral({ scaleDegree: ScaleDegree.TONIC, quality: scale[1] === Scale.Quality.MAJOR ? ChordQuality.MAJOR : ChordQuality.MINOR }, scale);
        const reconciledConstraint = reconcileConstraints(constraints[0], new IncompleteChord({ romanNumeral: start }));
        if(!reconciledConstraint) {
            throw 'Failed to reconcile first constraint';
        }
        {
            const failed = PartWriting.Rules.checkSingular(this.partWritingParams, reconciledConstraint).next().value;
            if(failed) {
                throw 'First reconciled constraint failed rule ' + failed;
            }
        }

        const harmonization = this.harmonizer.matchingCompleteHarmony(constraints, scale);

        const filtered = makePeekableIterator(resultsOfTotalLength(nestedIterableFilter(harmonization, this.expansionIsVoiceable.bind(this)), constraints.length));

        if(!filtered.hasItems) {
            // return early if there are not valid matching harmonies
            return;
        }

        const multiHarmonization = convertToMultiIterator(filtered[Symbol.iterator]());

        const voicings = this.voiceWithContext(constraints, multiHarmonization);

        const multi = convertToMultiIterator(voicings);

        const orderedResult = preorderNestedIterableMap(multi, (voicings, previous) => this.partWriterParams.yieldOrdering(voicings, [ ...previous.slice().reverse() ], this));

        const ofLength = resultsOfLength(orderedResult, constraints.length);

        yield * ofLength;
    }

    /**
     * Yields all possible voicings at the current level in consideration to the previous
     * Makes no guarantee that all yielded results will be complete, consider wrapping with resultsOfLength if that is needed
     */
    * voiceWithContext(constraints: IncompleteChord[], progression: NestedLazyMultiIterable<HarmonizedChord[]>, previous: CompleteChord[] = []): NestedIterable<CompleteChord> {        
        // TODO can remove constraints from this function?
        if(constraints.length === previous.length) {
            return;
        }
        for(const [ current, future ] of progression) {
            // console.log('Voicing', previous.map(prev => prev.romanNumeral.name).reverse(), Scale.toString(current[0].romanNumeral.scale), current.map(curr => curr.romanNumeral.name));
            const voicings = this.chordVoicings(current, previous);
            yield * postorderNestedIterableMap(voicings, (nested, treePrevious) => defaultChainedIterator(nested, () => this.voiceWithContext(constraints, future, [ ...treePrevious.slice().reverse(), ...previous ])));
        }
    }

    /**
     * Generates all valid voicings of a set of chords
     * @param reconciledConstraints the chords to generate the voicings for
     * @param previous the previous chords to consider as context
     */
    * chordVoicings(reconciledConstraints: HarmonizedChord[], previous: CompleteChord[] = []): NestedIterable<CompleteChord> {
        if(reconciledConstraints.length === 0) {
            return;
        }

        for(const voicing of this.chordVoicing(reconciledConstraints[0], previous)) {
            yield [ voicing, this.chordVoicings(reconciledConstraints.slice(1), [ voicing, ...previous ]) ];
        }
    }

    /**
     * Generates all valid voicings of a chord
     * @param reconciledConstraint the chord to come up with voicings for
     * @param previous the previous chords to consider as context
     */
    * chordVoicing(reconciledConstraint: HarmonizedChord, previous: CompleteChord[] = []) {
        const mapToNearby = (previous: AbsoluteNote) => (note: Note) => [
            new AbsoluteNote(note.letterName, note.accidental, previous.octavePosition + 1),
            new AbsoluteNote(note.letterName, note.accidental, previous.octavePosition),
            new AbsoluteNote(note.letterName, note.accidental, previous.octavePosition - 1),
        ];
        
        const romanNumeral = reconciledConstraint.romanNumeral;
        const needed = romanNumeral.intervals.map(interval => romanNumeral.root ? interval.transposeUp(romanNumeral.root) : undefined).filter(isDefined);
        const bassNote = romanNumeral.inversionInterval.transposeUp(romanNumeral.root);
        
        let sopranoNotes, altoNotes, tenorNotes, bassNotes;
        if(previous.length) {
            const get = (voicePart: number) => {
                const voice = reconciledConstraint.voices[voicePart];
                if(voice instanceof AbsoluteNote) {
                    return [ voice ];
                }
                if(voice instanceof Note) {
                    return [ voice ].flatMap(mapToNearby(previous[0].voices[voicePart]));
                }
                return [ ...needed ].flatMap(mapToNearby(previous[0].voices[voicePart]));
            };
            const compare = (note: AbsoluteNote) => (one: AbsoluteNote, two: AbsoluteNote) => Math.abs(note.midi - one.midi) - Math.abs(note.midi - two.midi);
            // try smaller intervals first
            sopranoNotes = get(0).sort(compare(previous[0].voices[0]));
            altoNotes = get(1).sort(compare(previous[0].voices[1]));
            tenorNotes = get(2).sort(compare(previous[0].voices[2]));
            if(reconciledConstraint.voices[3] instanceof AbsoluteNote) {
                bassNotes = [ reconciledConstraint.voices[3] ];
            } else {
                bassNotes = mapToNearby(previous[0].voices[3])(bassNote).sort(compare(previous[0].voices[3]));
            }
        } else {
            const get = (needed: Note[]) => (voicePart: number) => {
                const voice = reconciledConstraint.voices[voicePart];
                if(voice instanceof AbsoluteNote) {
                    return [ voice ];
                }
                const low = voiceRange[voicePart][1].octavePosition;
                const high = voiceRange[voicePart][2].octavePosition + 1;
                const middle = (voiceRange[voicePart][1].midi + voiceRange[voicePart][2].midi) / 2;
                if(voice instanceof Note) {
                    return [ voice ]
                        .flatMap(note => [ ...Array(high - low).keys() ]
                            .map((i) => new AbsoluteNote(note.letterName, note.accidental, i + low)))
                        .sort((first, second) => Math.abs(first.midi - middle) - Math.abs(second.midi - middle));
                }
                return [ ...needed ]
                    .flatMap(note => [ ...Array(high - low).keys() ]
                        .map((i) => new AbsoluteNote(note.letterName, note.accidental, i + low)))
                    .sort((first, second) => Math.abs(first.midi - middle) - Math.abs(second.midi - middle));
            };
            sopranoNotes = get(needed)(0);
            altoNotes = get(needed)(1);
            tenorNotes = get(needed)(2);
            bassNotes = get([ bassNote ])(3);
        }

        const check = (voices: (AbsoluteNote | undefined)[]) => {
            const voicing = new IncompleteChord({ ...reconciledConstraint, voices });
            if(previous.length) {
                if(!PartWriting.Rules.testAll(this.partWritingParams, [ voicing, ...previous ])) {
                    return false;
                }
            } else {
                if(!PartWriting.Rules.testSingular(this.partWritingParams, voicing)) {
                    return false;
                }
            }
            return true;
        };

        // TODO make more efficient by following doubling rules outright
        for(const bass of bassNotes) {
            for(const soprano of sopranoNotes) {
                if(!check([ soprano, undefined, undefined, bass ])) {
                    continue;
                }
                for(const alto of altoNotes) {
                    if(!check([ soprano, alto, undefined, bass ])) {
                        continue;
                    }
                    for(const tenor of tenorNotes) {
                        const voicing = new CompleteChord([ soprano, alto, tenor, bass ], reconciledConstraint.romanNumeral, reconciledConstraint.flags);
                        if(previous.length) {
                            if(!PartWriting.Rules.testAll(this.partWritingParams, [ voicing, ...previous ])) {
                                continue;
                            }
                        } else {
                            if(!PartWriting.Rules.testSingular(this.partWritingParams, voicing)) {
                                continue;
                            }
                        }
                        yield voicing;
                    }
                }
            }
        }
    }

    expansionIsVoiceable(current: HarmonizedChord[], previousExpansions: HarmonizedChord[][]): boolean {
        const previous = previousExpansions.flatMap(expansion => expansion.slice()).reverse();
        for(let i = 0; i < current.length; i++) {
            if(!this.harmonyIsVoicable(current[i], previous)) {
                return false;
            }
            previous.unshift(current[i]);
        }
        return true;
    }

    harmonyIsVoicable(current: HarmonizedChord, previous: HarmonizedChord[]): boolean {
        const chords = previous[0] ? [ previous[0], current ] : [ current ];
        const voicingsFor = makePeekableIterator(resultsOfLength(this.chordVoicings(chords), chords.length));
        return voicingsFor.hasItems;
    }
}
