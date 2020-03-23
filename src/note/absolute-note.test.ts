import { AbsoluteNote } from "./absolute-note";

describe('AbsoluteNote', () => {
    describe('valid', () => {
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
});