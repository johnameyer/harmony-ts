import { ComplexInterval } from "../interval/complex-interval";
import { AbsoluteNote } from "../note/absolute-note";

export function isPassingTone(first: AbsoluteNote, second: AbsoluteNote, third: AbsoluteNote) {
    if(first.midi < third.midi) {
        try {
            if(new ComplexInterval(first, second).complexSize === '2' && new ComplexInterval(second, third).complexSize === '2') {
                return true;
            }
        } catch {}
    } else {
        try {
            if(new ComplexInterval(third, second).complexSize === '2' && new ComplexInterval(second, third).complexSize === '2') {
                return true;
            }
        } catch {}
    }
    return false;
}