import { Chord } from './chord/chord';
import { AbsoluteNote } from './note/absolute-note';

const chords: Chord[] = [
    new Chord([new AbsoluteNote('C5'), new AbsoluteNote('G4'), new AbsoluteNote('E4'), new AbsoluteNote('C4')]),
    new Chord([new AbsoluteNote('D5'), new AbsoluteNote('G4'), new AbsoluteNote('F4'), new AbsoluteNote('B3')]),
    new Chord([new AbsoluteNote('C5'), new AbsoluteNote('G4'), new AbsoluteNote('E4'), new AbsoluteNote('C4')]),
];

// (window as any).click = async () => {
//     const Tone = await import('tone');
//     const soprano = new Tone.Synth().toMaster();
//     const alto = new Tone.Synth().toMaster();
//     const tenor = new Tone.Synth().toMaster();
//     const bass = new Tone.Synth().toMaster();
//     soprano.context.resume();

//     let x = 1;
//     for (const chord of chords) {
//         if (chord.soprano) {
//             soprano.triggerAttackRelease(chord.soprano.name, '1m', x + 'm');
//         }
//         if (chord.alto) {
//             alto.triggerAttackRelease(chord.alto.name, '1m', x + 'm');
//         }
//         if (chord.tenor) {
//             tenor.triggerAttackRelease(chord.tenor.name, '1m', x + 'm');
//         }
//         if (chord.bass) {
//             bass.triggerAttackRelease(chord.bass.name, '1m', x + 'm');
//         }
//         x++;
//     }
// };
