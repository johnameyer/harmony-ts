import { Note } from '../note/note';
import { Interval } from '../interval/interval';
import { ChordQuality } from './chord-quality';
import { IntervalQuality } from '../interval/interval-quality';
import { AbsoluteNote } from '../note/absolute-note';
import { isDefined } from '../util';

export class Chord {
    protected _notes: Note[];

    protected _root!: Note;

    protected _quality: ChordQuality | undefined;

    protected _seventhQuality!: IntervalQuality | null;

    constructor(notes: Note[]) {
        this._notes = notes;
        this._update();
    }

    get seventhQuality(): IntervalQuality | null {
        return this._seventhQuality;
    }

    protected _update = () => {
        const notes: Note[] = [ ... new Set(this._notes) ].filter(isDefined);
        // TODO support nonharmonic notes
        const root = notes.find(note => {
            const modified = new AbsoluteNote(note.letterName, note.accidental, 0);
            const intervals: Interval[] = notes.map(note => new Interval(modified, note));
            if(intervals.findIndex(Interval.ofSize('2')) < 0 && intervals.findIndex(Interval.ofSize('4')) && intervals.findIndex(Interval.ofSize('6')) < 0) {
                return true;
            }
        });
        if(!root) {
            throw 'Must have a root';
        }
        this._root = new Note(root.letterName, root.accidental);
        const intervals: Interval[] = notes.map(other => new Interval(this._root, other));
        const fifth = intervals.find(Interval.ofSize('5'));
        if(fifth) {
            if(fifth.quality == IntervalQuality.AUGMENTED) {
                this._quality = ChordQuality.AUGMENTED;
            } else if(fifth.quality == IntervalQuality.DIMINISHED) {
                this._quality = ChordQuality.DIMINISHED;
            }
        }
        const third = intervals.find(Interval.ofSize('3'));
        if(third) {
            if(third.quality == IntervalQuality.MAJOR) {
                this._quality = ChordQuality.MAJOR;
            } else if(third.quality == IntervalQuality.MINOR) {
                this._quality = ChordQuality.MINOR;
            }
        }
        /*
         * if(this._bass.letterName == root.letterName) {
         *     this._inversion = 0;
         * } else {
         *     const bassInterval = new Interval(new Note(root.letterName), this._bass);
         *     if(bassInterval.simpleSize == '3') {
         *         this._inversion = 1;
         *     } else if(bassInterval.simpleSize == '5') {
         *         this._inversion = 2;
         *     } else if(bassInterval.simpleSize == '7') {
         *         this._inversion = 3;
         *     }
         * }
         */
        const seventh = intervals.find(Interval.ofSize('7'));
        if(seventh) {
            this._seventhQuality = seventh.quality;
        } else {
            this._seventhQuality = null;
        }
    }

    get quality() {
        return this._quality;
    }
}
