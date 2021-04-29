//TODO figure out whether should be chords : IncompleteChord[] or chord: IncompleteChord and how to handle

import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Rule, MatchingRule, match, matchAsIs, checkAgainstRule, yieldChordsFromRule } from "./rule";
import { product } from "../util/product";
import { ChordQuality } from "../chord/chord-quality";
import { ScaleDegree } from "./scale-degree";
import { HarmonizedChord } from "../chord/harmonized-chord";

export enum ExpansionType {
    /**
     * Expansion is inserted before the target
     */
    PREFIX,
    
    /**
     * Expansion is appended after the target
     */
    SUFFIX,

    /**
     * Expansion spans from source to target and cannot be used with other expansions
     */
    FULL
}

export interface ExpansionRule extends Rule {
    type: ExpansionType,
    source?: MatchingRule,
    target?: MatchingRule,
    expansion: MatchingRule[]
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

const MAJOR = ChordQuality.MAJOR;
const MINOR = ChordQuality.MINOR;
const AUGMENTED = ChordQuality.AUGMENTED;
const DIMINISHED = ChordQuality.DIMINISHED;

// TODO add operators that operate over all and each
// const startingWith = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && prev[0].romanNumeral.name === new RomanNumeral(romanNumeral, scale).diatonicized()?.name ? next(scale, chords, prev) : [];
// const startingWithAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && prev[0].romanNumeral.name === romanNumeral ? next(scale, chords, prev) : [];
// const movingTo = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && chords[0].romanNumeral.name === new RomanNumeral(romanNumeral, scale).diatonicized()?.name ? next(scale, chords, prev) : [];
// const movingToAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && chords[0].romanNumeral.name === romanNumeral ? next(scale, chords, prev) : [];

// //TODO clone map
// const insert = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice()], prev) : [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice()];
// const insertAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice()], prev) : [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice()];
// const insertMany = (romanNumerals: string[]) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => [...romanNumerals.flatMap(romanNumeral => new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())})), ...chords.slice()];
// const sequenceInsert = (romanNumerals: string[]) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => [...romanNumerals.flatMap(romanNumeral => new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized()), flags: {sequence: true}})), ...chords.slice()];
// const movingToWithinSequence = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => { if(next && chords[0]?.romanNumeral?.name === romanNumeral) { chords = chords.slice(); chords[0] = new HarmonizedChord({...chords[0]} as {romanNumeral:RomanNumeral}); chords[0].flags.sequence = true; return next(scale, chords, prev); } return [] };
// const replaceWith = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice(1)], prev) : [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice(1)];
// const replaceWithAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice(1)], prev) : [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice(1)];
// const notStartingWith = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && prev[0].romanNumeral.name !== new RomanNumeral(romanNumeral, scale).diatonicized()?.name ? next(scale, chords, prev) : [];

/**
 * Expansions consist of elaborations beyond basic progressions
 * I.e. I - I6 could be expanded to be I - V64 - I6
 *
 * TODO chainable? - e.g. (V6/V - (I64 - V))
 */
export namespace Expansion {
    // export const identity = [
    //     (_: Scale, chords: IncompleteChord[]) => chords.map(chord => new IncompleteChord({flags: chord.flags, romanNumeral: chord.romanNumeral}))
    // ]

    // export const basic = [
    //     startingWithAsIs('V', insertAsIs('V7')),
    //     startingWithAsIs('V', replaceWithAsIs('V7')),
    // ];

    export const basicInversions = [
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [0, 1] }),
            target: match(I, { inversions: [0, 1] }),
            expansion: [matchAsIs(VII, { inversions: [1], chordQuality: DIMINISHED })]
        },

        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [0, 1] }),
            target: match(I, { inversions: [0, 1] }),
            expansion: [matchAsIs(V, { inversions: [1] })]
        },
    ] as ExpansionRule[];

    export const dominantInversions = [
        // V6 - V65?
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [0, 1] }),
            target: match(I, { inversions: [0, 1] }),
            expansion: [matchAsIs(V, { inversions: [2], hasSeventh: true })]
        },

        {
            type: ExpansionType.FULL,
            target: match(I, { inversions: [1] }),
            expansion: [matchAsIs(V, { inversions: [3], hasSeventh: true })]
        },

        /* double neighbor */
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [
                matchAsIs(V, { inversions: [1], hasSeventh: true }),
                matchAsIs(V, { inversions: [2], hasSeventh: true })
            ]
        },
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [0, 1] }),
            target: match(I),
            expansion: [
                matchAsIs(V, { inversions: [2], hasSeventh: true }),
                matchAsIs(V, { inversions: [1], hasSeventh: true })
            ]
        },

        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [1] }),
            target: match(I, { inversions: [1] }),
            expansion: [
                matchAsIs(V, { inversions: [3], hasSeventh: true }),
                matchAsIs(V, { inversions: [2], hasSeventh: true })
            ]
        },

        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [1] }),
            target: match(I, { inversions: [1] }),
            expansion: [
                matchAsIs(V, { inversions: [2], hasSeventh: true }),
                matchAsIs(V, { inversions: [3], hasSeventh: true })
            ]
        },

        // startingWithAsIs('V6', replaceWithAsIs('V65')),

        {
            type: ExpansionType.FULL,
            target: match(I, { inversions: [1] }),
            expansion: [ matchAsIs(V, { inversions: [3], hasSeventh: true }) ]
        },

        {
            type: ExpansionType.FULL,
            target: match(I),
            expansion: [ matchAsIs(V, { inversions: [1], hasSeventh: true }) ]
        },
    ];

    export const subdominant = [
        // I6 passing tone
        {
            type: ExpansionType.FULL,
            source: match(II, { inversions: [1] }),
            target: match(II, { inversions: [1] }),
            expansion: [ match(I, { inversions: [1] }) ]
        },

        // 5-6 technique
        {
            type: ExpansionType.FULL,
            source: match(IV),
            expansion: [ match(II, { inversions: [1] }) ]
        },
        // [startingWith('IV'), 'ii', 'V']?
    ];

    export const cadential64 = [
        // not preceded by V or vii ??
        // notStartingWith('V', notStartingWith('viio', movingToAsIs('V', replaceWithAsIs('V42', insert('I64')))))
        
        {
            type: ExpansionType.FULL,
            target: matchAsIs(V),
            expansion: [ match(I, { inversions: [2] }) ]
        },
        {
            type: ExpansionType.FULL,
            target: matchAsIs(V, { hasSeventh: true }),
            expansion: [ match(I, { inversions: [2] }) ]
        },
    ];

    export const submediant = [
        // 5-6 technique
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VI),
            expansion: [ match(IV, { inversions: [1] }) ]
        },

        // not in minor
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VI, { chordQuality: MINOR }),
            expansion: [
                matchAsIs(V, { inversions: [1] }),
                match(I)
            ]
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VI, { chordQuality: MINOR }),
            expansion: [
                matchAsIs(V, { inversions: [1], hasSeventh: true }),
                match(I)
            ]
        },

        // use major IV6 in minor
        {
            type: ExpansionType.FULL,
            source: matchAsIs(IV, { inversions: [1] }),
            expansion: [
                matchAsIs(V, { inversions: [1] }),
                match(I)
            ]
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(IV, { inversions: [1] }),
            expansion: [
                matchAsIs(V, { inversions: [1], hasSeventh: true }),
                match(I)
            ]
        },
    ];

    export const supertonicSevenths = [
        // I6 passing tone
    
        {
            type: ExpansionType.FULL,
            source: match(II),
            target: match(II, { hasSeventh: true, inversions: [1] }),
            expansion: [ match(I, { inversions: [1] }) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(II, { hasSeventh: true }),
            target: match(II, { hasSeventh: true, inversions: [1] }),
            expansion: [ match(I, { inversions: [1] }) ]
        },

        {
            type: ExpansionType.FULL,
            source: matchAsIs(IV, { hasSeventh: true, inversions: [1] }),
            expansion: [
                matchAsIs(V, { inversions: [1] }),
                match(I)
            ]
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(IV, { hasSeventh: true, inversions: [1] }),
            expansion: [
                matchAsIs(V, { inversions: [1], hasSeventh: true }),
                match(I)
            ]
        },
    ];

    export const tonicSubstitutes = [
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [0, 1] }),
            target: match(I, { inversions: [0, 1] }),
            expansion: [ match(IV) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I, { inversions: [1] }),
            expansion: [ match(VI) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I, { inversions: [1] }),
            expansion: [ match(IV, { inversions: [1] }) ]
        },

        {
            type: ExpansionType.FULL,
            source: matchAsIs(V),
            target: matchAsIs(V, { inversions: [1] }),
            expansion: [ match(IV, { inversions: [1] }) ]
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(V),
            target: matchAsIs(V, { inversions: [1], hasSeventh: true }),
            expansion: [ match(IV, { inversions: [1] }) ]
        },
    ];

    export const secondaryDominant = [
        {
            type: ExpansionType.FULL,
            target: match(V),
            expansion: [ matchAsIs(V, { inversions: [0, 1], applied: V }) ]
        },
        {
            type: ExpansionType.FULL,
            target: match(V),
            expansion: [ matchAsIs(V, { inversions: [0, 1, 2], applied: V, hasSeventh: true }) ]
        },
        {
            type: ExpansionType.FULL,
            target: match(V, { inversions: [1] }),
            expansion: [ matchAsIs(V, { inversions: [2, 3], applied: V, hasSeventh: true }) ]
        },
        {
            type: ExpansionType.FULL,
            target: match(V, { inversions: [0, 1] }),
            expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, inversions: [1], applied: V }) ]
        },
    ];

    export const mediant = [
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VII),
            target: matchAsIs(V),
            expansion: [ match(IV, { inversions: [1] }) ]
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VII),
            target: matchAsIs(V),
            expansion: [ match(IV, { inversions: [1], hasSeventh: true }) ]
        },
    ];

    // TODO write out more compactly
    export const sequences = [
        // TODO how to make the target also part of the sequence?
        [IV, VII, III, VI, II, V, I].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // descending fifths, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true } }))
                    }, 
                    // descending fifths, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [index % 2 == 0 ? 1 : 0] }),
                        expansion: array.slice(0, index).map((expansion, index) => 
                            match(expansion, { inversions: [index % 2 == 0 ? 1 : 0], flags: { sequence: true } })
                        )
                    }
                ];
            } else {
                return [];
            }
        }),

        [VI, II, VII, III, I, IV, II, V].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // ascending 5-6, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true } }))
                    }, 
                    // ascending 5-6s, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [index % 2 == 0 ? 1 : 0] }),
                        expansion: array.slice(0, index).map((expansion, index) => 
                            match(expansion, { inversions: [index % 2 == 0 ? 1 : 0], flags: { sequence: true } })
                        )
                    }
                ];
            } else {
                return [];
            }
        }),

        [V, II, VI, III, VII, IV, I].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // ascending fifths, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true } }))
                    }, 
                    // ascending fifths, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [index % 2 == 0 ? 1 : 0] }),
                        expansion: array.slice(0, index).map((expansion, index) => 
                            match(expansion, { inversions: [index % 2 == 0 ? 1 : 0], flags: { sequence: true } })
                        )
                    }
                ];
            } else {
                return [];
            }
        }),

        // skipping over iii - viio
        [V, II, VI, IV, I].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // ascending fifths, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true } }))
                    }, 
                    // ascending fifths, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [index % 2 == 0 ? 1 : 0] }),
                        expansion: array.slice(0, index).map((expansion, index) => 
                            match(expansion, { inversions: [index % 2 == 0 ? 1 : 0], flags: { sequence: true } })
                        )
                    }
                ];
            } else {
                return [];
            }
        }),

        // descending 5-6
        [V, VI, III, IV, I, II].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // descending 5-6, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true } }))
                    }, 
                    // descending 5-6, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [index % 2 == 0 ? 1 : 0] }),
                        expansion: array.slice(0, index).map((expansion, index) => 
                            match(expansion, { inversions: [index % 2 == 0 ? 1 : 0], flags: { sequence: true } })
                        )
                    }
                ];
            } else {
                return [];
            }
        }),
    ].flat();

    export const leadingToneSevenths = [
        {
            type: ExpansionType.FULL,
            target: matchAsIs(I),
            expansion: [ match(VII, { chordQuality: DIMINISHED, hasSeventh: true }) ]
        },
        {
            type: ExpansionType.FULL,
            target: matchAsIs(I, { inversions: [1] }),
            expansion: [ match(VII, { chordQuality: DIMINISHED, inversions: [1], hasSeventh: true }) ]
        },
    ];

    //TODO fix problem of vii0 instead of viio
    export const otherSeventhChords = [
        [
            {primaryInversion: 0, secondaryInversion: 0, hasSeventh: true},
            {primaryInversion: 0, secondaryInversion: 0, hasSeventh: false},
            {primaryInversion: 1, secondaryInversion: 0, hasSeventh: false},
            {primaryInversion: 2, secondaryInversion: 0, hasSeventh: false},
            {primaryInversion: 2, secondaryInversion: 0, hasSeventh: true},
            {primaryInversion: 3, secondaryInversion: 1, hasSeventh: true},
            {primaryInversion: 3, secondaryInversion: 1, hasSeventh: false}
        ].flatMap(({ primaryInversion, secondaryInversion, hasSeventh }) =>
            [IV, VII, III, VI, II, V, I].flatMap((target, index, array) => {
                if(index >= 2) {
                    return [
                        // descending fifths with seventh chords, e.g. I IV43 viio iii43 vi ii43 V
                        {
                            type: ExpansionType.FULL,
                            source: match(I),
                            target: match(target, {
                                hasSeventh: index % 2 === 1 ? hasSeventh : true,
                                inversions: index % 2 === 1 ? [secondaryInversion] : [primaryInversion],
                                // flags: { sequence: true }?
                            }),
                            expansion: array.slice(0, index).map((expansion, index) => match(expansion, {
                                hasSeventh: index % 2 === 1 ? hasSeventh : true,
                                inversions: index % 2 === 1 ? [secondaryInversion] : [primaryInversion],
                                flags: { sequence: true }
                            }))
                        },
                    ];
                } else {
                    return [];
                }
            }),
        )
    ].flat();

    export const secondaryDominants = [
        ...[II, III, IV, V, VI, VII].flatMap(root => [
            // TODO prevent applied to diminished?
            {
                type: ExpansionType.FULL,
                target: match(root),
                expansion: [ matchAsIs(V, { inversions: [0, 1], applied: root }) ]
            },
            {
                type: ExpansionType.FULL,
                target: match(root),
                expansion: [ matchAsIs(V, { inversions: [0, 1, 2], applied: root, hasSeventh: true }) ]
            },
            {
                type: ExpansionType.FULL,
                target: match(root, { inversions: [1] }),
                expansion: [ matchAsIs(V, { inversions: [2, 3], applied: root, hasSeventh: true }) ]
            },
            {
                type: ExpansionType.FULL,
                target: match(root, { inversions: [0, 1] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, inversions: [1], applied: root }) ]
            },
            {
                type: ExpansionType.FULL,
                target: match(root),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: true, inversions: [0], applied: root }) ]
            },
            {
                type: ExpansionType.FULL,
                target: match(root, { inversions: [1] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: true, inversions: [1, 2], applied: root }) ]
            },
            {
                type: ExpansionType.FULL,
                target: match(root, { inversions: [2] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: true, inversions: [3], applied: root }) ]
            },
        ]),
        // TODO move into above array and add check for diatonicized quality
        ...[III, IV, V, VI, VII].flatMap(root => [
            {
                type: ExpansionType.FULL,
                target: matchAsIs(root),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: false, inversions: [0], applied: root }) ]
            },
            {
                type: ExpansionType.FULL,
                target: matchAsIs(root, { inversions: [1] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: false, inversions: [1], applied: root }) ]
            },
        ]),
    ];

    export const defaultExpansions = [...Expansion.basicInversions, ...Expansion.dominantInversions, ...Expansion.subdominant, ...Expansion.cadential64, ...Expansion.submediant, ...Expansion.tonicSubstitutes, ...Expansion.secondaryDominant, ...Expansion.secondaryDominants, ...Expansion.sequences, ...Expansion.leadingToneSevenths, ...Expansion.otherSeventhChords, ...Expansion.mediant] as ExpansionRule[];

    export function * matchingExpansions(scale: Scale, previous: HarmonizedChord, option: HarmonizedChord, expansions: ExpansionRule[] = defaultExpansions): Generator<HarmonizedChord[]> {
        yield [option];
        for(const expansion of expansions) {
            if(expansion.source && !checkAgainstRule(previous.romanNumeral, expansion.source)) {
                continue;
            }
            if(expansion.target && !checkAgainstRule(option.romanNumeral, expansion.target)) {
                continue;
            }
            switch(expansion.type) {
                case ExpansionType.FULL:
                    const options: RomanNumeral[][] = product(...expansion.expansion.map(expansion => Array.from(yieldChordsFromRule(expansion, scale))), [option.romanNumeral]);
                    for(const option of options){
                        yield (option as RomanNumeral[]).map(romanNumeral => new HarmonizedChord({ romanNumeral }));
                    }
            }
        }
    }
}