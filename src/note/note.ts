import { Accidental } from "../accidental";
import { Scale } from "../scale";

export class Note {
    protected _letter!: string;
    protected _accidental!: Accidental;
    
    constructor(protected value: string) {
        this.parseValue();
    }

    get chromaticPosition(): number {
        return (Scale.Major.semitones[Scale.Major.notes.indexOf(this._letter)] + this._accidental + 12) % 12;
    }
    get letterName(): string {
        return this._letter;
    }

    get accidental(): Accidental {
        return this._accidental;
    }

    get name(): string {
        return this._letter + Accidental.toString(this._accidental);
    }

    parseValue() {
        const match = this.value.match(new RegExp('^([a-zA-Z])(#{1,2}|b{1,2}|)?'));
        if(match == null) {
            throw name + ' is invalid';
        }
        let accidental;
        [this._letter, accidental] = match.slice(1);
        this._accidental = Accidental.fromString(accidental || '');
    }

    get absolute(): boolean {
        return false;
    }
}