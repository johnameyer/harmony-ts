import { RomanNumeral } from './roman-numeral';
import { Scale } from '../scale';
import { Rule, MatchingRule, checkAgainstRule, yieldChordsFromRule, match, matchAsIs } from './rule';
import { ChordQuality } from '../chord/chord-quality';
import { ScaleDegree } from './scale-degree';
import { Accidental } from '../accidental';

export interface ProgressionRule extends Rule {
    source: MatchingRule,
    target: MatchingRule
}

const ruleOf = ([ source, target ]: MatchingRule[]) => ({ source, target } as ProgressionRule);

// TODO move away from IncompleteChord model?

const {
    I,
    II,
    III,
    IV,
    V,
    VI,
    VII,
} = ScaleDegree.ALIASED;

const MAJOR = ChordQuality.MAJOR;
const MINOR = ChordQuality.MINOR;
const AUGMENTED = ChordQuality.AUGMENTED;
const DIMINISHED = ChordQuality.DIMINISHED;

export namespace Progression {
    export namespace Shared {
        export const basic = [
            /* I-V */
            [ match(I), matchAsIs(V) ],
            [ matchAsIs(V), match(I) ],
        ].map(ruleOf);

        export const basicInversions = [
            /* I-I6 arpeggiation */
            [ match(I), match(I, { inversions: [ 1 ] }) ],
            [ match(I, { inversions: [ 1 ] }), match(I) ],

            [ match(I, { inversions: [ 1 ] }), matchAsIs(V) ],

            /* V6 */
            [ match(I), matchAsIs(V, { inversions: [ 1 ] }) ],
            [ matchAsIs(V, { inversions: [ 1 ] }), match(I) ],

            [ matchAsIs(V), matchAsIs(V, { inversions: [ 1 ] }) ],
            [ matchAsIs(V, { inversions: [ 1 ] }), matchAsIs(V) ],

            // TODO consider
            [ matchAsIs(VII, { chordQuality: DIMINISHED, inversions: [ 1 ] }), match(I, { inversions: [ 0, 1 ] }) ],
        ].map(ruleOf);

        export const dominantSevenths = [
            /* V43 */
            [ match(I, { inversions: [ 0, 1 ] }), matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }) ],
            [ matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }), match(I, { inversions: [ 0, 1 ] }) ],

            /* V42 */
            [ match(I, { inversions: [ 0, 1 ] }), matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }) ],
            [ matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }), match(I, { inversions: [ 1 ] }) ],
            [ matchAsIs(V), matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }) ], 
        ].map(ruleOf);

        export const basicPredominant = [
            /* IV */
            [ match(I, { inversions: [ 0, 1 ] }), match(IV) ],

            [ match(IV), matchAsIs(V) ],
            [ match(IV), matchAsIs(V, { hasSeventh: true }) ],

            /* ii, ii6 */
            [ match(I, { inversions: [ 0, 1 ] }), match(II, { inversions: [ 0, 1 ] }) ],

            [ match(II, { inversions: [ 0, 1 ] }), matchAsIs(V) ],
            [ match(II, { inversions: [ 0, 1 ] }), matchAsIs(V, { hasSeventh: true }) ], // hasSeventh: null?
            [ match(II, { inversions: [ 0 ] }), matchAsIs(V, { inversions: [ 1 ] }) ],
            // viio6? V42?

            /* ii-ii6 arpeggiation */
            [ match(II, { inversions: [ 0, 1 ] }), match(II, { inversions: [ 0, 1 ] }) ],
            [ match(II, { inversions: [ 0, 1 ] }), match(II, { inversions: [ 0, 1 ] }) ],

            [ match(IV), match(II, { inversions: [ 0, 1 ] }) ],
        ].map(ruleOf);

        export const submediant = [
            [ match(I), match(VI) ],
            [ match(I), match(IV, { inversions: [ 1 ] }) ],

            /* vi root motion by 3rd */
            [ match(I), match(VI) ],
            [ match(VI), match(IV, { inversions: [ 0, 1 ] }) ],

            /* IV6 root motion by 3rd */
            [ match(IV, { inversions: [ 1 ] }), match(II, { inversions: [ 1 ] }) ],
            
            /* vi root motion by 5th */
            [ match(VI), match(II, { inversions: [ 0, 1 ] }) ],

            /* vi-V */
            [ match(VI), matchAsIs(V) ],
            [ match(IV, { inversions: [ 1 ] }), matchAsIs(V) ],
            // 12-5?
        ].map(ruleOf);

        export const subdominantSevenths = [
            [ match(II, { inversions: [ 3 ], hasSeventh: true }), matchAsIs(V, { inversions: [ 1 ], hasSeventh: false }) ],
            [ match(II, { inversions: [ 3 ], hasSeventh: true }), matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }) ],
        ].map(ruleOf);

        export const tonicSubstitutes = [
            [ matchAsIs(V), match(VI) ],
            [ matchAsIs(V), match(IV, { inversions: [ 1 ] }) ],
            [ matchAsIs(V, { hasSeventh: true }), match(VI) ],
            [ matchAsIs(V, { hasSeventh: true }), match(IV, { inversions: [ 1 ] }) ],
        ].map(ruleOf);

        export const mediant = [
            [ match(I), match(III) ],
            [ match(III), matchAsIs(V, { inversions: [ 0, 1 ] }) ],
            [ match(I), match(VI) ],
            [ match(I), match(IV, { inversions: [ 0, 1 ] }) ],
            [ match(I), match(II, { inversions: [ 0, 1 ] }) ],

            [ match(I), matchAsIs(VII, { inversions: [ 0, 1 ] }) ],
            [ matchAsIs(VII, { inversions: [ 0, 1 ] }), matchAsIs(III) ],
            // TODO scale type?

            [ matchAsIs(VII, { inversions: [ 0, 1 ] }), matchAsIs(V, { inversions: [ 0, 1 ] }) ],
        ].map(ruleOf);
        
        export const neapolitan = [
            [ match(I, { inversions: [ 0, 1 ] }), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }) ],
            [ match(III), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }) ],
            [ match(VI), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }) ],
            [ match(IV), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }) ],
            // [ match(II, { inversions: [ 1 ] }), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }) ],

            /*
             * [ match(I, { inversions: [ 0, 1 ] }), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR }) ],
             * [ match(II), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR }) ],
             * [ match(IV), matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR }) ],
             */
            
            [ matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }), matchAsIs(V) ],
            [ matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }), matchAsIs(V, { chordQuality: MAJOR, hasSeventh: true, inversions: [ 3 ] }) ],
            [ matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR, inversions: [ 1 ] }), match(VII, { chordQuality: DIMINISHED, hasSeventh: true, inversions: [ 2 ] }) ],

            // [ matchAsIs(II, { accidental: Accidental.FLAT, chordQuality: MAJOR }), matchAsIs(V, { inversions: [ 1 ] }) ],
        ].map(ruleOf);
    }

    export const defaultProgressions = [ ...Progression.Shared.basic, ...Progression.Shared.basicInversions, ...Progression.Shared.dominantSevenths, ...Progression.Shared.basicPredominant, ...Progression.Shared.subdominantSevenths, ...Progression.Shared.submediant, ...Progression.Shared.tonicSubstitutes, ...Progression.Shared.mediant, ...Progression.Shared.neapolitan ];

    export function * matchingProgressions(scale: Scale, previous: RomanNumeral, progressions: ProgressionRule[] = defaultProgressions): Generator<RomanNumeral> {
        yield previous;
        for(const { source, target } of progressions) {
            if(checkAgainstRule(previous, source)) {
                yield * yieldChordsFromRule(target, scale);
            }
        }
    }
}
