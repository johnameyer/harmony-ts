import { ComplexInterval } from "./complex-interval";
import { AbsoluteNote } from "../note/absolute-note";

const createComplexInterval = (one: string, two: string) => new ComplexInterval(new AbsoluteNote(one), new AbsoluteNote(two));

describe('ComplexInterval', () => {
    describe('valid', () => {
        describe.only.each([
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
            ['G0', 'B2', 'M17'],
            ['G2', 'G3', 'P8'],
            ['G2', 'G#3', 'A8'],
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
});
