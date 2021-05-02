import { AbsoluteNote } from '../note/absolute-note';
import { Interval } from './interval';
import { IntervalQuality } from './interval-quality';
import { Scale } from '../scale';

export class ComplexInterval extends Interval {
    protected _complexSize!: number;

    constructor(one: AbsoluteNote, two: AbsoluteNote) {
        if(two.midi < one.midi) {
            throw 'Expected the second note to be higher than the first';
        }
        super(one, two);
        this._complexSize = this._simpleSize;

        if(Scale.Major.notes.indexOf(one.letterName) <= Scale.Major.notes.indexOf(two.letterName)) {
            for(let i = one.octavePosition; i < two.octavePosition; i++) {
                this._complexSize = this._complexSize + 7;
            }
        } else {
            for(let i = one.octavePosition + 1; i < two.octavePosition; i++) {
                this._complexSize = this._complexSize + 7;
            }
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
        const octaveDisplacement = (this._complexSize - this._simpleSize) / 7 +
            (Scale.Major.notes.indexOf(note.letterName) > Scale.Major.notes.indexOf(result.letterName) ? 1 : 0);
        return new AbsoluteNote(result.letterName, result.accidental, result.octavePosition + octaveDisplacement);
    }

    transposeDown(note: AbsoluteNote): AbsoluteNote {
        const transposed = super.transposeDown(note);
        const result = new AbsoluteNote(transposed.letterName, transposed.accidental, note.octavePosition);
        const octaveDisplacement = (this._complexSize - this._simpleSize) / 7 +
            (Scale.Major.notes.indexOf(note.letterName) < Scale.Major.notes.indexOf(result.letterName) ? 1 : 0);
        return new AbsoluteNote(result.letterName, result.accidental, result.octavePosition - octaveDisplacement);
    }
}