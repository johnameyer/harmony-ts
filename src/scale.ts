import { Key } from './key';
import { Note } from './note/note';
import {Interval } from './interval/interval';

export type Scale = [Key, Scale.Quality];

export namespace Scale {
    // TODO eventually consider modal
    export enum Quality {
        MAJOR,
        MINOR
    }

    export namespace Major {
        export const notes: string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
        export const semitones = [0, 2, 4, 5, 7, 9, 11, 12];
    }

    export namespace NaturalMinor {
        export const notes: string[] = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb', 'C'];
        export const semitones = [0, 2, 3, 5, 7, 8, 10, 12];
    }

    export namespace HarmonicMinor {
        export const notes: string[] = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B', 'C'];
        export const semitones = [0, 2, 3, 5, 7, 8, 11, 12];
    }
    
    export namespace MelodicMinor {
        export const notes: string[] = ['C', 'D', 'Eb', 'F', 'G', 'A', 'B', 'C'];
        export const semitones = [0, 2, 3, 5, 7, 9, 11, 12];
    }

    const scaleHash = (scale: Scale) => 2 * scale[0] + scale[1];
    const getNotesOfScaleMemo: Note[][] = [];

    export function getNotesOfScale(scale: Scale): Note[] {
        if(!getNotesOfScaleMemo[scaleHash(scale)]) {
            const interval = new Interval(Note.fromString('C'), Key.toNote(scale[0]));
            const baseScale = scale[1] === Quality.MAJOR ? Major.notes : NaturalMinor.notes;

            getNotesOfScaleMemo[scaleHash(scale)] = baseScale.map(note => interval.transposeUp(Note.fromString(note)));
        }
        return getNotesOfScaleMemo[scaleHash(scale)];
    }

    export function getNamesOfScale(scale: Scale): string[] {
        return getNotesOfScale(scale).map(note => note.name);
    }

    export function toString(scale: Scale): string {
        return Key.toString(scale[0]) + (scale[1] === Scale.Quality.MAJOR ? 'M' : 'm');
    }
}