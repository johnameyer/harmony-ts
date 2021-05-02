import { Motion } from './motion';
import { AbsoluteNote } from '../note/absolute-note';

describe('Motion', () => {
    describe.each([
        [[ 'A0', 'A0', 'E1', 'E1' ], 'Parallel' ],
        [[ 'G0', 'A0', 'D1', 'E1' ], 'Parallel' ],
        [[ 'A0', 'A0', 'E1', 'F1' ], 'Oblique' ],
        [[ 'A0', 'G0', 'E1', 'E1' ], 'Oblique' ],
        [[ 'G0', 'A0', 'D1', 'F1' ], 'Similar' ],
        [[ 'G0', 'B0', 'D1', 'E1' ], 'Similar' ],
        [[ 'G0', 'E0', 'D1', 'C1' ], 'Similar' ],
        [[ 'G0', 'F0', 'E1', 'C1' ], 'Similar' ],
        [[ 'G0', 'F0', 'E1', 'F1' ], 'Contrary' ],
        [[ 'G0', 'A0', 'E1', 'C1' ], 'Contrary' ],
    ])('from %p is %p', (notes: string[], actualMotion: string) => {
        test('from', () => {
            const [ lowerPrev, lowerNext, upperPrev, upperNext ] = notes.map(note => AbsoluteNote.fromString(note));
            const motion = Motion.from(lowerPrev, lowerNext, upperPrev, upperNext);
            expect(motion).toBe(Motion.fromString(actualMotion));
        });
    }); 
});
