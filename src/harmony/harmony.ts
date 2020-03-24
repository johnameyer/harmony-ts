import { Progression } from "./progression";
import { Key } from "../key";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Note } from "../note/note";
import { Chord } from "../chord/chord";
import { Interval } from "../interval/interval";
import { AbsoluteNote } from "../note/absolute-note";
import { PartWriting } from "./part-writing";

function isDefined<T>(t: T | undefined): t is T {
    return !!t;
} 

/**
 * 
 * TODO does not need to be symmetric
 */
function compareConstraints(one: IncompleteChord, two: IncompleteChord) {
    const compare = <T>(one: T | undefined, two: T | undefined) => !one && !two && one != two;
    for(let voicePart in one.voices) {
        if(compare(one.voices[voicePart], two.voices[voicePart])) {
            return false;
        }
    }
    
    if(compare(one.root, two.root)) {
        return false;
    }
    if(compare(one.romanNumeral?.name, two.romanNumeral?.name)) {
        return false;
    }
    if(one.romanNumeral) {
        // TODO one should always have root in this case
        if(!two.voices.filter(isDefined).every(note => one.romanNumeral?.intervals.map(interval => one.root ? interval.transposeUp(one.root).simpleName : undefined).includes(note.simpleName))){
            return false;
        }
    } else if(two.romanNumeral) {
        if(!one.voices.filter(isDefined).every(note => two.romanNumeral?.intervals.map(interval => two.root ? interval.transposeUp(two.root).simpleName : undefined).includes(note.simpleName))){
            return false;
        }
    }
}

function *findSolutions(previous: HarmonizedChord, constraint: IncompleteChord, needed: Note[]) {
    const mapToNearby = (previous: AbsoluteNote) => (note: Note) => [
        new AbsoluteNote(note.name + [previous.octavePosition - 1]),
        new AbsoluteNote(note.name + [previous.octavePosition]),
        new AbsoluteNote(note.name + [previous.octavePosition + 1])
    ];

    const get = (voicePart: number) => {
        let voice = constraint.voices[voicePart];
        if(isDefined(voice)) {
            return [voice];
        } else {
            return [...needed].flatMap(mapToNearby(previous.voices[voicePart]));
        }
    };
    const sopranoNotes = get(0);
    const altoNotes = get(1);
    const tenorNotes = get(2)
    const bassNotes = get(3);
    //TODO make more efficient by following doubling rules outright
    const compare = (note: Note) => (one: Note, two: Note) => new Interval(note, one).semitones - new Interval(note, two).semitones;
    for(const soprano of sopranoNotes.sort(compare(previous.voices[0]))) { //try smaller intervals first
        for(const alto of altoNotes.sort(compare(previous.voices[1]))) {
            for(const tenor of tenorNotes.sort(compare(previous.voices[2]))) {
                for(const bass of bassNotes.sort(compare(previous.voices[3]))) {
                    yield [soprano, alto, tenor, bass];
                }
            }
        }
    }
}

export namespace Harmony {
    const enabled = [
        Progression.Major.basicRoot,
        Progression.Major.firstInversions,
        Progression.Major.fiveInversions,
        Progression.Major.predominants
    ].flat();

    export function harmonize(key: Key, constraints: IncompleteChord[], ...previous: HarmonizedChord[]) {
        let options: IncompleteChord[][];
        options = enabled.filter(([predicate, _]) => predicate(key, ...previous)).map(([_, producer]) => producer(key, ...previous));
        let fit: HarmonizedChord[] = [];
        let solutions: HarmonizedChord[][] = [];
        for (const option of options) {
            fit = [];
            for (const index in option) {
                const optionChord = option[index];
                const constraintChord = constraints[index];
                if(compareConstraints(optionChord, constraintChord)) {
                    break;
                }
                if(!optionChord.root || !optionChord.romanNumeral) {
                    break;
                }
                //get notes in chord
                //TODO fix undefined errors
                const chordNotes = optionChord.romanNumeral.intervals.map(interval => optionChord.root ? interval.transposeUp(optionChord.root) : undefined).filter(isDefined);
                for(const foundSolution of findSolutions(previous[0], constraintChord, chordNotes)) {
                    const [soprano, alto, tenor, bass] = foundSolution;
                    const solution = new HarmonizedChord([soprano, alto, tenor, bass], optionChord.romanNumeral);
                    if(!PartWriting.checkAll(solution, previous[0])) {
                        break;
                    }
                    //TODO ranking of solutions
                    fit.push(solution);
                    break;
                }
            }
            if(fit.length == option.length) {
                solutions.push(fit);
            }
        }
    }
    export function harmonizeAll(key: Key, constraints: IncompleteChord[]) {
        
    }
}