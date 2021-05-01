import { HarmonizedChord } from "../chord/harmonized-chord";
import { Scale } from "../scale";
import { iteratorMap } from "../util/iterator-map";
import { RomanNumeral } from "./roman-numeral";
import { checkAgainstRule, match, matchAsIs, MatchingRule, yieldChordsFromRule } from "./rule";
import { ScaleDegree } from "./scale-degree";

export interface SubstitutionRule {
    target: MatchingRule,
    substitute: MatchingRule
}

const {
    I,
    II,
    III,
    IV,
    V,
    VI,
    VII
} = ScaleDegree.ALIASED;

/**
 * Substitutions represent replacements of chords with another
 * I.e. V can be replaced with V7, I can be replaced with vi6
 * 
 * These substitutions happen after expansions are applied, can only be applied to progression chords, and don't change the progression
 */
export namespace Substitution {
    export const basic = [
        {
            target: matchAsIs(V),
            substitute: matchAsIs(V, { hasSeventh: true })
        }
    ] as SubstitutionRule[];

    
    export const dominantInversions = [
        {
            target: matchAsIs(V, { inversions: [1] }),
            substitute: matchAsIs(V, { inversions: [1], hasSeventh: true })
        }
    ] as SubstitutionRule[];

    export const subdominantSevenths = [
        {
            target: match(II),
            substitute: match(II, { hasSeventh: true })
        },
        {
            target: match(II, { inversions: [1] }),
            substitute: match(II, { inversions: [1], hasSeventh: true })
        },
        {
            target: match(IV),
            substitute: match(IV, { hasSeventh: true })
        }
    ] as SubstitutionRule[];

    export const defaultSubstitutions = [...Substitution.basic, ...Substitution.dominantInversions, ...Substitution.subdominantSevenths] as SubstitutionRule[];

    export function * matchingSubstitutions(scale: Scale, target: RomanNumeral, substitutions: SubstitutionRule[] = defaultSubstitutions): Generator<RomanNumeral> {
        yield target;
        for(const substitution of substitutions) {
            if(substitution.target && !checkAgainstRule(target, substitution.target)) {
                continue;
            }
            yield * yieldChordsFromRule(substitution.substitute, scale);
        }
    }
}