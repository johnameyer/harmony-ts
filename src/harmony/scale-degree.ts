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
    export function romanNumeralOf(scaleDegree: ScaleDegree){
        return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][scaleDegree - 1];
    }
}