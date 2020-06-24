import { RomanNumeral } from '../harmony/roman-numeral';
import { AbsoluteNote } from '../note/absolute-note';
import { HarmonicFunction } from '../harmony/harmonic-function';

export class IncompleteChord {
    constructor({ voices, romanNumeral, harmonicFunction, flags}: { voices?: (AbsoluteNote | undefined)[]; romanNumeral?: RomanNumeral; harmonicFunction?: HarmonicFunction, flags?: {[key: string]: boolean} }) {
        if(voices) {
            this._voices = voices;
        } else {
            this._voices = [];
        }
        this._romanNumeral = romanNumeral;
        this._harmonicFunction = harmonicFunction;
        this._flags = flags || {};
    }

    protected _voices: (AbsoluteNote | undefined)[];

    protected _romanNumeral: RomanNumeral | undefined;
    
    protected _harmonicFunction: HarmonicFunction | undefined;

    protected _flags: {[key: string]: boolean};

    get voices() {
        return this._voices;
    }

    get root() {
        return this._romanNumeral?.root;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }

    get harmonicFunction() {
        return this._harmonicFunction;
    }

    get flags(): {[key: string]: boolean} {
        return this._flags;
    }
}