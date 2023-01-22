/**
 * Class that defines a time signature
 */
// TODO rewrite using a proper immutable class interface
export type TimeSignature = [ beats: number, beatType: number ];

let timeSignatureMemo: TimeSignature | null = null;
let timeSignatureBeatsMemo: number[] = [];

export namespace TimeSignature {
    export const COMMON_TIME = [ 4, 4 ] as TimeSignature;

    export const CUT_TIME = [ 2, 2 ] as TimeSignature;

    export function getBeatsStrength(timeSignature: TimeSignature): number[] {
        // TODO support compound time
        if(timeSignature[1] !== 2 && timeSignature[1] !== 4 || timeSignature[0] > 4) {
            throw 'Does not currently support compound or complex time signatures';
        }
        if(timeSignature[1] < 4) {
            return Array(timeSignature[0]).fill(0)
                .map((_, index) => index);
        }

        return [ 0, 2, 1, 3 ];
    }

    export function getBeatStrength(beat: number, timeSignature: TimeSignature): number {
        if(timeSignatureMemo !== timeSignature) {
            timeSignatureMemo = timeSignature;
            timeSignatureBeatsMemo = getBeatsStrength(timeSignature);
        }
        return timeSignatureBeatsMemo[beat % timeSignature[0]];
    }   
}

export interface TimeSignatureContext {
    timeSignature: TimeSignature,

    // TODO pickup
}
