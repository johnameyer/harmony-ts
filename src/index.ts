import { AbsoluteNote } from './note/absolute-note';
import { IncompleteChord } from './chord/incomplete-chord';
import { Scale } from './scale';
import { Harmony } from './harmony/harmony';
import { RomanNumeral } from './harmony/roman-numeral';

const soprano = ['G4', 'A4', 'B4', 'C5'].map(note => new AbsoluteNote(note)); 
const constraints = soprano.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
const scale = Scale.Major.notes;
const result = Harmony.harmonizeAll(scale, constraints, new RomanNumeral('I', scale));

// (window as any).click = async () => {
//     const Tone = await import('tone');
//     const soprano = new Tone.Synth().toMaster();
//     const alto = new Tone.Synth().toMaster();
//     const tenor = new Tone.Synth().toMaster();
//     const bass = new Tone.Synth().toMaster();
//     soprano.context.resume();

//     let x = 1;
//     if(result != null){
//         for(let chord of result) {
//             document.write(...chord.voices.map(note => note.name + ' '));
//             document.write('<br>');
//             if (chord.voices[0]) {
//                 soprano.triggerAttackRelease(chord.voices[0].name, '1m', x + 'm');
//             }
//             if (chord.voices[1]) {
//                 alto.triggerAttackRelease(chord.voices[1].name, '1m', x + 'm');
//             }
//             if (chord.voices[2]) {
//                 tenor.triggerAttackRelease(chord.voices[2].name, '1m', x + 'm');
//             }
//             if (chord.voices[3]) {
//                 bass.triggerAttackRelease(chord.voices[3].name, '1m', x + 'm');
//             }
//             x++;
//         }
//     }
// };
