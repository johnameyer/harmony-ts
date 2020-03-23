export enum Accidental {
    DOUBLE_FLAT = -2,
    FLAT = -1,
    NATURAL = 0,
    SHARP = 1,
    DOUBLE_SHARP = 2
}

export namespace Accidental {
    export function toString(accidental: Accidental): string {
        return ['bb', 'b', '', '#', '##'][accidental + 2];
    }

    export function fromString(string: string): Accidental {
        return ['bb', 'b', '', '#', '##'].indexOf(string) - 2;
    }
}