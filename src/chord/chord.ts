import { Note } from '../note/note';
import { Interval } from '../interval/interval';
import { ChordQuality } from './chord-quality';
import { IntervalQuality } from '../interval/interval-quality';
import { AbsoluteNote } from '../note/absolute-note';

function isDefined <T> (value: T | undefined): value is T {
    if(value === undefined) {
        return false;
    }
    return true;
}

export class Chord {
    #soprano: AbsoluteNote;
    #alto: AbsoluteNote;
    #tenor: AbsoluteNote;
    #bass: AbsoluteNote;

    #root!: Note;
    #quality!: ChordQuality;
    #inversion!: number;
    #seventhQuality!: IntervalQuality | null;

    constructor(soprano: AbsoluteNote, alto: AbsoluteNote, tenor: AbsoluteNote, bass: AbsoluteNote) {
        this.#soprano = soprano;
        this.#alto = alto;
        this.#tenor = tenor;
        this.#bass = bass;
        this.#update();
    }

    set soprano(note: AbsoluteNote) {
        this.#soprano = note;
        this.#update();
    }

    get soprano(): AbsoluteNote {
        return this.#soprano;
    }

    set alto(note: AbsoluteNote) {
        this.#alto = note;
        this.#update();
    }

    get alto(): AbsoluteNote {
        return this.#alto;
    }

    set tenor(note: AbsoluteNote) {
        this.#tenor = note;
        this.#update();
    }

    get tenor(): AbsoluteNote {
        return this.#tenor;
    }

    set bass(note: AbsoluteNote) {
        this.#bass = note;
        this.#update();
    }

    get bass(): AbsoluteNote {
        return this.#bass;
    }

    get notes (): [AbsoluteNote, AbsoluteNote, AbsoluteNote, AbsoluteNote] {
        return [ this.soprano, this.alto, this.tenor, this.bass ];
    }

    get root(): Note {
        return this.#root;
    }

    get quality(): ChordQuality {
        return this.#quality;
    }

    get inversion(): number {
        return this.#inversion;
    }

    get seventhQuality(): IntervalQuality | null {
        return this.#seventhQuality;
    }

    #update = () => {
        const notes: Note[] = [... new Set(this.notes)].filter(isDefined);
        // TODO support nonharmonic notes
        const root = notes.find(note => {
            const modified = new AbsoluteNote(note.letterName + '0');
            const intervals: Interval[] = notes.map(note => new Interval(modified, note));
            if(intervals.findIndex(Interval.ofSize('2')) < 0 && intervals.findIndex(Interval.ofSize('4')) && intervals.findIndex(Interval.ofSize('6')) < 0) {
                return true;
            }
        });
        if(!root) {
            throw 'Must have a root';
        }
        this.#root = new AbsoluteNote(root.letterName + '0');
        const intervals: Interval[] = notes.map(other => new Interval(this.#root, other));
        const fifth = intervals.find(Interval.ofSize('5'));
        if(fifth) {
            if(fifth.quality == IntervalQuality.AUGMENTED) {
                this.#quality = ChordQuality.AUGMENTED;
            } else if(fifth.quality == IntervalQuality.DIMINISHED) {
                this.#quality = ChordQuality.DIMINISHED;
            }
        }
        const third = intervals.find(Interval.ofSize('3'));
        if(third) {
            if(third.quality == IntervalQuality.MAJOR) {
                this.#quality = ChordQuality.MAJOR;
            } else if(third.quality == IntervalQuality.MINOR) {
                this.#quality = ChordQuality.MINOR;
            }
        }
        if(this.#bass.letterName == root.letterName) {
            this.#inversion = 0;
        } else {
            const bassInterval = new Interval(new Note(root.letterName), this.#bass);
            if(bassInterval.simpleSize == '3') {
                this.#inversion = 1;
            } else if(bassInterval.simpleSize == '5') {
                this.#inversion = 2;
            } else if(bassInterval.simpleSize == '7') {
                this.#inversion = 3;
            }
        }
        const seventh = intervals.find(Interval.ofSize('7'));
        if(seventh) {
            this.#seventhQuality = seventh.quality;
        } else {
            this.#seventhQuality = null;
        }
    }
}