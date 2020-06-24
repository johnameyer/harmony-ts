import { RomanNumeral } from "../harmony/roman-numeral";
import { AbsoluteNote } from "../note/absolute-note";
import { HarmonicFunction } from "../harmony/harmonic-function";

export class HarmonizedChord {

    protected _voices: AbsoluteNote[];
    protected _romanNumeral!: RomanNumeral;
    protected _harmonicFunction!: HarmonicFunction | undefined;
    protected _flags: {[key: string]: boolean};

    constructor(voices: AbsoluteNote[], romanNumeral: RomanNumeral, flags: {[key: string]: boolean} = {}, harmonicFunction?: HarmonicFunction) {
        this._voices = voices;
        this._romanNumeral = romanNumeral;
        this._flags = flags;
    }

    get voices() {
        return this._voices;
    }

    get romanNumeral() {
        return this._romanNumeral;
    }

    get harmonicFunction(): HarmonicFunction {
        // TODO rewrite
        // if(!this._harmonicFunction) {
        //     switch(this.romanNumeral.scaleDegree) {
        //         case ScaleDegree.TONIC:
        //             return HarmonicFunction.TONIC;
        //         case ScaleDegree.DOMINANT:
        //         case ScaleDegree.SUBTONIC:
        //             return HarmonicFunction.DOMINANT;
        //         case ScaleDegree.SUPERTONIC:
        //         case ScaleDegree.SUBDOMINANT:
        //             return HarmonicFunction.PREDOMINANT;
        //     }
        //     return HarmonicFunction.PREDOMINANT;
        // }
        return this._harmonicFunction || HarmonicFunction.PREDOMINANT;
    }

    get flags() {
        return this._flags;
    }
}