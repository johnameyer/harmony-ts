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
        return names[key + 7];
    }
    
    export function fromString(key: string): Key {
        return names.indexOf(key) - 7;
    }

    export function toNote(key: Key): Note {
        return new Note(toString(key));
    }

    export function getScaleinKey(scale: string[], key: Key) {
        const transposition = new Interval(new Note('C'), Key.toNote(key));
        return scale.map(note => transposition.transposeUp(new Note(note)).letterName);
    }
}