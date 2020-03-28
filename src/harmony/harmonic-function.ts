export enum HarmonicFunction {
    TONIC,
    PREDOMINANT,
    DOMINANT
}
export namespace HarmonicFunction {
    export const names = ['TONIC', 'PREDOMINANT', 'DOMINANT'];
    
    export const abbreviations = ['T', 'P', 'D'];

    export function toString(harmonicFunction: HarmonicFunction) {
        return names[harmonicFunction];
    }

    export function fromString(harmonicFunction: string) {
        return names.indexOf(harmonicFunction.toUpperCase());
    }

    export function toAbbreviation(harmonicFunction: HarmonicFunction) {
        return abbreviations[harmonicFunction];
    }

    export function fromAbbreviation(harmonicFunction: string) {
        return abbreviations.indexOf(harmonicFunction.toUpperCase());
    }
}