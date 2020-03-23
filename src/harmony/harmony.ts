import { Progression } from "./progression";
import { Key } from "../key";
import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { RomanNumeral } from "./roman-numeral";
import { Note } from "../note/note";
import { Chord } from "../chord/chord";
import { Interval } from "../interval/interval";
import { AbsoluteNote } from "../note/absolute-note";

function isDefined<T>(t: T | undefined): t is T {
    return !!t;
} 

/**
 * 
 * TODO does not need to be symmetric
 */
function compareConstraints(one: IncompleteChord, two: IncompleteChord) {
    const compare = <T>(one: T | undefined, two: T | undefined) => !one && !two && one != two;
    if(compare(one.soprano, two.soprano)) {
        return false;
    }
    if(compare(one.alto, two.alto)) {
        return false;
    }
    if(compare(one.tenor, two.tenor)) {
        return false;
    }
    if(compare(one.bass, two.bass)) {
        return false;
    }
    if(compare(one.root, two.root)) {
        return false;
    }
    if(compare(one.romanNumeral?.name, two.romanNumeral?.name)) {
        return false;
    }
    if(one.romanNumeral) {
        // TODO one should always have root in this case
        if(!two.notes.filter(isDefined).every(note => one.romanNumeral?.intervals.map(interval => one.root ? interval.transposeUp(one.root) : undefined).includes(note))){
            return false;
        }
    } else if(two.romanNumeral) {
        if(!two.notes.filter(isDefined).every(note => one.romanNumeral?.intervals.map(interval => one.root ? interval.transposeUp(one.root) : undefined).includes(note))){
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
    const sopranoNotes = constraint.soprano ? [constraint.soprano]  : [...needed].flatMap(mapToNearby(previous.soprano));
    const altoNotes = constraint.alto       ? [constraint.alto]     : [...needed].flatMap(mapToNearby(previous.alto));
    const tenorNotes = constraint.tenor     ? [constraint.tenor]    : [...needed].flatMap(mapToNearby(previous.tenor));
    const bassNotes = constraint.bass       ? [constraint.bass]     : [...needed].flatMap(mapToNearby(previous.bass));
    //TODO make more efficient by following doubling rules outright
    const compare = (note: Note) => (one: Note, two: Note) => new Interval(note, one).semitones - new Interval(note, two).semitones;
    for(const soprano of sopranoNotes.sort(compare(previous.soprano))) { //try smaller intervals first
        for(const alto of altoNotes.sort(compare(previous.alto))) {
            for(const tenor of tenorNotes.sort(compare(previous.tenor))) {
                for(const bass of bassNotes.sort(compare(previous.bass))) {
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
                    const solution = new HarmonizedChord(soprano, alto, tenor, bass);
                    if(!Progression.Checks.checkAll(solution, previous[0])) {
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