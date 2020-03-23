import { Note } from './note/note';

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
    
    export function toString(key: Key) {
        return names[key + 7];
    }
    
    export function fromString(key: string) {
        return names.indexOf(key) - 7;
    }

    export function toNote(key: Key) {
        return new Note(toString(key));
    }
}