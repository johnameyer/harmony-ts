import { Note } from './note';
import { AbsoluteNote } from './absolute-note';

describe('Note', () => {
    describe.each([
        ['C', 0],
        ['A', 9],
        ['G', 7],
        ['Ab', 8],
        ['G#', 8]
    ])('"%s"', (value, chromaticPosition) => {
        test('constructor', () => {
            const note = new Note(value);
            expect(note).toBeTruthy();
        });

        test('name', () => {
            const note = new Note(value);
            expect(note.name).toBe(value);
        });

        test('chromaticPosition', () => {
            const note = new Note(value);
            expect(note.chromaticPosition).toBe(chromaticPosition);
        });
    });
});

describe('AbsoluteNote', () => {
    describe.each([
        ['C0', 0],
        ['A4', 9],
        ['G5', 7],
        ['Ab5', 8],
        ['G#5', 8]
    ])('"%s"', (value, chromaticPosition) => {
        test('constructor', () => {
            const note = new AbsoluteNote(value);
            expect(note).toBeTruthy();
        });

        test('name', () => {
            const note = new AbsoluteNote(value);
            expect(note.name).toBe(value);
        });

        test('chromaticPosition', () => {
            const note = new AbsoluteNote(value);
            expect(note.chromaticPosition).toBe(chromaticPosition);
        });

        test('octavePosition', () => {
            const note = new AbsoluteNote(value);
            expect(note.octavePosition).toBe(Number(value.substr(value.length - 1)));
        });
    });
});