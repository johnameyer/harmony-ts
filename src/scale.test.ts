import { Key } from './key';
import { Scale } from './scale';

describe('Scale', () => {
    describe('valid', () => {
        describe.each(
            ['Gb', 'D', 'B', 'C#']
        )('Major %s', (name) => {
            test('to have correct number of accidentals', () => {
                const key = Key.fromString(name);
                const scale = Scale.getNamesOfScale([key, Scale.Quality.MAJOR]).slice(0, 7);
                expect(scale).toBeTruthy();
                expect(scale.reduce((a,b) => a+b).split(new RegExp('#|b')).length - 1).toBe(Math.abs(key));
            });
        });
    });
});