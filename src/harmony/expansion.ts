//TODO figure out whether should be chords : IncompleteChord[] or chord: IncompleteChord and how to handle

import { IncompleteChord } from "../chord/incomplete-chord";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { returnOrError } from "../util/return-or-error";

export type ExpansionOperator = (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => HarmonizedChord[];

// TODO add operators that operate over all and each
const startingWith = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && prev[0].romanNumeral.name === new RomanNumeral(romanNumeral, scale).diatonicized()?.name ? next(scale, chords, prev) : [];
const startingWithAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && prev[0]?.romanNumeral?.name === romanNumeral ? next(scale, chords, prev) : [];
const movingTo = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && chords[0]?.romanNumeral?.name === new RomanNumeral(romanNumeral, scale).diatonicized()?.name ? next(scale, chords, prev) : [];
const movingToAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && chords[0]?.romanNumeral?.name === romanNumeral ? next(scale, chords, prev) : [];

//TODO clone map
const insert = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice()], prev) : [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice()];
const insertAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice()], prev) : [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice()];
const insertMany = (romanNumerals: string[]) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => [...romanNumerals.flatMap(romanNumeral => new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())})), ...chords.slice()];
const sequenceInsert = (romanNumerals: string[]) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => [...romanNumerals.flatMap(romanNumeral => new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized()), flags: {sequence: true}})), ...chords.slice()];
const movingToWithinSequence = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => { if(next && chords[0]?.romanNumeral?.name === romanNumeral) { chords = chords.slice(); chords[0] = new HarmonizedChord({...chords[0]} as {romanNumeral:RomanNumeral}); chords[0].flags.sequence = true; return next(scale, chords, prev); } return [] };
const replaceWith = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice(1)], prev) : [new HarmonizedChord({romanNumeral: returnOrError(new RomanNumeral(romanNumeral, scale).diatonicized())}), ...chords.slice(1)];
const replaceWithAsIs = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next ? next(scale, [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice(1)], prev) : [new HarmonizedChord({romanNumeral: new RomanNumeral(romanNumeral, scale)}), ...chords.slice(1)];
const notStartingWith = (romanNumeral: string, next?: ExpansionOperator) => (scale: Scale, chords: HarmonizedChord[], prev: HarmonizedChord[]) => next && prev[0].romanNumeral.name !== new RomanNumeral(romanNumeral, scale).diatonicized()?.name ? next(scale, chords, prev) : [];

/**
 * Expansions consist of elaborations beyond basic progressions
 * I.e. I - I6 could be expanded to be I - V64 - I6
 *
 * TODO chainable? - e.g. (V6/V - (I64 - V))
 */
export namespace Expansion {
    export const identity = [
        (_: Scale, chords: IncompleteChord[]) => chords.map(chord => new IncompleteChord({flags: chord.flags, romanNumeral: chord.romanNumeral}))
    ]

    export const basic = [
        startingWithAsIs('V', insertAsIs('V7')),
        startingWithAsIs('V', replaceWithAsIs('V7')),
    ];

    export const basicInversions = [
        startingWith('I', movingTo('I', insertAsIs('viio6'))),
        startingWith('I6', movingTo('I6', insertAsIs('viio6'))),

        startingWith('I', movingTo('I6', insertAsIs('viio6'))),
        startingWith('I6', movingTo('I', insertAsIs('viio6'))),

        startingWith('I', movingTo('I', insertAsIs('V6'))),
    ];
    export const dominantInversions = [
        // V6 - V65?
        startingWith('I', movingTo('I', insertAsIs('V43'))),
        startingWith('I6', movingTo('I6', insertAsIs('V43'))),

        startingWith('I', movingTo('I6', insertAsIs('V43'))),
        startingWith('I6', movingTo('I', insertAsIs('V43'))),
        startingWith('I6', movingTo('I6', insertAsIs('V42'))),

        /* double neighbor */
        startingWith('I', movingTo('I', insertAsIs('V65', insertAsIs('V43')))),
        startingWith('I', movingTo('I', insertAsIs('V43', insertAsIs('V65')))),

        startingWith('I6', movingTo('I6', insertAsIs('V43', insertAsIs('V42')))),
        startingWith('I6', movingTo('I6', insertAsIs('V42', insertAsIs('V43')))),


        startingWithAsIs('V6', replaceWithAsIs('V65')),

        movingTo('I', insertAsIs('V65')),
        movingTo('I6', insertAsIs('V42')),
    ];

    export const subdominant = [
        // I6 passing tone
        startingWith('ii', movingTo('ii6', insert('I6'))),

        // 5-6 technique
        startingWith('IV', insert('ii6')),

        // [startingWith('IV'), 'ii', 'V']?
    ];

    export const cadential64 = [
        // not preceded by V or vii
        notStartingWith('V', notStartingWith('viio', movingToAsIs('V', insert('I64')))),
        notStartingWith('V', notStartingWith('viio', movingToAsIs('V7', insert('I64')))),
        notStartingWith('V', notStartingWith('viio', movingToAsIs('V', replaceWithAsIs('V42', insert('I64')))))
    ];

    export const submediant = [
        // 5-6 technique
        startingWith('vi', insert('IV6')),

        // not in minor
        startingWith('vi', insert('I', insertAsIs('V6'))),
        startingWith('vi', insert('I', insertAsIs('V65'))),

        // // use major IV6 in minor
        startingWith('IV6', insert('I', insertAsIs('V6'))),
        startingWith('IV6', insert('I', insertAsIs('V65'))),
    ];

    export const supertonicSevenths = [
        // I6 passing tone
        startingWith('ii', movingTo('ii65', insert('I6'))),
        startingWith('ii7', movingTo('ii65', insert('I6'))),

        startingWith('IV65', insert('I', insertAsIs('V6'))),
        startingWith('IV65', insert('I', insertAsIs('V65')))
    ];

    export const tonicSubstitutes = [
        startingWith('I', movingTo('I', insert('IV'))),
        startingWith('I6', movingTo('I6', insert('IV'))),

        startingWith('I6', movingTo('I', insert('IV'))),
        startingWith('I', movingTo('I6', insert('IV'))),
        startingWith('I', movingTo('I6', insert('IV6'))),
        startingWith('I', movingTo('I6', insert('vi'))),

        startingWithAsIs('V', movingToAsIs('V6', insert('IV6'))),
        startingWithAsIs('V', movingToAsIs('V65', insert('IV6')))
    ];

    export const secondaryDominant = [
        movingTo('V', insertAsIs('V/V')),
        movingTo('V', insertAsIs('V6/V')),
        movingTo('V', insertAsIs('V7/V')),
        movingTo('V', insertAsIs('V65/V')),
        movingTo('V', insertAsIs('V43/V')),
        movingTo('V6', insertAsIs('V43/V')),
        movingTo('V6', insertAsIs('V42/V')),
        movingTo('V', insertAsIs('viio6/V')),
        movingTo('V6', insertAsIs('viio6/V')),

        startingWith('V', movingTo('V', insertAsIs('V6/V'))),
        startingWith('V', movingTo('V', insertAsIs('V65/V'))),
        startingWith('V', movingTo('V', insertAsIs('V43/V'))),
        startingWith('V6', movingTo('V6', insertAsIs('V43/V'))),
        startingWith('V6', movingTo('V6', insertAsIs('V42/V'))),
        startingWith('V', movingTo('V', insertAsIs('viio6/V'))),
        startingWith('V6', movingTo('V6', insertAsIs('viio6/V'))),
    ];

    export const mediant = [
        startingWithAsIs('VII', movingToAsIs('V', insert('iv6'))),
        startingWithAsIs('VII', movingToAsIs('V7', insert('iv6')))
    ];

    // TODO write out more compactly
    export const sequences = [movingTo, movingToWithinSequence].flatMap(movingTo => [
        // descending fifths
        startingWith('I', movingTo('iii', sequenceInsert(['IV', 'viio']))),
        startingWith('I', movingTo('vi', sequenceInsert(['IV', 'viio', 'iii']))),
        startingWith('I', movingTo('ii', sequenceInsert(['IV', 'viio', 'iii', 'vi']))),
        startingWith('I', movingToAsIs('V', sequenceInsert(['IV', 'viio', 'iii', 'vi', 'ii']))),
        // TODO fix V here
        startingWith('I', movingTo('I', sequenceInsert(['IV', 'viio', 'iii', 'vi', 'ii', 'V']))),

        startingWith('I', movingTo('iii', sequenceInsert(['IV6', 'viio']))),
        startingWith('I', movingTo('vi', sequenceInsert(['IV6', 'viio', 'iii6']))),
        startingWith('I', movingTo('ii6', sequenceInsert(['IV6', 'viio', 'iii6', 'vi']))),
        startingWith('I', movingToAsIs('V', sequenceInsert(['IV6', 'viio', 'iii6', 'vi', 'ii6']))),
        startingWith('I', movingTo('I6', sequenceInsert(['IV6', 'viio', 'iii6', 'vi', 'ii6', 'V']))),

        // ascending 5-6
        startingWith('I', movingTo('viio', sequenceInsert(['vi', 'ii']))),
        startingWith('I', movingTo('iii', sequenceInsert(['vi', 'ii', 'viio']))),
        startingWith('I', movingTo('IV', sequenceInsert(['vi', 'ii', 'viio', 'iii']))),
        startingWith('I', movingTo('I', sequenceInsert(['vi', 'ii', 'viio', 'iii', 'I']))),
        startingWith('I', movingTo('ii', sequenceInsert(['vi', 'ii', 'viio', 'iii', 'I', 'IV']))),

        // TODO AsIs here?
        startingWith('I', movingTo('viio6', sequenceInsert(['vi6', 'ii']))),
        startingWith('I', movingTo('iii', sequenceInsert(['vi6', 'ii', 'viio6']))),
        startingWith('I', movingTo('IV6', sequenceInsert(['vi6', 'ii', 'viio6', 'iii']))),
        startingWith('I', movingTo('I', sequenceInsert(['vi6', 'ii', 'viio6', 'iii', 'I6']))),
        startingWith('I', movingTo('ii6', sequenceInsert(['vi6', 'ii', 'viio6', 'iii', 'I6', 'IV']))),

        // ascending fifths
        startingWith('I', movingTo('vi', sequenceInsert(['V', 'ii']))),
        startingWith('I', movingTo('iii', sequenceInsert(['V', 'ii', 'vi']))),
        startingWith('I', movingTo('viio', sequenceInsert(['V', 'ii', 'vi', 'iii']))),
        startingWith('I', movingTo('IV', sequenceInsert(['V', 'ii', 'vi', 'iii', 'viio']))),
        startingWith('I', movingTo('I', sequenceInsert(['V', 'ii', 'vi', 'iii', 'viio', 'IV']))),

        // skipping over iii - viio
        startingWith('I', movingTo('IV', sequenceInsert(['V', 'ii', 'vi']))),
        startingWith('I', movingTo('I', sequenceInsert(['V', 'ii', 'vi', 'IV']))),

        // ascending fifths
        startingWith('I', movingTo('vi6', sequenceInsert(['V6', 'ii']))),
        startingWith('I', movingTo('iii', sequenceInsert(['V6', 'ii', 'vi6']))),
        startingWith('I', movingTo('viio6', sequenceInsert(['V6', 'ii', 'vi6', 'iii']))),
        startingWith('I', movingTo('IV', sequenceInsert(['V6', 'ii', 'vi6', 'iii', 'viio6']))),
        startingWith('I', movingTo('I6', sequenceInsert(['V6', 'ii', 'vi6', 'iii', 'viio6', 'IV']))),

        // skipping over iii - viio
        startingWith('I', movingTo('IV', sequenceInsert(['V6', 'ii', 'vi6']))),
        startingWith('I', movingTo('I6', sequenceInsert(['V6', 'ii', 'vi6', 'IV']))),

        // descending 5-6
        startingWith('I', movingTo('iii', sequenceInsert(['V', 'vi']))),
        startingWith('I', movingTo('IV', sequenceInsert(['V', 'vi', 'iii']))),
        startingWith('I', movingTo('I', sequenceInsert(['V', 'vi', 'iii', 'IV']))),
        startingWith('I', movingTo('ii', sequenceInsert(['V', 'vi', 'iii', 'IV', 'I']))),

        startingWith('I', movingTo('iii', sequenceInsert(['V6', 'vi']))),
        startingWith('I', movingTo('IV', sequenceInsert(['V6', 'vi', 'iii6']))),
        startingWith('I', movingTo('I', sequenceInsert(['V6', 'vi', 'iii6', 'IV']))),
        startingWith('I', movingTo('ii', sequenceInsert(['V6', 'vi', 'iii6', 'IV', 'I6']))),
    ]);

    export const leadingToneSevenths = [
        startingWith('I', movingTo('I', insertAsIs('vii07'))),
        startingWith('I6', movingTo('I6', insertAsIs('vii043')))
    ];

    //TODO fix problem of vii0 instead of viio
    export const otherSeventhChords = [movingTo, movingToWithinSequence].flatMap(movingTo => [
        ...[['7','7'],['7',''],['65',''],['43',''],['43','7'],['42','63'],['42','65']].flatMap(([firstInversion, secondInversion]) => [
            // descending fifths
            startingWith(`I`, movingTo(`iii${firstInversion}`, sequenceInsert([`IV${firstInversion}`, `vii0${secondInversion}`]))),
            startingWith(`I`, movingTo(`vi${secondInversion}`, sequenceInsert([`IV${firstInversion}`, `vii0${secondInversion}`, `iii${firstInversion}`]))),
            startingWith(`I`, movingTo(`ii${firstInversion}`, sequenceInsert([`IV${firstInversion}`, `vii0${secondInversion}`, `iii${firstInversion}`, `vi${secondInversion}`]))),
            startingWith(`I`, movingToAsIs(`V${secondInversion}`, sequenceInsert([`IV${firstInversion}`, `vii0${secondInversion}`, `iii${firstInversion}`, `vi${secondInversion}`, `ii${firstInversion}`]))),
            startingWith(`I`, movingTo(`I${firstInversion}`, sequenceInsert([`IV${firstInversion}`, `vii0${secondInversion}`, `iii${firstInversion}`, `vi${secondInversion}`, `ii${firstInversion}`, `V${secondInversion}`]))),
        ]),
    ]);

    export const secondaryDominants = [
        ...['ii', 'iii', 'III', 'iv', 'IV', 'V', 'vi', 'VI', 'VII'].flatMap(root => [
            movingToAsIs(`${root}`, insertAsIs(`V/${root}`)),
            movingToAsIs(`${root}`, insertAsIs(`V6/${root}`)),
            movingToAsIs(`${root}`, insertAsIs(`V7/${root}`)),
            movingToAsIs(`${root}`, insertAsIs(`V65/${root}`)),
            movingToAsIs(`${root}`, insertAsIs(`V43/${root}`)),
            movingToAsIs(`${root}6`, insertAsIs(`V43/${root}`)),
            movingToAsIs(`${root}6`, insertAsIs(`V42/${root}`)),
            movingToAsIs(`${root}`, insertAsIs(`viio6/${root}`)),
            movingToAsIs(`${root}6`, insertAsIs(`viio6/${root}`)),
            movingToAsIs(`${root}`, insertAsIs(`viio7/${root}`)),
            movingToAsIs(`${root}6`, insertAsIs(`viio65/${root}`)),
            movingToAsIs(`${root}6`, insertAsIs(`viio43/${root}`)),
            movingToAsIs(`${root}64`, insertAsIs(`viio42/${root}`)),

            startingWithAsIs(`${root}`, movingToAsIs(`${root}`, insertAsIs(`V6/${root}`))),
            startingWithAsIs(`${root}`, movingToAsIs(`${root}`, insertAsIs(`V65/${root}`))),
            startingWithAsIs(`${root}`, movingToAsIs(`${root}`, insertAsIs(`V43/${root}`))),
            startingWithAsIs(`${root}6`, movingToAsIs(`${root}6`, insertAsIs(`V43/${root}`))),
            startingWithAsIs(`${root}6`, movingToAsIs(`${root}6`, insertAsIs(`V42/${root}`))),
            startingWithAsIs(`${root}`, movingToAsIs(`${root}`, insertAsIs(`viio6/${root}`))),
            startingWithAsIs(`${root}6`, movingToAsIs(`${root}6`, insertAsIs(`viio6/${root}`))),
            startingWithAsIs(`${root}`, movingToAsIs(`${root}`, insertAsIs(`viio7/${root}`))),
            startingWithAsIs(`${root}6`, movingToAsIs(`${root}6`, insertAsIs(`viio65/${root}`))),
            startingWithAsIs(`${root}6`, movingToAsIs(`${root}6`, insertAsIs(`viio42/${root}`))),
            startingWithAsIs(`${root}64`, movingToAsIs(`${root}64`, insertAsIs(`viio6/${root}`))),
        ]),
        // TODO move into above array and add check for diatonicized quality
        ...['III', 'IV', 'V', 'VI', 'VII'].flatMap(root => [
            startingWithAsIs(`${root}`, movingToAsIs(`${root}`, insertAsIs(`vii07/${root}`))),
            startingWithAsIs(`${root}6`, movingToAsIs(`${root}6`, insertAsIs(`vii043/${root}`)))
        ]),
    ];

    export const defaultExpansions = [...Expansion.identity, ...Expansion.basic, ...Expansion.basicInversions, ...Expansion.dominantInversions, ...Expansion.subdominant, ...Expansion.cadential64, ...Expansion.submediant, ...Expansion.tonicSubstitutes, ...Expansion.secondaryDominant, ...Expansion.secondaryDominants, ...Expansion.sequences, ...Expansion.otherSeventhChords, ...Expansion.mediant] as ExpansionOperator[];
    
    export function * matchingExpansion(scale: Scale, previous: HarmonizedChord[], option: HarmonizedChord[], expansions: ExpansionOperator[] = defaultExpansions) {
        for(const expansion of expansions) {
            try { // TODO temp fix
                const expanded = expansion(scale, option, previous);
                if(expanded.length) {
                    yield expanded;
                }
            } catch {}
        }
    }
}