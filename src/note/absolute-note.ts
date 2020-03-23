import { Note } from './note';
import { Accidental } from '../accidental';
import { Scale } from '../scale';

export class AbsoluteNote extends Note {
    private _octave!: number;
    private _midi!: number;

    get name(): string {
        return this._letter + Accidental.toString(this._accidental) + this._octave;
    }

    parseValue() {
        const match = this.value.match(new RegExp('^([a-zA-Z])(#{1,2}|b{1,2}|)?([0-9])$'));
        if(match == null) {
            throw this.value + ' is invalid';
        }
        let accidental, octave;
        [this._letter, accidental, octave] = match.slice(1);
        this._accidental = Accidental.fromString(accidental || '');
        this._octave = Number(octave);
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
}