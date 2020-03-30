import { Key } from './key';
import { Scale } from './scale';

describe('Scale', () => {
    describe('valid', () => {
        describe.each(
            ['Gb', 'D', 'B', 'C#']
        )('Major %s', (name) => {
            test('to convert back and forth', () => {
                const key = Key.fromString(name);
                const scale = Scale.transpose(Scale.Major.notes, key).slice(0, 7);
                expect(scale).toBeTruthy();
                expect(scale.reduce((a,b) => a+b).split(new RegExp('#|b')).length - 1).toBe(Math.abs(key));
            });
        });
    });
});