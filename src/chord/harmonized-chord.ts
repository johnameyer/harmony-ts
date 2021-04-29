import { RomanNumeral } from "../harmony/roman-numeral";
import { AbsoluteNote } from "../note/absolute-note";
import { Interval } from "../interval/interval";
import { IChord } from "./ichord";

export class HarmonizedChord implements IChord {

    protected _voices: (AbsoluteNote | undefined)[];
    protected _romanNumeral!: RomanNumeral;
    protected _flags: {[key: string]: boolean};
    protected _intervals!: (Interval | undefined)[];

    constructor({ voices, romanNumeral, flags}: { voices?: (AbsoluteNote | undefined)[]; romanNumeral: RomanNumeral; flags?: {[key: string]: boolean} }) {
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

    get intervals() {
        if(!this._intervals) {
            this._intervals = this._voices.map(note => note ? new Interval(this._romanNumeral.root, note) : undefined);
        }
        return this._intervals;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }

    get romanNumeralFinalized(): boolean {
        return true;
    }

    get flags() {
        return this._flags;
    }
}