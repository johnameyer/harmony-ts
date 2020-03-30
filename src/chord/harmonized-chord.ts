import { RomanNumeral } from "../harmony/roman-numeral";
import { AbsoluteNote } from "../note/absolute-note";
import { HarmonicFunction } from "../harmony/harmonic-function";
import { ScaleDegree } from "../harmony/scale-degree";

export class HarmonizedChord {

    protected _voices: AbsoluteNote[];
    protected _romanNumeral!: RomanNumeral;
    protected _harmonicFunction!: HarmonicFunction | undefined;

    constructor(voices: AbsoluteNote[], romanNumeral: RomanNumeral, harmonicFunction?: HarmonicFunction) {
        this._voices = voices;
        this._romanNumeral = romanNumeral;
    }

    get voices() {
        return this._voices;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }

    get harmonicFunction(): HarmonicFunction {
        if(!this._harmonicFunction) {
            switch(this.romanNumeral.scaleDegree) {
                case ScaleDegree.TONIC:
                    return HarmonicFunction.TONIC;
                case ScaleDegree.DOMINANT:
                case ScaleDegree.SUBTONIC:
                    return HarmonicFunction.DOMINANT;
                case ScaleDegree.SUPERTONIC:
                case ScaleDegree.SUBDOMINANT:
                    return HarmonicFunction.PREDOMINANT;
            }
            return HarmonicFunction.PREDOMINANT;
        }
        return this.harmonicFunction;
    }
}