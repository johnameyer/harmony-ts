import { Chord } from "./chord";
import { RomanNumeral } from "../harmony/roman-numeral";

export class HarmonizedChord extends Chord {
    protected _romanNumeral!: RomanNumeral;

    get romanNumeral() {
        return this._romanNumeral;
    }
}