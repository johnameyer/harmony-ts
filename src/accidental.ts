export enum Accidental {
    DOUBLE_FLAT = -2,
    FLAT = -1,
    NATURAL = 0,
    SHARP = 1,
    DOUBLE_SHARP = 2
}

export namespace Accidental {
    export const names = ['bb', 'b', '', '#', '##'];

    export function toString(accidental: Accidental): string {
        return names[accidental + 2];
    }

    export function fromString(string: string): Accidental {
        return names.indexOf(string) - 2;
    }
}