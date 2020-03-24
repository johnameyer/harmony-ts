export enum IntervalQuality {
    DIMINISHED = -2,
    MINOR = -1,
    PERFECT = 0,
    MAJOR = 1,
    AUGMENTED = 2,
}

export namespace IntervalQuality {
    export const names = ['d', 'm', 'P', 'M', 'A'];

    export function toString(intervalQuality: IntervalQuality): string {
        return names[intervalQuality + 2];
    }

    export function fromString(intervalQuality: string) {
        return names.indexOf(intervalQuality) - 2;
    }

    export function invert(intervalQuality: IntervalQuality) {
        return IntervalQuality[-intervalQuality];
    }
}
