import { Key } from './key';

describe('Key', () => {
    describe('valid', () => {
        describe.each(
            ['Gb', 'D', 'B', 'C#']
        )('%s', (name) => {
            test('to convert back and forth', () => {
                expect(Key.toString(Key.fromString(name))).toBe(name);
                expect(Key.toNote(Key.fromString(name)).name).toBe(name);
            });
        });
    });
});