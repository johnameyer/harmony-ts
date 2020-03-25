import { RomanNumeral } from '../harmony/roman-numeral';
import { AbsoluteNote } from '../note/absolute-note';

export class IncompleteChord {
    constructor({ voices, romanNumeral }: { voices?: (AbsoluteNote | undefined)[]; romanNumeral?: RomanNumeral; }) {
        if(voices) {
            this._voices = voices;
        } else {
            this._voices = [];
        }
        this._romanNumeral = romanNumeral;
    }

    protected _voices: (AbsoluteNote | undefined)[];

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