import { ScaleDegree } from "./scale-degree";
import { ChordQuality } from "../chord/chord-quality";
import { Interval } from "../interval/interval";
export class RomanNumeral {

    protected _scaleDegree!: ScaleDegree;
    protected _applied!: ScaleDegree | null;
    protected _quality!: ChordQuality;

    /**
     * Intervals above the root
     */
    protected _intervals!: Interval[];

    /**
     * Intervals above the bass
     */
    protected _figuredBass!: string;

    // TODO modal modifiers (b, #, etc)
    get name() {
        let romanNumeral = ScaleDegree.toRomanNumeral(this._scaleDegree);
        switch(this._quality) {
            case ChordQuality.DIMINISHED:
                romanNumeral = romanNumeral.toLowerCase() + "o";
                break;
            case ChordQuality.MINOR:
                romanNumeral = romanNumeral.toLowerCase();
                break;
            case ChordQuality.MAJOR:
                romanNumeral = romanNumeral;
                break;
            case ChordQuality.AUGMENTED:
                romanNumeral = romanNumeral + "+";
                break;
        }

        //TODO inversion

        if(this._applied) {
            return romanNumeral + '/' + ScaleDegree.toRomanNumeral(this._applied);
        }
        return romanNumeral;
    }

    get intervals() {
        return [...this._intervals];
    }

}