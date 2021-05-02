import { RomanNumeral } from '../harmony/roman-numeral';
import { AbsoluteNote } from '../note/absolute-note';
import { Interval } from '../interval/interval';

export interface IChord {
    voices: (AbsoluteNote | undefined)[];

    romanNumeral: RomanNumeral | undefined;
    
    romanNumeralFinalized: boolean;

    flags: {[key: string]: boolean};

    intervals: (Interval | undefined)[] | undefined;
}