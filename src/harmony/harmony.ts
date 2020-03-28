import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Note } from "../note/note";
import { PartWriting } from "./part-writing";
import { Progression, Predicate, Producer } from "./progression";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Accidental } from "../accidental";

function isDefined<T>(t: T | undefined): t is T {
    return !!t;
} 

/**
 * 
 * TODO does not need to be symmetric
 */
function reconcileConstraints(one: IncompleteChord, two: IncompleteChord) {
    const compatible = <T>(one: T | undefined, two: T | undefined) => !one || !two || one == two;
    for(let voicePart in one.voices) {
        if(!compatible(one.voices[voicePart]?.name, two.voices[voicePart]?.name)) {
            return null;
        }
    }
    
    if(!compatible(one.root?.name, two.root?.name)) {
        return null;
    }
    if(!compatible(one.romanNumeral?.name, two.romanNumeral?.name)) {
        return null;
    }
    if(one.romanNumeral) {
        // TODO one should always have root in this case
        const oneNotes = one.romanNumeral?.intervals.map(interval => one.root ? interval.transposeUp(one.root).simpleName : undefined);
        if(!two.voices.filter(isDefined).every(note => oneNotes.includes(note.simpleName))){
            return null;
        }
    } else if(two.romanNumeral) {
        const twoNotes = two.romanNumeral?.intervals.map(interval => two.root ? interval.transposeUp(two.root).simpleName : undefined);
        if(!one.voices.filter(isDefined).every(note => twoNotes.includes(note.simpleName))){
            return null;
        }
    }

    const romanNumeral = one.romanNumeral || two.romanNumeral;
    const voices = [...new Array(Math.max(one.voices.length, two.voices.length))].map((_, index) => one.voices[index] || two.voices[index]);
    return new IncompleteChord({romanNumeral, voices});
}

function *findSolutions(reconciledConstraint: IncompleteChord, previous?: HarmonizedChord) {
    const mapToNearby = (previous: AbsoluteNote) => (note: Note) => [
        new AbsoluteNote(note.name + [previous.octavePosition - 1]),
        new AbsoluteNote(note.name + [previous.octavePosition]),
        new AbsoluteNote(note.name + [previous.octavePosition + 1])
    ];

    if(!reconciledConstraint.romanNumeral) {
        return;
    }
    const needed = reconciledConstraint.romanNumeral.intervals.map(interval => reconciledConstraint.root ? interval.transposeUp(reconciledConstraint.root) : undefined).filter(isDefined);
    let bassNote = reconciledConstraint.romanNumeral.inversion.transposeUp(reconciledConstraint.romanNumeral.root);

    let sopranoNotes, altoNotes, tenorNotes, bassNotes;
    if(previous) {
        const get = (voicePart: number) => {
            let voice = reconciledConstraint.voices[voicePart];
            if(isDefined(voice)) {
                return [voice];
            } else {
                return [...needed].flatMap(mapToNearby(previous.voices[voicePart]));
            }
        };
        const compare = (note: AbsoluteNote) => (one: AbsoluteNote, two: AbsoluteNote) => Math.abs(note.midi - one.midi) - Math.abs(note.midi - two.midi);
         //try smaller intervals first
        sopranoNotes = get(0).sort(compare(previous.voices[0]));
        altoNotes = get(1).sort(compare(previous.voices[1]));
        tenorNotes = get(2).sort(compare(previous.voices[2]));
        if(reconciledConstraint.voices[3] == undefined) {
            bassNotes = mapToNearby(previous.voices[3])(bassNote).sort(compare(previous.voices[3]));
        } else {
            bassNotes = [reconciledConstraint.voices[3]];
        }
    } else {
        const get = (needed: Note[]) => (voicePart: number) => {
            let voice = reconciledConstraint.voices[voicePart];
            if(isDefined(voice)) {
                return [voice];
            } else {
                const low = PartWriting.voiceRange[voicePart][1].octavePosition;
                const high = PartWriting.voiceRange[voicePart][2].octavePosition + 1;
                return [...needed].flatMap(note => [...Array(high - low).keys()].map((i) => new AbsoluteNote(note.letterName + Accidental.toString(note.accidental) + (i + low))));
            }
        };
        sopranoNotes = get(needed)(0);
        altoNotes = get(needed)(1);
        tenorNotes = get(needed)(2);
        bassNotes = get([bassNote])(3);
    }
    //TODO make more efficient by following doubling rules outright
    for(const bass of bassNotes) {
        for(const soprano of sopranoNotes) {
            for(const alto of altoNotes) {
                for(const tenor of tenorNotes) {
                    yield [soprano, alto, tenor, bass];
                }
            }
        }
    }
}

export namespace Harmony {
    export function *harmonize(scale: Scale, constraints: IncompleteChord[], previous: HarmonizedChord[], enabled: [Predicate, Producer][]) {
        let options: IncompleteChord[][];
        options = enabled.filter(([predicate, _]) => predicate(scale, previous)).flatMap(([_, producer]) => producer(scale, previous));
        for (const option of options) {
            let result = harmonizeOptions(scale, constraints, option, previous);
            if(result != null) {
                yield result;
            }
        }
    }

    function harmonizeOptions(scale: Scale, constraints: IncompleteChord[], option: IncompleteChord[], previous: HarmonizedChord[]): HarmonizedChord[] | null {
        // console.log([...previous].reverse().map(chord => chord.romanNumeral.name), option[0].romanNumeral?.name);
        const optionChord = option[0];
        const constraintChord = constraints[0];
        if(!constraintChord) {
            return [];
        }
        const reconciledConstraint = reconcileConstraints(optionChord, constraintChord);
        if(!reconciledConstraint || !reconciledConstraint.romanNumeral) {
            return null;
        }
        //instead of previous need to use previous fit
        for(const foundSolution of findSolutions(reconciledConstraint, previous[0])) {
            const [soprano, alto, tenor, bass] = foundSolution;
            const chord = new HarmonizedChord([soprano, alto, tenor, bass], reconciledConstraint.romanNumeral);
            if(!PartWriting.checkAll(chord, previous[0])) {
                continue;
            }
            //TODO ranking of solutions or make generator?
            let result;
            if(option.length > 1) {
                result = harmonizeOptions(scale, constraints.slice(1), option.slice(1), [chord, ...previous]);
                if(result != null) {
                    return [chord, ...result];
                }
            } else {
                return [ chord ];
            }
        }
        return null;
    }

    export function harmonizeAll(scale: Scale, constraints: IncompleteChord[], start: RomanNumeral, enabled: [Predicate, Producer][]): HarmonizedChord[] | null {
        //TODO harmonize tonic or come up with options
        const reconciledConstraint = reconcileConstraints(constraints[0], new IncompleteChord({romanNumeral: start}));
        if(!reconciledConstraint) {
            return null;
        }
        for(const beginning of findSolutions(reconciledConstraint)) {
            const chord = new HarmonizedChord(beginning, start);
            if(!PartWriting.checkSingular(chord)) {
                continue;
            }
            const result = harmonizeRecursive(scale, constraints.slice(1), [chord], enabled);
            if(result != null) {
                return [chord, ...result];
            }
        }
        return null;
    }

    export function harmonizeRecursive(scale: Scale, constraints: IncompleteChord[], previous: HarmonizedChord[], enabled: [Predicate, Producer][]): HarmonizedChord[] | null {
        if(!constraints.length) {
            return [];
        }
        for(let solution of harmonize(scale, constraints, previous, enabled)){
            const result = harmonizeRecursive(scale, constraints.slice(solution.length), [...[...solution].reverse(), ...previous], enabled);
            if(result != null) {
                return [...solution, ...result];
            }
        }
        return null;
    }
}