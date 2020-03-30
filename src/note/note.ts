import { Accidental } from "../accidental";

// TODO again fix for circular dependencies
const notes: string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const semitones = [0, 2, 4, 5, 7, 9, 11, 12];

export class Note {
    protected _letter!: string;
    protected _accidental!: Accidental;
    
    constructor(protected value: string) {
        this.parseValue();
    }

    get chromaticPosition(): number {
        return (semitones[notes.indexOf(this._letter)] + this._accidental + 12) % 12;
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

    parseValue() {
        const match = this.value.match(/^([a-zA-Z])(#{1,2}|b{1,2}|)?/);
        if(match == null) {
            throw this.value + ' is invalid';
        }
        let accidental;
        [this._letter, accidental] = match.slice(1);
        this._accidental = Accidental.fromString(accidental || '');
    }

    get absolute(): boolean {
        return false;
    }

    public applyAccidental(accidental: Accidental) {
        return new Note(this.letterName + Accidental.toString(this.accidental + accidental));
    }
}