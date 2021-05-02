import { AbsoluteNote } from '../note/absolute-note';
import { Interval } from '../interval/interval';

/**
 * Describes the motion between two voices
 */
export enum Motion {
    /**
     * Two voices moving up or down together by the same diatonic distance
     */
    PARALLEL,
    /**
     * Two voices moving up or down together by different distances
     */
    SIMILAR,
    /**
     * One voice moving and one voice remaining the same
     */
    OBLIQUE,
    /**
     * Voices moving in opposite directions
     */
    CONTRARY,
}
export namespace Motion {
    export const names = ['PARALLEL', 'SIMILAR', 'OBLIQUE', 'CONTRARY'];

    export function toString(motion: Motion) {
        return names[motion];
    }

    export function fromString(motion: string) {
        return names.indexOf(motion.toUpperCase());
    }

    export function from(lowerPrev: AbsoluteNote, lowerNext: AbsoluteNote, upperPrev: AbsoluteNote, upperNext: AbsoluteNote) {
        if(lowerPrev.midi == lowerNext.midi && upperPrev.midi == upperNext.midi) {
            return Motion.PARALLEL;
        }
        if(lowerPrev.midi == lowerNext.midi || upperPrev.midi == upperNext.midi) {
            return Motion.OBLIQUE;
        }
        if(Math.sign(lowerPrev.midi - lowerNext.midi) == Math.sign(upperPrev.midi - upperNext.midi)) {
            const lower = new Interval(lowerPrev, lowerNext);
            const upper = new Interval(upperPrev, upperNext);
            if(lower.simpleSize === upper.simpleSize) {
                return Motion.PARALLEL;
            }
            return Motion.SIMILAR;
        }
        return Motion.CONTRARY;
    }
}