import { ScaleDegree } from "./scale-degree";
import { ChordQuality } from "../chord/chord-quality";
import { Interval } from "../interval/interval";
import { Note } from "../note/note";
import { IntervalQuality } from "../interval/interval-quality";
import { Scale } from "../scale";

function qualityOfScalarInterval(lower: ScaleDegree, upper: ScaleDegree, scale: Scale) {
    return new Interval(new Note(scale[lower]), new Note(scale[upper]));
}

function qualityOfScalarIntervalBuiltOn(scaleDegree: ScaleDegree, size: number, scale: Scale) {
    return qualityOfScalarInterval(scaleDegree, (scaleDegree + size - 1) % 7, scale);
}


export class RomanNumeral {

    protected _name!: string;

    protected _scaleDegree: ScaleDegree;
    protected _inversion: number;
    protected _inversionInterval: Interval;
    protected _quality: ChordQuality;

    protected _symbol: string;

    protected _seventh: boolean;

    // protected _accidental!: Accidental;
    protected _applied!: ScaleDegree | null;

    protected _scale: string[];

    /**
     * Intervals above the root
     */
    protected _intervals!: Interval[];

    /**
     * Intervals above the bass
     */
    protected _figuredBass!: string;

    constructor(value: string, scale: string[]) {
        this._name = value;
        this._scale = scale;
        const match = value.match(/^(?:(VI{0,2}|I{1,3}|IV)(\+)?|(vi{0,2}|i{1,3}|iv)(o|0)?)(?:(53|63?|64)|(7(?:53)?|653?|6?43|6?42))?(?:\/(VI{0,2}|I{2,3}|IV|vi{0,2}|i{2,3}|iv))?$/);
        if(!match) {
            throw new Error('Invalid roman numeral ' + value);
        }
        const [scaleDegreeMajor, augmented, scaleDegreeMinor, diminished, intervals, seventhIntervals, applied] = match.slice(1);
        this._scaleDegree = ScaleDegree.fromRomanNumeral(scaleDegreeMajor || scaleDegreeMinor);
        this._applied = ScaleDegree.fromRomanNumeral(applied || 'I');
        if(this._applied === ScaleDegree.TONIC) {
            this._applied = null;
        }

        this._symbol = scaleDegreeMajor ? (scaleDegreeMajor + (augmented || '')) : (scaleDegreeMinor + (diminished || ''));
        this._quality = scaleDegreeMajor ? (augmented ? ChordQuality.AUGMENTED : ChordQuality.MAJOR) : (diminished ? ChordQuality.DIMINISHED : ChordQuality.MINOR);  

        this._intervals = [new Interval(IntervalQuality.PERFECT, 1)];

        let third = IntervalQuality.MAJOR;
        let fifth = IntervalQuality.PERFECT;

        switch(this._quality) {
            case ChordQuality.AUGMENTED:
                fifth = IntervalQuality.AUGMENTED;
                break;
            case ChordQuality.MAJOR:
                break;
            case ChordQuality.MINOR:
                third = IntervalQuality.MINOR;
                break;
            case ChordQuality.DIMINISHED:
                third = IntervalQuality.MINOR;
                fifth = IntervalQuality.DIMINISHED;
                break;
        }
        this._intervals.push(new Interval(third, 3), new Interval(fifth, 5));
        this._seventh = false;
        if(seventhIntervals) {
            this._seventh = true;
            let seventh = IntervalQuality.MINOR;
            switch(this._quality) {
                case ChordQuality.AUGMENTED:
                    seventh = IntervalQuality.MAJOR;
                    break;
                case ChordQuality.MAJOR:
                    if(scaleDegreeMajor !== 'V') {
                        seventh = IntervalQuality.MAJOR;
                    }
                    break;
                case ChordQuality.MINOR:
                    break;
                case ChordQuality.DIMINISHED:
                    if(diminished == 'o') {
                        seventh = IntervalQuality.DIMINISHED;
                    }
                    break;
            }
            this._intervals.push(new Interval(seventh, 7));
        }
        if((!intervals && !seventhIntervals) || intervals == '5' || intervals == '53' || seventhIntervals == '7' || seventhIntervals == '753') {
            this._inversion = 0;
        } else if(intervals == '6' || intervals == '63' || seventhIntervals == '65' || seventhIntervals == '653') {
            this._inversion = 1;
        } else if(intervals == '64' || seventhIntervals == '643' || seventhIntervals == '43') {
            this._inversion = 2;
        } else if(seventhIntervals == '642' || seventhIntervals == '42') {
            this._inversion = 3;
        } else {
            throw new Error('Unknown inversion symbol ' + intervals);
        }
        this._inversionInterval = this._intervals[this._inversion];

        if(this._applied !== null) {
            if((this._scaleDegree !== ScaleDegree.DOMINANT && this._scaleDegree !== ScaleDegree.SUBTONIC)
                || (this._scaleDegree === ScaleDegree.DOMINANT && this._quality !== ChordQuality.MAJOR)
                || (this._scaleDegree === ScaleDegree.SUBTONIC && this._quality !== ChordQuality.DIMINISHED)) {
                throw new Error('Only V and viio can be applied chords, tried to apply ' + this._symbol);
            }
        }
    }

    get name() {
        return this._name;
    }

    get symbol() {
        return this._symbol;
    }

    get intervals() {
        return [...this._intervals];
    }

    get notes() {
        return this.intervals.map(interval => interval.transposeUp(this.root));
    }

    get root(): Note {
        if(this.symbol == 'V') {
            // dominant 5 is always built on the fifth of the tonic triad
            if(this._applied) {
                return new Interval('P5').transposeUp(new Note(this._scale[this._applied - 1]));
            }
            return new Interval('P5').transposeUp(new Note(this._scale[0]));
        } else if(this.symbol == 'viio' || this.symbol == 'vii0'){
            // leading tone is always a semitone below the note
            if(this._applied) {
                return new Interval('m2').transposeDown(new Note(this._scale[this._applied - 1]));
            }
            return new Interval('m2').transposeDown(new Note(this._scale[0]));
        }
        return new Note(this._scale[this._scaleDegree - 1]);
    }

    get inversion(): number {
        return this._inversion;
    }

    get inversionInterval(): Interval {
        return this._inversionInterval;
    }

    get hasSeventh(): boolean {
        return this._seventh;
    }

    get quality() {
        return this._quality;
    }

    get inversionSymbol(): string[] {
        // TODO handle flats and sharps
        if(this.hasSeventh) {
            if(this._inversionInterval.simpleSize == 'U') {
                return ['7', ''];
            } else if(this._inversionInterval.simpleSize == '3') {
                return ['6', '5'];
            } else if(this._inversionInterval.simpleSize == '5') {
                return ['4', '3'];
            } else if(this._inversionInterval.simpleSize == '7') {
                return ['4', '2'];
            }
        } else {
            if(this._inversionInterval.simpleSize == 'U') {
                return ['', ''];
            } else if(this._inversionInterval.simpleSize == '3') {
                return ['6', ''];
            } else if(this._inversionInterval.simpleSize == '5') {
                return ['6', '4'];
            }
        }
        return ['',''];
    }

    get inversionString() {
        return this.inversionSymbol.join('');
    }

    get applied() {
        return this._applied ? ScaleDegree.toRomanNumeral(this._applied) : null;
    }
}