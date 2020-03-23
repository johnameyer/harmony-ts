import { Key } from "./key";

describe('Key', () => {
    describe('valid', () => {
        describe.each(
            ['Cb','Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
        )('%s', (name) => {
            test('to convert back and forth', () => {
                expect(Key.toString(Key.fromString(name))).toBe(name); 
            });
        });
    })
})