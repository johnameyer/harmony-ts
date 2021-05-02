import { Note } from './note';
import { Accidental } from '../accidental';
import { Scale } from '../scale';

export class AbsoluteNote extends Note {
    private _midi!: number;

    get name(): string {
        return this._letter + Accidental.toString(this._accidental) + this._octave;
    }

    constructor(_letter: string, _accidental: Accidental, protected _octave: number) {
        super(_letter, _accidental);
        this._midi = Scale.Major.semitones[Scale.Major.notes.indexOf(this._letter)] + this._accidental + 12 * Number(this._octave) + 12;
    }

    get midi(): number {
        return this._midi;
    }

    get octavePosition(): number {
        return this._octave;
    }

    
    get absolute(): boolean {
        return true;
    }

    static getClosest(noteToFind: Note, close: AbsoluteNote) {
        // TODO more sophisticated math
        if(Scale.Major.notes.indexOf(close.letterName) > Scale.Major.notes.length / 2) {
            const one = new AbsoluteNote(noteToFind.letterName, noteToFind.accidental, close.octavePosition);
            const two = new AbsoluteNote(noteToFind.letterName, noteToFind.accidental, (close.octavePosition + 1));
            if(Math.abs(one.midi - close.midi) < Math.abs(two.midi - close.midi)) {
                return one;
            } else {
                return two;
            }
        } else {
            const one = new AbsoluteNote(noteToFind.letterName, noteToFind.accidental, (close.octavePosition - 1));
            const two = new AbsoluteNote(noteToFind.letterName, noteToFind.accidental, close.octavePosition);
            if(Math.abs(one.midi - close.midi) < Math.abs(two.midi - close.midi)) {
                return one;
            } else {
                return two;
            }
        }
    }
    
    static fromString(note: string): AbsoluteNote {
        const match = note.match(/^([a-zA-Z])(#{1,2}|b{1,2}|)?([0-9])$/);
        if(match == null) {
            throw note + ' is invalid';
        }
        const [letter, accidentalString, octaveString] = match.slice(1);
        const accidental = Accidental.fromString(accidentalString || '');
        const octave = Number(octaveString);
        return new AbsoluteNote(letter, accidental, octave);
    }
}