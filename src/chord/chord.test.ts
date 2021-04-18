import { Chord } from './chord';
import { ChordQuality } from './chord-quality';
import { AbsoluteNote } from '../note/absolute-note';

describe('Chord', () => {
    describe('valid', () => {
        describe.each([
            ['C5', 'G4', 'E4', 'C4', ChordQuality.MAJOR],
            ['D5', 'G4', 'F4', 'B3', ChordQuality.MAJOR],
        ])('of [%s %s %s %s]', (soprano, alto, tenor, bass, quality) => {
            test('is of the right quality', () => {
                const chord = new Chord([AbsoluteNote.fromString(soprano), AbsoluteNote.fromString(alto), AbsoluteNote.fromString(tenor), AbsoluteNote.fromString(bass)]);
                expect(chord.quality).toBe(quality);
            });
        });
    });
});
