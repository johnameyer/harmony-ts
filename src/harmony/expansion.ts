// TODO figure out whether should be chords : IncompleteChord[] or chord: IncompleteChord and how to handle

import { RomanNumeral } from './roman-numeral';
import { Scale } from '../scale';
import { MatchingRule, match, matchAsIs, checkAgainstRule, yieldChordsFromRule, Rule } from './rule';
import { product } from '../util/product';
import { ChordQuality } from '../chord/chord-quality';
import { ScaleDegree } from './scale-degree';
import { isDefined } from '../util';

export enum ExpansionType {
    /**
     * Expansion is inserted before the target
     */
    PREFIX,

    // /**
    //  * Expansion is appended after the target
    //  */
    // SUFFIX,

    /**
     * Expansion spans from source to target and cannot be used with other expansions
     */
    FULL
}

export type ExpansionRule = Rule & {
    type: ExpansionType,
    expansion: MatchingRule[]
} & ({
    type: ExpansionType.FULL,
} | {
    type: ExpansionType.PREFIX,
    priority: number
});

const CLOSEST_PRIORITY = 20;
const CLOSER_PRIORITY = 10;
const CLOSE_PRIORITY = 0;

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

/**
 * Expansions consist of elaborations beyond basic progressions
 * I.e. I - I6 could be expanded to be I - V64 - I6
 *
 * TODO chainable? - e.g. (V6/V - (I64 - V))
 */
export namespace Expansion {
    /*
     * export const identity = [
     *     (_: Scale, chords: IncompleteChord[]) => chords.map(chord => new IncompleteChord({flags: chord.flags, romanNumeral: chord.romanNumeral}))
     * ]
     */

    /*
     * export const basic = [
     *     startingWithAsIs('V', insertAsIs('V7')),
     *     startingWithAsIs('V', replaceWithAsIs('V7')),
     * ];
     */

    export const basicInversions = [
        // I viio6 I passing/neighbor
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [ 0, 1 ] }),
            target: match(I, { inversions: [ 0, 1 ] }),
            expansion: [ matchAsIs(VII, { inversions: [ 1 ], chordQuality: DIMINISHED }) ],
        },

        // V6 I
        {
            type: ExpansionType.PREFIX,
            priority: CLOSER_PRIORITY,
            target: match(I),
            expansion: [ matchAsIs(V, { inversions: [ 1 ] }) ],
        },
    ] as ExpansionRule[];

    export const dominantInversions = [
        // Ix V43 Ix passing
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [ 0, 1 ] }),
            target: match(I, { inversions: [ 0, 1 ] }),
            expansion: [ matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }) ],
        },
        {
            type: ExpansionType.FULL,
            target: match(I, { inversions: [ 1 ] }),
            expansion: [ matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }) ],
        },

        // I V43 V65 I double neighbor
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [
                matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }),
                matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }),
            ],
        },
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [ 0, 1 ] }),
            target: match(I),
            expansion: [
                matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }),
                matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }),
            ],
        },

        // I6 V42 V43 I6 double neighbor
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [ 1 ] }),
            target: match(I, { inversions: [ 1 ] }),
            expansion: [
                matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }),
                matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }),
            ],
        },

        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [ 1 ] }),
            target: match(I, { inversions: [ 1 ] }),
            expansion: [
                matchAsIs(V, { inversions: [ 2 ], hasSeventh: true }),
                matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }),
            ],
        },

        // I6 V42 V43 I6 double neighbor
        {
            type: ExpansionType.PREFIX,
            target: match(I, { inversions: [ 1 ] }),
            expansion: [ matchAsIs(V, { inversions: [ 3 ], hasSeventh: true }) ],
        },

        // I6 V42 V43 I6 double neighbor
        {
            type: ExpansionType.PREFIX,
            priority: CLOSEST_PRIORITY,
            target: match(I),
            expansion: [ matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }) ],
        },
    ];

    export const subdominant = [
        // iix I6 iix passing
        {
            type: ExpansionType.FULL,
            source: match(II, { inversions: [ 0, 1 ] }), // TODO this also allows neighbor motion?
            target: match(II, { inversions: [ 0, 1 ] }),
            expansion: [ match(I, { inversions: [ 1 ] }) ],
        },
    ];

    export const cadential64 = [
        /*
         * TODO not preceded by V or vii ??
         * notStartingWith('V', notStartingWith('viio', movingToAsIs('V', replaceWithAsIs('V42', insert('I64')))))
         */

        // I64 V cadential 64
        {
            type: ExpansionType.PREFIX,
            priority: CLOSEST_PRIORITY,
            target: matchAsIs(V),
            expansion: [ match(I, { inversions: [ 2 ] }) ],
        },
    ];

    export const submediant = [
        /*
         * not in minor
         * vi V6 I
         */
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VI, { chordQuality: MINOR }),
            expansion: [
                matchAsIs(V, { inversions: [ 1 ] }),
                matchAsIs(I),
            ],
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VI, { chordQuality: MINOR }),
            expansion: [
                matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }),
                matchAsIs(I),
            ],
        },

        /*
         * use major IV6 in minor
         * IV6 V6 I
         */
        {
            type: ExpansionType.FULL,
            source: matchAsIs(IV, { inversions: [ 1 ] }),
            expansion: [
                matchAsIs(V, { inversions: [ 1 ] }),
                match(I),
            ],
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(IV, { inversions: [ 1 ] }),
            expansion: [
                matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }),
                match(I),
            ],
        },
    ];

    export const subdominantSevenths = [
        // I ii42 V6x I double neighbor
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [
                match(II, { inversions: [ 3 ], hasSeventh: true }),
                matchAsIs(V, { inversions: [ 1 ] }),
            ],
        },
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [
                match(II, { inversions: [ 3 ], hasSeventh: true }),
                matchAsIs(V, { inversions: [ 1 ], hasSeventh: true }),
            ],
        },
    ];

    export const tonicSubstitutes = [
        // Ix IV Ix
        {
            type: ExpansionType.FULL,
            source: match(I, { inversions: [ 0, 1 ] }),
            target: match(I, { inversions: [ 0, 1 ] }),
            expansion: [ match(IV) ],
        },

        // I vi I6
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I, { inversions: [ 1 ] }),
            expansion: [ match(VI) ], // TODO add flag and rule
        },

        // I IV6 I6
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I, { inversions: [ 1 ] }),
            expansion: [ match(IV, { inversions: [ 1 ] }) ],
        },
        
        // V IV6 V6
        {
            type: ExpansionType.FULL,
            source: matchAsIs(V),
            target: matchAsIs(V, { inversions: [ 1 ] }),
            expansion: [ match(IV, { inversions: [ 1 ] }) ],
        },
    ];

    export const secondaryDominant = [
        // V/V V
        {
            type: ExpansionType.PREFIX,
            priority: CLOSE_PRIORITY,
            target: match(V),
            expansion: [ matchAsIs(V, { inversions: [ 0, 1 ], applied: V }) ],
        },
        {
            type: ExpansionType.FULL,
            priority: CLOSE_PRIORITY,
            target: match(V),
            expansion: [ matchAsIs(V, { inversions: [ 0, 1, 2 ], applied: V, hasSeventh: true }) ],
        },
        {
            type: ExpansionType.FULL,
            priority: CLOSE_PRIORITY,
            target: match(V, { inversions: [ 1 ] }),
            expansion: [ matchAsIs(V, { inversions: [ 2, 3 ], applied: V, hasSeventh: true }) ],
        },
        {
            type: ExpansionType.FULL,
            priority: CLOSE_PRIORITY,
            target: match(V, { inversions: [ 0, 1 ] }),
            expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, inversions: [ 1 ], applied: V }) ],
        },
    ];

    export const mediant = [
        // VII iv6 V
        {
            type: ExpansionType.FULL,
            source: matchAsIs(VII),
            target: matchAsIs(V),
            expansion: [ matchAsIs(IV, { inversions: [ 1 ], chordQuality: MINOR }) ],
        },
    ];

    export const fiveThreeTechniques = [
        // TODO all valid? are there more?
        {
            type: ExpansionType.FULL,
            source: match(V),
            target: match(V),
            expansion: [ match(II) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(IV),
            target: match(IV),
            expansion: [ match(I) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(II),
            target: match(II),
            expansion: [ match(IV) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(IV),
            target: match(IV),
            expansion: [ match(VI) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [ match(III) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(II),
            expansion: [ match(VI, { flags: { voiceLeading: true }}) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(II),
            expansion: [ match(V, { flags: { voiceLeading: true }}) ]
        },
        
        {
            type: ExpansionType.FULL,
            source: match(IV),
            target: match(V),
            expansion: [ match(II, { flags: { voiceLeading: true }}) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(IV),
            target: match(V),
            expansion: [ match(I, { flags: { voiceLeading: true }}) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(II),
            target: match(V),
            expansion: [ match(IV, { flags: { voiceLeading: true }}) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(VI),
            target: match(IV),
            expansion: [ match(III, { flags: { voiceLeading: true }}) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(IV),
            target: match(II),
            expansion: [ match(I, { flags: { voiceLeading: true }}) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(IV),
            target: match(IV, { inversions: [1] }),
            expansion: [ match(V, { flags: { voiceLeading: true }}) ]
        },
        
        {
            type: ExpansionType.FULL,
            source: match(V, { inversions: [1]}),
            target: match(V, { inversions: [2], hasSeventh: true }),
            expansion: [ match(I, { flags: { voiceLeading: true }}) ]
        },

        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [ match(IV, { flags: { voiceLeading: true }}) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(V),
            target: match(V),
            expansion: [ match(I, { flags: { voiceLeading: true }}) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(I),
            target: match(I),
            expansion: [ match(VI, { flags: { voiceLeading: true }}) ]
        },
        {
            type: ExpansionType.FULL,
            source: match(V),
            target: match(V),
            expansion: [ match(VI, { flags: { voiceLeading: true }}) ]
        },
        
        {
            type: ExpansionType.FULL,
            source: matchAsIs(I, { chordQuality: MINOR }),
            target: matchAsIs(VI),
            expansion: [ match(V, { inversions: [1], chordQuality: MINOR }) ]
        },

        {
            type: ExpansionType.FULL,
            source: matchAsIs(I, { chordQuality: MINOR }),
            target: matchAsIs(IV, { inversions: [1], chordQuality: MINOR }),
            expansion: [ match(V, { inversions: [1], chordQuality: MINOR }) ]
        },
    ];

    // TODO write out more compactly
    export const sequences = [
        // TODO how to make the target also part of the sequence?
        [ IV, VII, III, VI, II, V, I ].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // descending fifths, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true }})),
                    }, 
                    // descending fifths, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [ index % 2 == 0 ? 1 : 0 ] }),
                        expansion: array.slice(0, index).map((expansion, index) => match(expansion, { inversions: [ index % 2 == 0 ? 1 : 0 ], flags: { sequence: true }}),
                        ),
                    },
                ];
            } 
            return [];
        }),

        [ VI, II, VII, III, I, IV, II, V ].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // ascending 5-6, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true }})),
                    }, 
                    // ascending 5-6s, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [ index % 2 == 0 ? 1 : 0 ] }),
                        expansion: array.slice(0, index).map((expansion, index) => match(expansion, { inversions: [ index % 2 == 0 ? 1 : 0 ], flags: { sequence: true }}),
                        ),
                    },
                ];
            } 
            return [];
        }),

        [ V, II, VI, III, VII, IV, I ].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // ascending fifths, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true }})),
                    }, 
                    // ascending fifths, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [ index % 2 == 0 ? 1 : 0 ] }),
                        expansion: array.slice(0, index).map((expansion, index) => match(expansion, { inversions: [ index % 2 == 0 ? 1 : 0 ], flags: { sequence: true }}),
                        ),
                    },
                ];
            } 
            return [];
        }),

        // skipping over iii - viio
        [ V, II, VI, IV, I ].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // ascending fifths, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true }})),
                    }, 
                    // ascending fifths, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [ index % 2 == 0 ? 1 : 0 ] }),
                        expansion: array.slice(0, index).map((expansion, index) => match(expansion, { inversions: [ index % 2 == 0 ? 1 : 0 ], flags: { sequence: true }}),
                        ),
                    },
                ];
            } 
            return [];
        }),

        // descending 5-6
        [ V, VI, III, IV, I, II ].flatMap((target, index, array) => {
            if(index >= 2) {
                return [    
                    // descending 5-6, root position
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target),
                        expansion: array.slice(0, index).map(expansion => match(expansion, { flags: { sequence: true }})),
                    }, 
                    // descending 5-6, alternating first inversion and root
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, { inversions: [ index % 2 == 0 ? 1 : 0 ] }),
                        expansion: array.slice(0, index).map((expansion, index) => match(expansion, { inversions: [ index % 2 == 0 ? 1 : 0 ], flags: { sequence: true }}),
                        ),
                    },
                ];
            } 
            return [];
        }),
    ].flat();

    export const sixThreeTechniques = [
        {
            type: ExpansionType.FULL,
            source: matchAsIs(III),
            target: matchAsIs(III),
            expansion: [matchAsIs(II, { inversions: [1], chordQuality: DIMINISHED })]
        },

        {
            type: ExpansionType.FULL,
            source: matchAsIs(V),
            target: matchAsIs(V),
            expansion: [matchAsIs(III, { inversions: [1], chordQuality: AUGMENTED })]
        }, // TODO fix        
        {
            type: ExpansionType.FULL,
            source: matchAsIs(V),
            target: matchAsIs(V),
            expansion: [matchAsIs(III, { inversions: [1], chordQuality: MINOR })]
        },
        {
            type: ExpansionType.FULL,
            source: matchAsIs(V, { chordQuality: MINOR }),
            target: matchAsIs(V, { chordQuality: MINOR }),
            expansion: [matchAsIs(III, { inversions: [1], chordQuality: MAJOR })]
        },

        // startingWithAsIs('V', insertAsIs('III+6')), // TODO fix
        // startingWithAsIs('V', insertAsIs('iii6')),
        // startingWithAsIs('v', insertAsIs('III6')),

        // movingToAsIs('v', replaceWithAsIs('III6')),
        
        // movingTo('V', replaceWith('iii6')),
    ];

    export const sixFourTechniques = [
        // startingWith('v', movingTo('v', insertVoiceLeading(''))),
        // startingWith('v', movingTo('v', insertVoiceLeading(''))),

        {
            type: ExpansionType.PREFIX,
            priority: CLOSEST_PRIORITY,
            target: matchAsIs(II, { chordQuality: MINOR }),
            expansion: [match(V, { inversions: [2] })]
        },
        {
            type: ExpansionType.PREFIX,
            priority: CLOSEST_PRIORITY,
            target: match(VI),
            expansion: [match(II, { inversions: [2] })]
        },
        
        {
            type: ExpansionType.PREFIX,
            priority: CLOSEST_PRIORITY,
            source: match(I, { inversions: [0, 1]}),
            target: match(I, { inversions: [0, 1]}),
            expansion: [matchAsIs(V, { inversions: [2] })]
        },
    ];

    export const leadingToneSevenths = [
        {
            type: ExpansionType.PREFIX,
            priority: CLOSE_PRIORITY,
            target: matchAsIs(I),
            expansion: [ match(VII, { chordQuality: DIMINISHED, hasSeventh: true }) ],
        },
        {
            type: ExpansionType.PREFIX,
            priority: CLOSE_PRIORITY,
            target: matchAsIs(I, { inversions: [ 1 ] }),
            expansion: [ match(VII, { chordQuality: DIMINISHED, inversions: [ 1 ], hasSeventh: true }) ],
        },
    ];

    // TODO fix problem of vii0 instead of viio
    export const otherSeventhChords = [
        [
            { primaryInversion: 0, secondaryInversion: 0, hasSeventh: true },
            { primaryInversion: 0, secondaryInversion: 0, hasSeventh: false },
            { primaryInversion: 1, secondaryInversion: 0, hasSeventh: false },
            { primaryInversion: 2, secondaryInversion: 0, hasSeventh: false },
            { primaryInversion: 2, secondaryInversion: 0, hasSeventh: true },
            { primaryInversion: 3, secondaryInversion: 1, hasSeventh: true },
            { primaryInversion: 3, secondaryInversion: 1, hasSeventh: false },
        ].flatMap(({ primaryInversion, secondaryInversion, hasSeventh }) => [ IV, VII, III, VI, II, V, I ].flatMap((target, index, array) => {
            if(index >= 2) {
                return [
                    // descending fifths with seventh chords, e.g. I IV43 viio iii43 vi ii43 V
                    {
                        type: ExpansionType.FULL,
                        source: match(I),
                        target: match(target, {
                            hasSeventh: index % 2 === 1 ? hasSeventh : true,
                            inversions: index % 2 === 1 ? [ secondaryInversion ] : [ primaryInversion ],
                        }),
                        expansion: array.slice(0, index).map((expansion, index) => match(expansion, {
                            hasSeventh: index % 2 === 1 ? hasSeventh : true,
                            inversions: index % 2 === 1 ? [ secondaryInversion ] : [ primaryInversion ],
                            flags: { sequence: true },
                        })),
                    },
                ];
            } 
            return [];
            
        }),
        ),
    ].flat();

    export const secondaryDominants = [
        ...[ II, III, IV, V, VI, VII ].flatMap(root => [
            /*
             * TODO prevent applied to diminished?
             * TODO should we allow inversioning?
             */
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root),
                expansion: [ matchAsIs(V, { inversions: [ 0, 1 ], applied: root }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root),
                expansion: [ matchAsIs(V, { inversions: [ 0, 1, 2 ], applied: root, hasSeventh: true }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root, { inversions: [ 1 ] }),
                expansion: [ matchAsIs(V, { inversions: [ 2, 3 ], applied: root, hasSeventh: true }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root, { inversions: [ 0, 1 ] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, inversions: [ 1 ], applied: root }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: true, inversions: [ 0 ], applied: root }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root, { inversions: [ 1 ] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: true, inversions: [ 1, 2 ], applied: root }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: match(root, { inversions: [ 2 ] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: true, inversions: [ 3 ], applied: root }) ],
            },
        ]),
        // TODO move into above array and add check for diatonicized quality
        ...[ III, IV, V, VI, VII ].flatMap(root => [
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: matchAsIs(root),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: false, inversions: [ 0 ], applied: root }) ],
            },
            {
                type: ExpansionType.PREFIX,
                priority: CLOSE_PRIORITY,
                target: matchAsIs(root, { inversions: [ 1 ] }),
                expansion: [ matchAsIs(VII, { chordQuality: DIMINISHED, hasSeventh: true, fullyDiminishedSeventh: false, inversions: [ 1 ], applied: root }) ],
            },
        ]),
    ];

    export const defaultExpansions = [ ...Expansion.basicInversions, ...Expansion.dominantInversions, ...Expansion.subdominant, ...Expansion.cadential64, ...Expansion.submediant, ...Expansion.subdominantSevenths, ...Expansion.tonicSubstitutes, ...Expansion.secondaryDominant, ...Expansion.secondaryDominants, ...Expansion.fiveThreeTechniques, ...Expansion.sequences, ...Expansion.sixThreeTechniques, ...Expansion.sixFourTechniques, ...Expansion.leadingToneSevenths, ...Expansion.otherSeventhChords, ...Expansion.mediant ] as ExpansionRule[];

    export function * matchingExpansions(scale: Scale, previous: RomanNumeral, option: RomanNumeral, expansions: ExpansionRule[] = defaultExpansions): Generator<RomanNumeral[]> {
        yield [ option ];
        const expansionsByType = expansions
            .filter(expansion => { 
                if(expansion.source && !checkAgainstRule(previous, expansion.source)) {
                    return false;
                }
                if(expansion.target && !checkAgainstRule(option, expansion.target)) {
                    return false;
                }
                return true;
            })
            .reduce(
                (byType, expansion) => ({ ...byType, [expansion.type]: [ ...(byType[expansion.type] || []), expansion ] }),
                {} as {[type: number]: ExpansionRule[]},
            );

        for(const expansion of (expansionsByType[ExpansionType.FULL] || [])) {
            const options: RomanNumeral[][] = product(...expansion.expansion.map(expansion => Array.from(yieldChordsFromRule(expansion, scale))), [ option ]);
            for(const option of options) {
                yield option as RomanNumeral[];
            }
        }

        const prefixExpansionsByPriority = ((expansionsByType[ExpansionType.PREFIX] || []) as (ExpansionRule & { type: ExpansionType.PREFIX})[])
            .reduce(
                (byPriority, expansion) => ({ ...byPriority, [expansion.priority]: [ ...(byPriority[expansion.priority] || []), expansion ] }),
                {} as {[priority: number]: ExpansionRule[]},
            );

        const priorities = Object.keys(prefixExpansionsByPriority).sort();
        
        const prefixedOptions: (RomanNumeral | undefined)[][] = product(...priorities.map(priority => prefixExpansionsByPriority[priority as any]).map((expansions) => [ undefined, ...expansions.flatMap(expansion => expansion.expansion.flatMap(expansion => Array.from(yieldChordsFromRule(expansion, scale)))) ]), [ option ]);
        for(const option of prefixedOptions) {
            yield option.filter(isDefined) as RomanNumeral[];
        }
    }
}
