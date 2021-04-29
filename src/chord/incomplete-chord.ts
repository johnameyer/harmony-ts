import { RomanNumeral } from '../harmony/roman-numeral';
import { AbsoluteNote } from '../note/absolute-note';
import { Interval } from '../interval/interval';
import { IChord } from './ichord';

export class IncompleteChord implements IChord {
    protected _voices: (AbsoluteNote | undefined)[];
    protected _romanNumeral: RomanNumeral | undefined;
    protected _flags: {[key: string]: boolean};
    protected _intervals: (Interval | undefined)[] | undefined;

    constructor({ voices, romanNumeral, flags}: { voices?: (AbsoluteNote | undefined)[]; romanNumeral?: RomanNumeral; flags?: {[key: string]: boolean} }) {
        if(voices) {
            this._voices = voices;
        } else {
            // TODO how to enforce certain number of voices being present?
            this._voices = [];
        }
        this._romanNumeral = romanNumeral;
        this._flags = flags || {};
    }

    get voices() {
        return this._voices;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }

    get romanNumeralFinalized(): boolean {
        return false;
    }

    get flags(): {[key: string]: boolean} {
        return this._flags;
    }

    get intervals() {
        const root = this._romanNumeral?.root;
        if(!this._intervals && root) {
            this._intervals = this._voices.map(note => note ? new Interval(root, note) : undefined);
        }
        return this._intervals;
    }
}