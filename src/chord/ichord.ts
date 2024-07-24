import { RomanNumeral } from '../harmony/roman-numeral';
import { Interval } from '../interval/interval';
import { Note } from '../note/note';

export interface IChord {
    voices: (Note | undefined)[];

    romanNumeral: RomanNumeral | undefined;
    
    romanNumeralFinalized: boolean;

    flags: {[key: string]: boolean};

    intervals: (Interval | undefined)[] | undefined;
}
