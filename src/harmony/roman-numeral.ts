import { ScaleDegree } from './scale-degree';
import { ChordQuality } from '../chord/chord-quality';
import { Interval } from '../interval/interval';
import { Note } from '../note/note';
import { IntervalQuality } from '../interval/interval-quality';
import { Scale } from '../scale';

const cachedScalarIntervals: Interval[][][] = [];
function qualityOfScalarInterval(lower: ScaleDegree, upper: ScaleDegree, scale: Scale) {
    if(!cachedScalarIntervals[scale[1]]) {
        cachedScalarIntervals[scale[1]] = [];
    }
    if(!cachedScalarIntervals[scale[1]][lower]) {
        cachedScalarIntervals[scale[1]][lower] = [];
    }
    if(!cachedScalarIntervals[scale[1]][lower][upper]) {
        const notes = Scale.getNotesOfScale(scale);
        cachedScalarIntervals[scale[1]][lower][upper] = new Interval(notes[lower], notes[upper]);
    }
    return cachedScalarIntervals[scale[1]][lower][upper];
}

function qualityOfScalarIntervalBuiltOn(scaleDegree: ScaleDegree, size: number, scale: Scale) {
    return qualityOfScalarInterval(scaleDegree, (scaleDegree + size - 1) % 7, scale);
}

export interface RomanNumeralParameters {
    scaleDegree: ScaleDegree;

    quality: ChordQuality;

    inversion?: number;

    hasSeventh?: boolean;

    fullyDiminishedSeventh?: boolean;

    applied?: ScaleDegree | null;

    flags?: {[key: string]: boolean};
}

export class RomanNumeral {

    readonly name: string;

    readonly scaleDegree: ScaleDegree;
    readonly inversion: number;
    protected _inversionInterval: Interval;
    readonly quality: ChordQuality;

    readonly hasSeventh: boolean;

    // protected _accidental!: Accidental;
    readonly applied: ScaleDegree | null;

    readonly scale: Scale;

    /**
     * Intervals above the root
     */
    protected _intervals: Interval[];

    /**
     * Intervals above the bass
     */
    protected _figuredBass!: string;

    readonly flags: Readonly<{[key: string]: boolean}>;

    static fromString(value: string, scale: Scale) {
        const _name = value;
        const match = value.match(/^(?:(VI{0,2}|I{1,3}|IV)(\+)?|(vi{0,2}|i{1,3}|iv)(o|0)?)(?:(53|63?|64)|(7(?:53)?|653?|6?43|6?42))?(?:\/(VI{0,2}|I{2,3}|IV|vi{0,2}|i{2,3}|iv))?$/);
        if(!match) {
            throw new Error('Invalid roman numeral ' + value);
        }
        const [scaleDegreeMajor, augmented, scaleDegreeMinor, diminished, intervals, seventhIntervals, appliedString] = match.slice(1);
        const scaleDegree = ScaleDegree.fromRomanNumeral(scaleDegreeMajor || scaleDegreeMinor);
        let applied: ScaleDegree | null = ScaleDegree.fromRomanNumeral(appliedString || 'I');
        if(applied === ScaleDegree.TONIC) {
            applied = null;
        }

        const quality = scaleDegreeMajor ? (augmented ? ChordQuality.AUGMENTED : ChordQuality.MAJOR) : (diminished ? ChordQuality.DIMINISHED : ChordQuality.MINOR);

        let inversion;
        if((!intervals && !seventhIntervals) || intervals == '5' || intervals == '53' || seventhIntervals == '7' || seventhIntervals == '753') {
            inversion = 0;
        } else if(intervals == '6' || intervals == '63' || seventhIntervals == '65' || seventhIntervals == '653') {
            inversion = 1;
        } else if(intervals == '64' || seventhIntervals == '643' || seventhIntervals == '43') {
            inversion = 2;
        } else if(seventhIntervals == '642' || seventhIntervals == '42') {
            inversion = 3;
        } else {
            throw new Error('Unknown inversion symbol ' + intervals);
        }

        return new RomanNumeral({
            scaleDegree,
            quality,
            applied,
            inversion,
            hasSeventh: !!seventhIntervals,
            fullyDiminishedSeventh: diminished === 'o'
        }, scale);
    }

    constructor(params: RomanNumeralParameters, scale: Scale) {
        this.scaleDegree = params.scaleDegree;
        this.quality = params.quality;
        this.inversion = params.inversion || 0;

        this.applied = params.applied || null;

        this._intervals = [new Interval(IntervalQuality.PERFECT, 1)];

        this.hasSeventh = !!params.hasSeventh;

        let third = IntervalQuality.MAJOR;
        let fifth = IntervalQuality.PERFECT;

        switch(this.quality) {
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
        this.hasSeventh = params.hasSeventh || false;
        if(params.hasSeventh) {
            let seventhQuality = IntervalQuality.MINOR;
            switch(params.quality) {
            case ChordQuality.AUGMENTED:
                seventhQuality = IntervalQuality.MAJOR;
                break;
            case ChordQuality.MAJOR:
                if(this.scaleDegree != ScaleDegree.DOMINANT && this.scaleDegree !== ScaleDegree.SUBTONIC) {
                    seventhQuality = IntervalQuality.MAJOR;
                }
                break;
            case ChordQuality.MINOR:
                break;
            case ChordQuality.DIMINISHED:
                if(params.fullyDiminishedSeventh) {
                    seventhQuality = IntervalQuality.DIMINISHED;
                }
                break;
            }
            this._intervals.push(new Interval(seventhQuality, 7));
        }

        this._inversionInterval = this._intervals[this.inversion];
        
        if(this.applied !== null) {
            if((this.scaleDegree !== ScaleDegree.DOMINANT && this.scaleDegree !== ScaleDegree.SUBTONIC)
                || (this.scaleDegree === ScaleDegree.DOMINANT && this.quality !== ChordQuality.MAJOR)
                || (this.scaleDegree === ScaleDegree.SUBTONIC && this.quality !== ChordQuality.DIMINISHED)) {
                throw new Error('Only V and viio can be applied chords, tried to apply ' + ScaleDegree.toRomanNumeral(this.scaleDegree));
            }
        }

        this.scale = scale;

        this.flags = Object.freeze({...params.flags} || {});

        this.name = ScaleDegree.toRomanNumeral(this.scaleDegree);
        switch(this.quality) {
        case ChordQuality.MINOR:
            this.name = this.name.toLowerCase();
            break;
        case ChordQuality.DIMINISHED:
            this.name = this.name.toLowerCase();
            if(!params.hasSeventh || params.fullyDiminishedSeventh) {
                this.name += 'o';
            } else {
                this.name += '0';
            }
            break;
        case ChordQuality.AUGMENTED:
            this.name += '+';
            break;
        }
        this.name += this.inversionString;

        if(this.applied) {
            this.name += '/' + ScaleDegree.toRomanNumeral(this.applied);
        }
    }

    // TODO
    // static fromString() {
    // }

    get intervals() {
        return [...this._intervals];
    }

    get notes() {
        return this.intervals.map(interval => interval.transposeUp(this.root));
    }

    get root(): Note {
        const scale = Scale.getNotesOfScale(this.scale);
        if(this.scaleDegree == ScaleDegree.DOMINANT && this.quality === ChordQuality.MAJOR) {
            // dominant 5 is always built on the fifth of the tonic triad
            if(this.applied) {
                return new Interval(IntervalQuality.PERFECT, 5).transposeUp(scale[this.applied - 1]);
            }
            return new Interval(IntervalQuality.PERFECT, 5).transposeUp(scale[0]);
        } else if(this.scaleDegree === ScaleDegree.SUBTONIC && this.quality === ChordQuality.DIMINISHED){
            // leading tone is always a semitone below the note
            if(this.applied) {
                return new Interval(IntervalQuality.MINOR, 2).transposeDown(scale[this.applied - 1]);
            }
            return new Interval(IntervalQuality.MINOR, 2).transposeDown(scale[0]);
        }
        return scale[this.scaleDegree - 1];
    }

    get inversionInterval(): Interval {
        return this._inversionInterval;
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

    relativeToScale(scale: Scale): RomanNumeral | null {
        if(this.applied !== null) {
            return null;
        }
        const notesOfScale = Scale.getNotesOfScale(scale);
        const index = notesOfScale.findIndex(other => other.name === this.root.name);
        if(index === -1) {
            return null;
        }

        const resultant = new RomanNumeral({
            quality: this.quality,
            scaleDegree: index + 1,
            inversion: this.inversion,
            hasSeventh: this.hasSeventh,
            fullyDiminishedSeventh: this.intervals.find(interval => interval.simpleSize === '7')?.quality === IntervalQuality.DIMINISHED
        }, scale);

        if(resultant.notes.every(note => this.notes.some(other => note.name === other.name))) {
            return resultant;
        }
        return null;
    }

    diatonicized() {
        const scaleDegree = Scale.getNamesOfScale(this.scale).findIndex(scaleNote => scaleNote.startsWith(this.root.name[0]));
        if(scaleDegree === -1) {
            return null;
        }
        const thirdInterval = qualityOfScalarIntervalBuiltOn(scaleDegree, 3, this.scale).quality;
        const fifthInterval = qualityOfScalarIntervalBuiltOn(scaleDegree, 5, this.scale).quality;
        const seventhInterval = qualityOfScalarIntervalBuiltOn(scaleDegree, 7, this.scale).quality;

        let quality: ChordQuality = ChordQuality.MAJOR;
        let fullyDiminishedSeventh = false;

        switch(fifthInterval) {
        case IntervalQuality.AUGMENTED:
            quality = ChordQuality.AUGMENTED;
        case IntervalQuality.DIMINISHED:
            quality = ChordQuality.DIMINISHED;
            if(!this.hasSeventh || seventhInterval === IntervalQuality.DIMINISHED) {
                fullyDiminishedSeventh = true;                    
            }
            break;
        case IntervalQuality.PERFECT:
            if(thirdInterval === IntervalQuality.MINOR) {
                quality = ChordQuality.MINOR;
            }
            break;
        }

        return new RomanNumeral({
            quality,
            scaleDegree: scaleDegree + 1,
            inversion: this.inversion,
            hasSeventh: this.hasSeventh,
            fullyDiminishedSeventh,
            flags: this.flags
        }, this.scale);
    }

    asParams(): RomanNumeralParameters {
        return {
            quality: this.quality,
            scaleDegree: this.scaleDegree,
            applied: this.applied,
            flags: this.flags,
            fullyDiminishedSeventh: this.hasSeventh && this.intervals.find(Interval.ofSize('7'))?.quality === IntervalQuality.DIMINISHED,
            hasSeventh: this.hasSeventh,
            inversion: this.inversion
        };
    }

    with(params: Partial<RomanNumeralParameters>) {
        return new RomanNumeral({
            ...this.asParams(),
            ...params
        }, this.scale);
    }
}