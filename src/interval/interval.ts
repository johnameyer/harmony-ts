import { Note } from '../note/note';
import { IntervalQuality } from './interval-quality';
import { Accidental } from '../accidental';
import { isString, isNumber } from '../util';

// TODO possible to have in only one place a la circular dependency
let notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const semitones = [0, 2, 4, 5, 7, 9, 11, 12];

export class Interval {
    protected _semitones!: number;
    protected _simpleSize!: number;
    protected _quality!: IntervalQuality;

    constructor(name: string);
    constructor(quality: IntervalQuality, size: number);
    constructor(one: Note, two: Note);
    constructor(one: IntervalQuality | Note | string, two?: number | Note) {
        if(two === undefined && isString(one)) {
            const match = one.match(/^([PMmAd])([U2-7])$/); 
            if(match) {
                const [quality, size] = match.slice(1);
                this._quality = IntervalQuality.fromString(quality);
                this._simpleSize = Number(size) || 1;
                this._semitones = semitones[this._simpleSize - 1];
                switch(this._quality) {
                    case IntervalQuality.AUGMENTED:
                        this._semitones += 1;
                        break;
                    case IntervalQuality.MINOR:
                        this._semitones -= 1;
                        break;
                    case IntervalQuality.DIMINISHED:
                        if(this._simpleSize == 1 || this._simpleSize == 4 || this._simpleSize == 5 || this._simpleSize == 8) {
                            this._semitones -= 1;
                        } else {
                            this._semitones -= 2;
                        }
                        break;
                }
                return;
            }
        }
        if(isNumber(one) && isNumber(two)) {
            this._quality = one;
            this._simpleSize = two;
            this._semitones = semitones[this._simpleSize - 1];
            switch(this._quality) {
                case IntervalQuality.AUGMENTED:
                    this._semitones += 1;
                    break;
                case IntervalQuality.MINOR:
                    this._semitones -= 1;
                    break;
                case IntervalQuality.DIMINISHED:
                    if(this._simpleSize == 1 || this._simpleSize == 4 || this._simpleSize == 5 || this._simpleSize == 8) {
                        this._semitones -= 1;
                    } else {
                        this._semitones -= 2;
                    }
                    break;
            }
            return;
        }

        if(one instanceof Note && two instanceof Note) {
            let distance = notes.indexOf(two.letterName[0]) - notes.indexOf(one.letterName[0]);
            if(distance < 0) {
                distance += 7;
            } 
            
            this._simpleSize = distance + 1;
            
            let chromaticDistance = two.chromaticPosition - one.chromaticPosition;
            if(chromaticDistance < 0) {
                chromaticDistance += 12;
            } else if(chromaticDistance === 0 && distance === 6) {
                chromaticDistance += 12;
            }
            this._semitones = chromaticDistance;

            const majorSemitones = semitones[this._simpleSize - 1];
            if(this._simpleSize == 1 || this._simpleSize == 4 || this._simpleSize == 5) {
                this._quality = Interval.perfectQualities[chromaticDistance - majorSemitones + 1];
            } else if(this._simpleSize == 8) {
                this._quality = Interval.perfectQualities[12 + chromaticDistance - majorSemitones + 1];
            } else {
                this._quality = Interval.imperfectQualities[chromaticDistance - majorSemitones + 2];
            }
            return;
        }
        throw 'Invalid invocation of Interval constructor with values ' + JSON.stringify(one) + ' and ' + JSON.stringify(two);
    }

    get semitones() {
        return this._semitones;
    }

    get name() {
        return IntervalQuality.toString(this._quality) + this.simpleSize;
    }

    get simpleSize() {
        if(this._simpleSize == 1) {
            return 'U';
        }
        return String(this._simpleSize);
    }

    get quality() {
        return this._quality;
    }

    transposeUp(note: Note): Note {
        let index = notes.indexOf(note.letterName) + this._simpleSize - 1;
        if(index >= 7) {
            index = index - 7;
        }
        const letterName = notes[index];
        let result = new Note(letterName);
        const accidental = Accidental.toString((12 + note.chromaticPosition + this._semitones - result.chromaticPosition + 2) % 12 - 2);
        return new Note(letterName + accidental);
    }
    
    transposeDown(note: Note): Note {
        let index = notes.indexOf(note.letterName) - this._simpleSize + 1;
        if(index < 0) {
            index = index + 7;
        }
        const letterName = notes[index];
        let result = new Note(letterName);
        const accidental = Accidental.toString((24 + note.chromaticPosition - this._semitones - result.chromaticPosition + 2) % 12 - 2);
        return new Note(letterName + accidental);
    }
    
    static ofSize(size: string) {
        return (interval: Interval | undefined) => interval && interval.simpleSize == size;
    }
}

export namespace Interval {
    export const perfectQualities = [IntervalQuality.DIMINISHED, IntervalQuality.PERFECT, IntervalQuality.AUGMENTED];
    export const imperfectQualities = [IntervalQuality.DIMINISHED, IntervalQuality.MINOR, IntervalQuality.MAJOR, IntervalQuality.AUGMENTED];
}