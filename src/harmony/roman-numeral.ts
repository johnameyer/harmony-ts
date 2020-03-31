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
    protected _inversion: Interval;
    protected _quality: ChordQuality;

    protected _symbol: string;

    protected _seventh: boolean;

    // protected _accidental!: Accidental;
    // protected _applied!: ScaleDegree | null;

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
        const match = value.match(/^(?:(VI{0,2}|I{1,3}|IV)(\+)?|(vi{0,2}|i{1,3}|iv)(o|0)?)(?:(53|63?|64)|(7(?:53)?|653?|6?43|6?42))?$/);
        if(!match) {
            throw 'Invalid roman numeral ' + value;
        }
        const [scaleDegreeMajor, augmented, scaleDegreeMinor, diminished, intervals, seventhIntervals] = match.slice(1);
        this._scaleDegree = ScaleDegree.fromRomanNumeral(scaleDegreeMajor || scaleDegreeMinor);

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
                    if(scaleDegreeMajor != 'V') {
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
        let inversion = -1;
        if((!intervals && !seventhIntervals) || intervals == '5' || intervals == '53' || seventhIntervals == '7' || seventhIntervals == '753') {
            inversion = 0;
        } else if(intervals == '6' || intervals == '63' || seventhIntervals == '65' || seventhIntervals == '653') {
            inversion = 1;
        } else if(intervals == '64' || seventhIntervals == '643' || seventhIntervals == '43') {
            inversion = 2;
        } else if(seventhIntervals == '642' || seventhIntervals == '42') {
            inversion = 3;
        }
        this._inversion = this._intervals[inversion];
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
        return new Note(this._scale[this._scaleDegree - 1]);
    }

    get scaleDegree() {
        return this._scaleDegree;
    }

    get inversion(): Interval {
        return this._inversion;
    }

    get hasSeventh(): boolean {
        return this._seventh;
    }

    get quality() {
        return this._quality;
    }

    get inversionSymbol() {
        // TODO handle flats and sharps
        if(this.hasSeventh) {
            if(this._inversion.simpleSize == 'U') {
                return ['7', ''];
            } else if(this._inversion.simpleSize == '3') {
                return ['6', '5'];
            } else if(this._inversion.simpleSize == '5') {
                return ['4', '3'];
            } else if(this._inversion.simpleSize == '7') {
                return ['4', '2'];
            }
        } else {
            if(this._inversion.simpleSize == 'U') {
                return ['', ''];
            } else if(this._inversion.simpleSize == '3') {
                return ['6', ''];
            } else if(this._inversion.simpleSize == '5') {
                return ['6', '4'];
            }
        }
    }
}