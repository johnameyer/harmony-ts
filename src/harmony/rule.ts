import { Accidental } from '../accidental';
import { ChordQuality } from '../chord/chord-quality';
import { Scale } from '../scale';
import { RomanNumeral } from './roman-numeral';
import { ScaleDegree } from './scale-degree';

export interface MatchingRule {
    // TODO refactor with romanNumeral toString
    scaleDegree: ScaleDegree;

    chordQuality: ChordQuality;

    inversions: number[];
    
    hasSeventh: boolean;

    matchingQuality: boolean;

    applied?: ScaleDegree;

    fullyDiminishedSeventh?: boolean;

    accidental?: Accidental;

    flags: {[key: string]: boolean};
}

type MatchParams = Partial<Pick<MatchingRule, 'chordQuality' | 'inversions' | 'hasSeventh' | 'applied' | 'fullyDiminishedSeventh' | 'flags' | 'accidental'>>;

export function match(scaleDegree: ScaleDegree, { chordQuality = ChordQuality.MAJOR, inversions = [ 0 ], hasSeventh = false, applied, fullyDiminishedSeventh, accidental = Accidental.NATURAL, flags, matchingQuality = false }: MatchParams & { matchingQuality?: boolean } = {}): MatchingRule {
    return { scaleDegree, chordQuality, inversions, hasSeventh, applied, fullyDiminishedSeventh, accidental, flags, matchingQuality } as MatchingRule;
}

export function matchAsIs(scaleDegree: ScaleDegree, { chordQuality = ChordQuality.MAJOR, inversions = [ 0 ], hasSeventh = false, applied, fullyDiminishedSeventh, accidental = Accidental.NATURAL, flags }: MatchParams = {}): MatchingRule {
    return { scaleDegree, chordQuality, inversions, hasSeventh, applied, fullyDiminishedSeventh, accidental, flags, matchingQuality: true } as MatchingRule;
}

export function checkAgainstRule(chord: RomanNumeral, rule: MatchingRule): boolean {
    if(chord.scaleDegree !== rule.scaleDegree) {
        return false;
    }
    if(chord.quality !== rule.chordQuality) {
        if(rule.matchingQuality) {
            return false;
        }
    }
    if(rule.inversions && !rule.inversions.includes(chord.inversion)) {
        return false;
    }
    if(chord.hasSeventh != rule.hasSeventh) {
        return false;
    }
    if(chord.applied != rule.applied && (!chord.applied && !rule.applied)) {
        return false;
    }
    if(chord.accidental !== rule.accidental && rule.accidental !== undefined) {
        return false;
    }
    if(rule.fullyDiminishedSeventh !== undefined && rule.fullyDiminishedSeventh != rule.fullyDiminishedSeventh) {
        return false;
    }
    // TODO handle flags
    return true;
}

export function * yieldChordsFromRule(rule: MatchingRule, scale: Scale): Generator<RomanNumeral, void> {
    for(const inversion of rule.inversions) {
        const next = new RomanNumeral({
            quality: rule.chordQuality,
            scaleDegree: rule.scaleDegree,
            inversion: inversion,
            hasSeventh: rule.hasSeventh,
            applied: rule.applied,
            accidental: rule.accidental,
            fullyDiminishedSeventh: rule.fullyDiminishedSeventh,
            flags: rule.flags,
        }, scale);
        if(rule.matchingQuality) {
            yield next;
        } else {
            const diatonicized = next.diatonicized();
            if(diatonicized) {
                yield diatonicized;
            }
        }
    }
}

export type Rule = {
    source?: MatchingRule,
    target?: MatchingRule
}
