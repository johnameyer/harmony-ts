import { ScaleDegree } from "./scale-degree";
import { ChordQuality } from "../chord/chord-quality";
import { Interval } from "../interval/interval";
import { Note } from "../note/note";
import { Key } from "../key";
import { Accidental } from "../accidental";
import { IntervalQuality } from "../interval/interval-quality";
import { Scale } from "../scale";
import { Chord } from "../chord/chord";

function qualityOfScalarInterval(lower: ScaleDegree, upper: ScaleDegree, scale: Scale) {
    return new Interval(new Note(scale[lower]), new Note(scale[upper]));
}

function qualityOfScalarIntervalBuiltOn(scaleDegree: ScaleDegree, size: number, scale: Scale) {
    return qualityOfScalarInterval(scaleDegree, (scaleDegree + size - 1) % 7, scale);
}

function qualityOfScaleDegree(scaleDegree: ScaleDegree, scale: Scale) {
    const fifth = qualityOfScalarIntervalBuiltOn(scaleDegree, 5, scale);
    if(fifth.quality == IntervalQuality.AUGMENTED) {
        return ChordQuality.AUGMENTED;
    } else if(fifth.quality == IntervalQuality.DIMINISHED) {
        return ChordQuality.DIMINISHED;
    }
    const third = qualityOfScalarIntervalBuiltOn(scaleDegree, 3, scale);
    if(third.quality == IntervalQuality.MAJOR) {
        return ChordQuality.MAJOR;
    } else if(third.quality == IntervalQuality.MINOR) {
        return ChordQuality.MINOR;
    }
}

export class RomanNumeral {

    protected _name!: string;

    protected _scaleDegree!: ScaleDegree;
    protected _inversion!: Interval;

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
        const [scaleDegreeMajor, augmented, scaleDegreeMinor, dimished, intervals, seventhIntervals] = match.slice(1);
        this._scaleDegree = ScaleDegree.fromRomanNumeral(scaleDegreeMajor || scaleDegreeMinor);

        const quality = scaleDegreeMajor ? (augmented ? ChordQuality.AUGMENTED : ChordQuality.MAJOR) : (dimished ? ChordQuality.DIMINISHED : ChordQuality.MINOR);  

        this._intervals = [new Interval(IntervalQuality.PERFECT, 1)];

        let third = IntervalQuality.MAJOR;
        let fifth = IntervalQuality.PERFECT;

        switch(quality) {
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
        if(seventhIntervals) {
            let seventh = IntervalQuality.MINOR;
            switch(quality) {
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
                    if(dimished == 'o') {
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

    get intervals() {
        return [...this._intervals];
    }

    get notes() {
        return this.intervals.map(interval => interval.transposeUp(this.root));
    }

    get root(): Note {
        return new Note(this._scale[this._scaleDegree - 1]);
    }

    get inversion(): Interval {
        return this._inversion;
    }

    get hasSeventh(): boolean {
        return this.intervals.some(interval => interval.simpleSize == '7');
    }
}