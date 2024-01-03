import { AbsoluteNote } from '../note/absolute-note';
import { Interval } from './interval';
import { IntervalQuality } from './interval-quality';
import { scalePosition } from '../util/scale-position';

export class ComplexInterval extends Interval {
    protected _complexSize!: number;

    constructor(one: AbsoluteNote, two: AbsoluteNote) {
        if(two.midi < one.midi) {
            throw 'Expected the second note to be higher than the first';
        }
        super(one, two);
        this._complexSize = this._simpleSize;

        if(scalePosition(one.letterName) <= scalePosition(two.letterName)) {
            this._complexSize += 7 * (two.octavePosition - one.octavePosition);
        } else {
            this._complexSize += 7 * Math.max(two.octavePosition - one.octavePosition - 1, 0);
        }
    }

    get name() {
        return IntervalQuality.toString(this._quality) + this.complexSize;
    }

    get complexSize() {
        if(this._complexSize == 1) {
            return 'U';
        }
        return String(this._complexSize);
    }

    transposeUp(note: AbsoluteNote): AbsoluteNote {
        const transposed = super.transposeUp(note);
        const result = new AbsoluteNote(transposed.letterName, transposed.accidental, note.octavePosition);
        const octaveDisplacement = (this._complexSize - this._simpleSize) / 7
            + (scalePosition(note.letterName) > scalePosition(result.letterName) ? 1 : 0);
        return new AbsoluteNote(result.letterName, result.accidental, result.octavePosition + octaveDisplacement);
    }

    transposeDown(note: AbsoluteNote): AbsoluteNote {
        const transposed = super.transposeDown(note);
        const result = new AbsoluteNote(transposed.letterName, transposed.accidental, note.octavePosition);
        const octaveDisplacement = (this._complexSize - this._simpleSize) / 7
            + (scalePosition(note.letterName) < scalePosition(result.letterName) ? 1 : 0);
        return new AbsoluteNote(result.letterName, result.accidental, result.octavePosition - octaveDisplacement);
    }
}
