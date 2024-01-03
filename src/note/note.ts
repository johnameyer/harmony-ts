import { Accidental } from '../accidental';
import { scalePosition } from '../util/scale-position';

// TODO again fix for circular dependencies
const notes: string[] = [ 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C' ];
const semitones = [ 0, 2, 4, 5, 7, 9, 11, 12 ];

export class Note {
    constructor(protected _letter: string, protected _accidental: Accidental) {
        // TODO move to letter enum
        if(_letter.length !== 1 || _letter.toLowerCase() < 'a' || _letter.toLowerCase() > 'g') {
            throw _letter + ' is not [A-Ga-g]';
        }
    }

    get chromaticPosition(): number {
        return (semitones[scalePosition(this._letter)] + this._accidental + 12) % 12;
    }

    get letterName(): string {
        return this._letter;
    }

    get accidental(): Accidental {
        return this._accidental;
    }

    get simpleName(): string {
        return this._letter + Accidental.toString(this._accidental);
    }

    get name(): string {
        return this.simpleName;
    }

    get absolute(): boolean {
        return false;
    }

    public applyAccidental(accidental: Accidental) {
        return new Note(this.letterName, this.accidental + accidental);
    }
    
    static fromString(note: string): Note {
        const match = note.match(/^([a-gA-G])(#{1,2}|b{1,2}|)?/);
        if(match == null) {
            throw note + ' is invalid';
        }
        const [ letter, accidentalString ] = match.slice(1);
        const accidental = Accidental.fromString(accidentalString || '') || Accidental.NATURAL;

        return new Note(letter, accidental);
    }
}
