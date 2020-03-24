import { RomanNumeral } from "../harmony/roman-numeral";
import { AbsoluteNote } from "../note/absolute-note";

export class HarmonizedChord {

    protected _voices: AbsoluteNote[];
    protected _romanNumeral!: RomanNumeral;

    constructor(voices: AbsoluteNote[], romanNumeral: RomanNumeral) {
        this._voices = voices;
        this._romanNumeral = romanNumeral;
    }

    get voices() {
        return this._voices;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }
}