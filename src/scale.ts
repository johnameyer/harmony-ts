import { Key } from './key';
import { isNumber, isString } from './util';
import { Note } from './note/note';
import { Interval } from './interval/interval';

export type Scale = string[];

export namespace Scale {
    export namespace Major {
        export const notes: Scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
        export const semitones = [0, 2, 4, 5, 7, 9, 11, 12];
    }

    export namespace NaturalMinor {
        export const notes: Scale = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C'];
        export const semitones = [0, 2, 3, 5, 7, 8, 10, 12];
    }

    export namespace HarmonicMinor {
        export const notes: Scale = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B', 'C'];
        export const semitones = [0, 2, 3, 5, 7, 8, 11, 12];
    }
    
    export namespace MelodicMinor {
        export const notes: Scale = ['C', 'D', 'Eb', 'F', 'G', 'A', 'B', 'C'];
        export const semitones = [0, 2, 3, 5, 7, 9, 11, 12];
    }

    export function transpose(scale: Scale, key: Key): Scale;
    export function transpose(scale: Scale, note: string): Scale;
    export function transpose(scale: Scale, note: Note): Scale;
    export function transpose(scale: Scale, interval: Interval): Scale;
    export function transpose(scale: Scale, relative: string | Key | Interval | Note): Scale {
        let interval: Interval;
        if(relative instanceof Interval) {
            interval = relative;
        } else if(isNumber(relative)){
            interval = new Interval(new Note('C'), Key.toNote(relative));
        } else if(relative instanceof Note){
            interval = new Interval(new Note('C'), relative);
        } else if(isString(relative)) {
            interval = new Interval(new Note('C'), new Note(relative));
        } else {
            throw 'Relative is invalid ' + relative;
        }
        return scale.map(note => interval.transposeUp(new Note(note)).name);
    }
}