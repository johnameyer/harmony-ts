import { Note } from '../note/note';
import { ChordQuality } from './chord-quality';
import { RomanNumeral } from '../harmony/roman-numeral';
import { AbsoluteNote } from '../note/absolute-note';

export class IncompleteChord {
    protected _voices!: (AbsoluteNote | undefined)[];

    protected _romanNumeral: RomanNumeral | undefined;

    get voices() {
        return this._voices;
    }

    get root() {
        return this._romanNumeral?.root;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }
}