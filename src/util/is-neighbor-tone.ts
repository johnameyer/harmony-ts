import { ComplexInterval } from "../interval/complex-interval";
import { AbsoluteNote } from "../note/absolute-note";

export function isNeighborTone(first: AbsoluteNote, second: AbsoluteNote, third: AbsoluteNote) {
    if(first.letterName === third.letterName) {
        // neighbor tone in bass
        try {
            if(new ComplexInterval(first, second).complexSize === '2') {
                return true;
            }
        } catch {}
        try {
            if(new ComplexInterval(second, first).complexSize === '2') {
                return true;
            }
        } catch {}
    }
    return false;
}