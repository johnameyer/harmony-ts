export enum ScaleDegree {
    TONIC = 1,
    SUPERTONIC = 2,
    MEDIANT = 3,
    SUBDOMINANT = 4,
    DOMINANT = 5,
    SUBMEDIANT = 6,
    SUBTONIC = 7
}

export namespace ScaleDegree {
    export const romanNumerals = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII' ];
    
    export function toRomanNumeral(scaleDegree: ScaleDegree) {
        return romanNumerals[scaleDegree - 1];
    }

    export function fromRomanNumeral(romanNumeral: string) {
        const index = romanNumerals.indexOf(romanNumeral.toUpperCase());
        if(index < 0) {
            throw 'Invalid scale degree ' + romanNumeral;
        }
        return index + 1;
    }

    export const ALIASED = Object.freeze(Object.fromEntries(romanNumerals.map((romanNumeral, index) => [ romanNumeral, index + 1 as ScaleDegree ])));
}
