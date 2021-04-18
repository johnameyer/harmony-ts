import { Interval } from './interval';
import { Note } from '../note/note';

const createSimpleInterval = (one: string, two: string) => new Interval(Note.fromString(one), Note.fromString(two));

describe('Interval', () => {
    describe('valid', () => {
        describe.each([
            ['A', 'A', 'PU'],
            ['C', 'Eb', 'm3'],
            ['C', 'E', 'M3'],
            ['E', 'G#', 'M3'],
            ['Ab', 'C', 'M3'],
            ['C', 'F', 'P4'],
            ['C#', 'F#', 'P4'],
            ['C', 'F#', 'A4'],
            ['C', 'Gb', 'd5'],
            ['D', 'Ab', 'd5'],
            ['D', 'C', 'm7'],
            ['D', 'B#', 'A6'],
            ['G', 'B', 'M3'],
            ['G#', 'B', 'm3'],
            ['G', 'D', 'P5'],
            ['Gb', 'Cb', 'P4'],
            ['B', 'A#', 'M7'],
            ['B', 'A##', 'A7'],
            ['Bbb', 'A', 'A7'],
            ['D', 'Ebb', 'd2']
        ])('from "%s" to "%s" (%s)', (first, second, name) => {
            test('has correct name', () => {
                const interval = createSimpleInterval(first, second);
                expect(interval.name).toBe(name);
            });

            test('transposes up correctly', () => {
                const interval = createSimpleInterval(first, second);
                expect(interval.transposeUp(Note.fromString(first)).name).toBe(second);
            });

            test('transposes down correctly', () => {
                const interval = createSimpleInterval(first, second);
                expect(interval.transposeDown(Note.fromString(second)).name).toBe(first);
            });

            test('transposes up correctly', () => {
                const interval = Interval.fromString(name);
                expect(interval.transposeUp(Note.fromString(first)).name).toBe(second);
            });

            test('transposes down correctly', () => {
                const interval = Interval.fromString(name);
                expect(interval.transposeDown(Note.fromString(second)).name).toBe(first);
            });
        });
    });
});