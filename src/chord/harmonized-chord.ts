import { RomanNumeral } from "../harmony/roman-numeral";
import { AbsoluteNote } from "../note/absolute-note";
import { HarmonicFunction } from "../harmony/harmonic-function";
import { Interval } from "../interval/interval";
import { IChord } from "./ichord";

export class HarmonizedChord implements IChord {

    protected _voices: AbsoluteNote[];
    protected _romanNumeral!: RomanNumeral;
    protected _harmonicFunction!: HarmonicFunction | undefined;
    protected _flags: {[key: string]: boolean};
    protected _intervals: Interval[] | undefined;

    constructor(voices: AbsoluteNote[], romanNumeral: RomanNumeral, flags: {[key: string]: boolean} = {}, harmonicFunction?: HarmonicFunction) {
        this._voices = voices;
        this._romanNumeral = romanNumeral;
        this._flags = flags;
    }

    get voices() {
        return this._voices;
    }

    get intervals() {
        if(!this._intervals) {
            this._intervals = this._voices.map(note => new Interval(this._romanNumeral.root, note));
        }
        return this._intervals;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }

    get flags() {
        return this._flags;
    }
}