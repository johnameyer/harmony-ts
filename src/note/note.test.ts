import { Note } from './note';

describe('Note', () => {
    describe('valid', () => {
        describe.each([
            [ 'C', 0 ],
            [ 'A', 9 ],
            [ 'G', 7 ],
            [ 'Ab', 8 ],
            [ 'G#', 8 ],
            [ 'Cb', 11 ],
            [ 'B#', 0 ],
        ])('"%s"', (value, chromaticPosition) => {
            test('constructor', () => {
                const note = Note.fromString(value);
                expect(note).toBeTruthy();
            });

            test('name', () => {
                const note = Note.fromString(value);
                expect(note.name).toBe(value);
            });

            test('chromaticPosition', () => {
                const note = Note.fromString(value);
                expect(note.chromaticPosition).toBe(chromaticPosition);
            });
        });
    });
});
