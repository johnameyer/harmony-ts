import { Note } from '../note/note';
import { ChordQuality } from './chord-quality';
import { RomanNumeral } from '../harmony/roman-numeral';
import { AbsoluteNote } from '../note/absolute-note';

export class IncompleteChord {
    protected _soprano: AbsoluteNote | undefined;
    protected _alto: AbsoluteNote | undefined;
    protected _tenor: AbsoluteNote | undefined;
    protected _bass: AbsoluteNote | undefined;

    protected _root: Note | undefined;
    protected _quality: ChordQuality | undefined;
    protected _inversion: number | undefined;

    protected _romanNumeral: RomanNumeral | undefined;

    get soprano() {
        return this._soprano;
    }

    get alto() {
        return this._alto;
    }

    get tenor() {
        return this._tenor;
    }

    get bass() {
        return this._bass;
    }

    get notes() {
        return [this.soprano, this.alto, this.tenor, this.bass];
    }

    get root() {
        return this._root;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }
}