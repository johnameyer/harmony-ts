import { Note } from './note/note';
import { Interval } from './interval/interval';

export enum Key {
    CFlat = -7,
    GFlat = -6,
    DFlat = -5,
    AFlat = -4,
    EFlat = -3,
    BFlat = -2,
    F = -1,
    C = 0,
    G = 1,
    D = 2,
    A = 3,
    E = 4,
    B = 5,
    FSharp = 6,
    CSharp = 7,
}

export namespace Key {
    export const names = ['Cb','Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    
    export function toString(key: Key): string {
        if(key > 7 || key < -7) {
            throw 'Key outside of expected range ' + key;
        }
        return names[key + 7];
    }
    
    export function fromString(key: string): Key {
        const index = names.indexOf(key);
        if(index == -1) {
            throw 'Invalid key ' + key;
        }
        return index - 7;
    }

    export function toNote(key: Key): Note {
        return new Note(toString(key));
    }

    export function getScaleInKey(scale: string[], key: Key) {
        const transposition = new Interval(new Note('C'), Key.toNote(key));
        return scale.map(note => transposition.transposeUp(new Note(note)).letterName);
    }
}