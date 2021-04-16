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
        if(accidental > 2 || accidental < -2) {
            throw 'Accidental outside of expected range ' + accidental;
        }
        return names[accidental + 2];
    }

    export function fromString(accidental: string): Accidental | undefined {
        const index = names.indexOf(accidental);
        if(index == -1) {
            return undefined;
        }
        return index - 2;
    }
}