import { HarmonizedChord } from '../chord/harmonized-chord';
import { IncompleteChord } from '../chord/incomplete-chord';
import { Progression, ProgressionRule } from './progression';
import { RomanNumeral } from './roman-numeral';
import { Scale } from '../scale';
import { isDefined } from '../util';
import { Expansion, ExpansionRule } from './expansion';
import { Interval } from '../interval/interval';
import { Key } from '../key';
import { makePeekableIterator } from '../util/make-peekable-iterator';
import { convertToMultiIterator, NestedIterable, NestedLazyMultiIterable } from '../util/nested-iterable';
import { ScaleDegree } from './scale-degree';
import { ChordQuality } from '../chord/chord-quality';
import { Substitution, SubstitutionRule } from './substitution';
import { product } from '../util/product';
import { iteratorMap } from '../util/iterator-map';

function constraintsEqual(one: HarmonizedChord, two: HarmonizedChord) {
    for(const voicePart in one.voices) {
        if(one.voices[voicePart]?.name !== two.voices[voicePart]?.name) {
            return false;
        }
    }
    
    if(one.romanNumeral.root.name !== two.romanNumeral.root.name) {
        return false;
    }
    if(one.romanNumeral.name !== two.romanNumeral.name) {
        return false;
    }
    if(one.romanNumeral.scale[0] !== two.romanNumeral.scale[0]) {
        return false;
    }
    if(one.romanNumeral.scale[1] !== two.romanNumeral.scale[1]) {
        return false;
    }
    if(one.flags) {
        if(!two.flags) {
            return false;
        }
        for(const key in one.flags) {
            if(two.flags && one.flags[key] !== two.flags[key]) {
                return false;
            }
        }
    }
    if(two.flags) {
        if(!one.flags) {
            return false;
        }
    }
    if(one.romanNumeral.name !== two.romanNumeral.name) {
        return false;
    }

    return true;
}

/**
 * 
 * TODO does not need to be symmetric
 */
function reconcileConstraints(one: HarmonizedChord, two: IncompleteChord) {
    const compatible = <T>(one: T | undefined, two: T | undefined) => !one || !two || one == two;
    for(const voicePart in one.voices) {
        if(!compatible(one.voices[voicePart]?.name, two.voices[voicePart]?.name)) {
            return null;
        }
    }
    
    if(!compatible(one.romanNumeral.root.name, two.romanNumeral?.root?.name)) {
        return null;
    }
    if(!compatible(one.romanNumeral.name, two.romanNumeral?.name)) {
        return null;
    }
    if(!compatible(one.romanNumeral.scale[0], two.romanNumeral?.scale[0])) {
        return null;
    }
    if(!compatible(one.romanNumeral.scale[1], two.romanNumeral?.scale[1])) {
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
    const romanNumeral = (one.romanNumeral || two.romanNumeral)?.with({ ...one.romanNumeral.flags, ...two.romanNumeral?.flags });
    const voices = [ ...new Array(Math.max(one.voices.length, two.voices.length)) ].map((_, index) => one.voices[index] || two.voices[index]);
    const flags = { ...(one.flags || {}), ...(two.flags || {}) };
    return new HarmonizedChord({ romanNumeral, voices, flags });
}

class HarmonizerContext {
    private cache: { [paramsString: string]: NestedLazyMultiIterable<HarmonizedChord[]> }[] = [];

    getOrSet(position: number, terminal: RomanNumeral, generator: () => NestedLazyMultiIterable<HarmonizedChord[]>) {
        const asParams = { ...terminal.asParams(), scale: terminal.scale };
        const paramsString = JSON.stringify(asParams, Object.keys(asParams).sort());
        if(!this.cache[position]) {
            this.cache[position] = {};
        }
        if(!this.cache[position][paramsString]) {
            this.cache[position][paramsString] = generator();
        }
        return this.cache[position][paramsString];
    }
}

/**
 * The parameters that the harmonizer uses
 */
export interface HarmonizerParameters {
    /**
     * The chords that are enabled if using progressions
     */
    enabledProgressions?: ProgressionRule[];

    /**
     * The expansions that are enabled if using progressions
     */
    enabledExpansions?: ExpansionRule[];

    /**
     * The substitutions that are enabled if using progressions
     */
    enabledSubstitutions?: SubstitutionRule[];

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

    /**
     * Disables caching within one harmonization
     */
    disableCaching?: boolean;
}

export type CompleteHarmonyGenerator = NestedIterable<HarmonizedChord[]>;

/**
 * Class that yields harmonies for a given set of constraints
 */
export class Harmonizer {
    constructor(public params: HarmonizerParameters) { }

    /**
     * Find the next possible chord to progress to (with modulations and expansions between) without looking at the constraints
     * @param params the params to generate harmony using
     * @param previous the previous chords
     */
    * nextHarmony(constraints: IncompleteChord[], position: number, previous: RomanNumeral): Generator<[harmony: RomanNumeral[], next: RomanNumeral], void> {
        if(position >= constraints.length) {
            return;
        }
        const constraint = constraints[position];
        // @ts-ignore
        let shouldYieldAsIs = !this.params.useProgressions;

        // Get options available to us from current chord
        const progressions = this.params.enabledProgressions || Progression.defaultProgressions;
        const scale = constraint.romanNumeral?.scale || previous.scale;
        const options = [ ...Progression.matchingProgressions(scale, previous, progressions) ];
        /*
         * console.log('Previous are', previous.slice().reverse().map(chord => chord.romanNumeral.name).join(' '));
         * console.log('Options are', options.map(option => option.romanNumeral.name).join(', '));
         */

        // TODO rethink modulation again
        if(this.params.canModulate && !constraint.romanNumeral?.scale) {
            const oldScale = previous.scale;
            const modulationsAllowed = this.params.modulationsAllowed;

            const majorAndMinor = (key: Key) => [[ key, Scale.Quality.MAJOR ], [ key, Scale.Quality.MINOR ]] as Scale[];
            const possibleScales = modulationsAllowed ? modulationsAllowed.map(modulation => Key.fromString(modulation.transposeUp(Key.toNote(oldScale[0])).name)).flatMap(majorAndMinor) : Key.names.map(Key.fromString).flatMap(majorAndMinor);

            options.push(...options
                .flatMap(option => possibleScales.map(scale => {
                    if(scale === option.scale) {
                        return undefined;
                    }
                    const romanNumeral = option.relativeToScale(scale);
                    if(romanNumeral) {
                        const flags = { ...option.flags };
                        flags.pivot = true;
                        return romanNumeral.with({ flags });
                    }
                    return undefined;
                }))
                .filter(isDefined));
            // console.log('Pivoted options are', options.map(option => '[' + option.map(chord => chord.romanNumeral.name).join(' ') + ']').join(' '));
        }

        for(const terminal of options) {
            // use expansions
            const expansions = this.params.enabledExpansions || Expansion.defaultExpansions;
            const expanded = [ ...Expansion.matchingExpansions(scale, previous, terminal, expansions) ];
            // TODO option chaining
            expanded.sort((a, b) => b.length - a.length);
            /*
             * TODO remove duplicates
             * console.log('Applied options are', expanded.map(option => '[' + option.map(chord => chord.name).join(' ') + ']').join(', '));
             */

            const substitutions = this.params.enabledSubstitutions || Substitution.defaultSubstitutions;
            const substituted = [ ...Substitution.matchingSubstitutions(scale, terminal, substitutions) ];

            const productOptions = iteratorMap(product(expanded, substituted), ([ expansion, substitution ]) => [ ...expansion.slice(0, expansion.length - 1), substitution ]);

            for(const option of productOptions) {
                if(position + option.length <= constraints.length) {
                    if(option.some(chord => !chord)) {
                        /*
                         * console.log(option);
                         * TODO why is this?
                         */
                        continue;
                    }
                    if(shouldYieldAsIs) {
                        shouldYieldAsIs = false;
                        for(let i = 0; i < option.length; i++) {
                            // TODO might be able to use this to fold any duplicate options together
    
                            const { romanNumeral, voices, flags } = constraints[i + position];
                            if(!romanNumeral || !constraintsEqual(
                                new HarmonizedChord({ romanNumeral: option[i] }),
                                new HarmonizedChord({ romanNumeral, voices, flags }))
                            ) {
                                shouldYieldAsIs = true;
                                break;
                            }
                        }
                    }
                    yield [ option, terminal ];
                }
            }
        }

        if(constraint.romanNumeral && shouldYieldAsIs) {
            const { romanNumeral } = constraint;
            yield [[ romanNumeral ], romanNumeral ];
        }
    }

    /**
     * Find the next possible chord to progress to (with modulations and expansions between) checking that constraints can be satisfied
     * @param params the params to generate harmony using
     * @param previous the previous chords
     */
    * matchingHarmony(constraints: IncompleteChord[], position: number, previous: RomanNumeral): Generator<[reconciled: HarmonizedChord[], next: RomanNumeral]> {
        if(position >= constraints.length) {
            return;
        }
        for(const [ option, next ] of this.nextHarmony(constraints, position, previous)) {
            let index = 0;
            const reconciledOption = Array(option.length) as HarmonizedChord[];
            for(; index < option.length; index++) {
                const reconciled = reconcileConstraints(new HarmonizedChord({ romanNumeral: option[index] }), constraints[position + index]);
                if(reconciled === null) {
                    break;
                }
                reconciledOption[index] = reconciled;
            }
            if(index === option.length) {
                // console.log('Yielded ', option.map(chord => chord.romanNumeral?.name).join(' '));
                yield [ reconciledOption, next ];
            }
        }
    }

    private * checkCache(constraints: IncompleteChord[], position: number, previous: RomanNumeral, context?: HarmonizerContext) {
        // TODO consider caching only if the solution is dead-end
        if(!this.params.disableCaching && context) {
            yield * context.getOrSet(position, previous, () => convertToMultiIterator(this.matchingCompleteHarmonyWithContext(constraints, position, previous, context)));
        } else {
            yield * this.matchingCompleteHarmonyWithContext(constraints, position, previous);
        }
    }

    /**
     * Finds the next possible complete harmonization of the constraints (with using the previous chords)
     * @param params the params to harmonize using
     * @param constraints the constraints to match against
     * @param previous the chords before this one
     */
    * matchingCompleteHarmonyWithContext(constraints: IncompleteChord[], position: number, previous: RomanNumeral, context?: HarmonizerContext): CompleteHarmonyGenerator {
        if(position >= constraints.length) {
            return;
        }
        for(const [ match, next ] of this.matchingHarmony(constraints, position, previous)) {
            // TODO consider doing something to prevent re-evaluation of first item
            const recurse = makePeekableIterator(this.checkCache(constraints, position + match.length, next, context));
            
            // TODO move to resultsOfLength approach
            if(recurse.hasItems || match.length + position === constraints.length) {
                yield [ match, recurse[Symbol.iterator]() ];
            }
        }
    }

    /**
     * Finds the next possible complete harmonization of the constraints
     * @param params the params to harmonize using
     */
    * matchingCompleteHarmony(constraints: IncompleteChord[], scale: Scale): CompleteHarmonyGenerator {
        if(constraints.length === 0) {
            return;
        }
        const start = constraints[0].romanNumeral || new RomanNumeral({ scaleDegree: ScaleDegree.TONIC, quality: scale[1] === Scale.Quality.MAJOR ? ChordQuality.MAJOR : ChordQuality.MINOR }, scale);

        const chord = reconcileConstraints(new HarmonizedChord({ romanNumeral: start }), constraints[0]);
        if(chord === null) {
            return;
        }
        const recurse = makePeekableIterator(this.matchingCompleteHarmonyWithContext(constraints, 1, chord.romanNumeral, new HarmonizerContext()));
        if(recurse.hasItems || constraints.length === 1) {
            yield [[ chord ], recurse[Symbol.iterator]() ];
        }
    }
}
