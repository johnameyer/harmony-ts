import { Note } from "../note/note";
import { AbsoluteNote } from "../note/absolute-note";
import { Interval } from "../interval/interval";

export enum Motion {
    PARALLEL,
    SIMILAR,
    OBLIQUE,
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