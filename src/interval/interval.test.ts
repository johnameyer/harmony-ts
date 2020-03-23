import { Interval } from './interval';
import { Note } from '../note/note';
import { AbsoluteNote } from '../note/absolute-note';
import { ComplexInterval } from './complex-interval';

const createSimpleInterval = (one: string, two: string) => new Interval(new Note(one), new Note(two));

describe('Interval', () => {
    describe.each([
        ['A', 'A', 'PU'],
        ['C', 'Eb', 'm3'],
        ['C', 'E', 'M3'],
        ['C', 'F', 'P4'],
        ['C', 'F#', 'A4'],
        ['C', 'Gb', 'd5'],
        ['D', 'Ab', 'd5'],
        ['D', 'C', 'm7'],
        ['D', 'B#', 'A6'],
        ['G', 'B', 'M3'],
        ['G', 'D', 'P5'],
    ])('from "%s" to "%s" (%s)', (first, second, name) => {
        test('has correct name', () => {
            const interval = createSimpleInterval(first, second);
            expect(interval.name).toBe(name);
        });

        test('transposes up correctly', () => {
            const interval = createSimpleInterval(first, second);
            expect(interval.transposeUp(new Note(first)).name).toBe(second);
        });

        test('transposes down correctly', () => {
            const interval = createSimpleInterval(first, second);
            expect(interval.transposeDown(new Note(second)).name).toBe(first);
        });
    });
});

const createComplexInterval = (one: string, two: string) => new ComplexInterval(new AbsoluteNote(one), new AbsoluteNote(two));

describe('ComplexInterval', () => {
    describe.each([
        ['A0', 'A0', 'PU'],
        ['C0', 'Eb0', 'm3'],
        ['C0', 'E0', 'M3'],
        ['C0', 'F0', 'P4'],
        ['C1', 'F#1', 'A4'],
        ['C1', 'Gb1', 'd5'],
        ['D1', 'Ab1', 'd5'],
        ['D0', 'C1', 'm7'],
        ['D0', 'B#0', 'A6'],
        ['G0', 'B0', 'M3'],
        ['G0', 'D1', 'P5'],
        ['G0', 'D2', 'P12'],
    ])('from "%s" to "%s" (%s)', (first, second, name) => {
        test('has correct name', () => {
            const interval = createComplexInterval(first, second);
            expect(interval.name).toBe(name);
        });

        test('transposes up correctly', () => {
            const interval = createComplexInterval(first, second);
            expect(interval.transposeUp(new AbsoluteNote(first)).name).toBe(second);
        });

        test('transposes down correctly', () => {
            const interval = createComplexInterval(first, second);
            expect(interval.transposeDown(new AbsoluteNote(second)).name).toBe(first);
        });
    });
});
