import { HarmonizedChord } from "../chord/harmonized-chord";
import { IncompleteChord } from "../chord/incomplete-chord";
import { AbsoluteNote } from "../note/absolute-note";
import { Note } from "../note/note";
import { PartWriting } from "./part-writing";
import { Predicate, Producer } from "./progression";
import { RomanNumeral } from "./roman-numeral";
import { Scale } from "../scale";
import { Accidental } from "../accidental";
import { isDefined } from "../util";

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
    if(!compatible(one.harmonicFunction, two.harmonicFunction)) {
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
    const harmonicFunction = one.harmonicFunction || two.harmonicFunction;
    const voices = [...new Array(Math.max(one.voices.length, two.voices.length))].map((_, index) => one.voices[index] || two.voices[index]);
    return new IncompleteChord({romanNumeral, voices, harmonicFunction});
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
    export interface Parameters {
        constraints: IncompleteChord[];
        scale: Scale;
        enabled: [Predicate, Producer][];
        greedy: boolean;
        /*
        * If greedy, whether to compare the total sum of all
        * TODO?
        culmulative: boolean;
        */
    }
    
    export interface Result {
        solution: HarmonizedChord[] | null;
        furthest: number;
    }
    
    export function *harmonize(params: Parameters, previous: HarmonizedChord[]) {
        let options: IncompleteChord[][];
        options = params.enabled.filter(([predicate, _]) => predicate(params.scale, previous)).flatMap(([_, producer]) => producer(params.scale, previous));
        for (const option of options) {
            let result = harmonizeOptions(params, option, previous);
            if(result != null) {
                yield result;
            }
        }
    }
    
    function harmonizeOptions(params: Parameters, option: IncompleteChord[], previous: HarmonizedChord[]): HarmonizedChord[] | null {
        // console.log([...previous].reverse().map(chord => chord.romanNumeral.name), option[0].romanNumeral?.name);
        const optionChord = option[0];
        const constraintChord = params.constraints[previous.length];
        if(!constraintChord) {
            return [];
        }
        const reconciledConstraint = reconcileConstraints(optionChord, constraintChord);
        if(!reconciledConstraint || !reconciledConstraint.romanNumeral) {
            return null;
        }
        //instead of previous need to use previous fit
        let results: HarmonizedChord[][] = [];
        for(const foundSolution of findSolutions(reconciledConstraint, previous[0])) {
            const [soprano, alto, tenor, bass] = foundSolution;
            const chord = new HarmonizedChord([soprano, alto, tenor, bass], reconciledConstraint.romanNumeral, reconciledConstraint.harmonicFunction);
            if(!PartWriting.Rules.testAll(chord, previous[0])) {
                continue;
            }
            let result;
            if(option.length > 1) {
                result = harmonizeOptions(params, option.slice(1), [chord, ...previous]);
                if(result != null) {
                    if(params.greedy) {
                        return [chord, ...result];
                    } else {
                        results.push([chord, ...result]);
                    }
                }
            } else {
                return [ chord ];
            }
        }
        if(!params.greedy && results.length > 0) {
            (results as any).sort((a: HarmonizedChord[], b: HarmonizedChord[]) => {
                let aScore = PartWriting.Preferences.evaluateAll(a[0], a[1]);
                let bScore = PartWriting.Preferences.evaluateAll(b[0], b[1]);
                for(let i = 0; i < aScore.length; i++) {
                    if(aScore[i] > bScore[i]){
                        return 1;
                    } else if(aScore[i] < bScore[i]) {
                        return -1;
                    }
                }
                return 0;
            });
            return results[0];
        }
        return null;
    }
    
    export function harmonizeAll(params: Parameters): Result {
        //TODO harmonize tonic or come up with options
        const start = new RomanNumeral('I',  params.scale);
        const reconciledConstraint = reconcileConstraints(params.constraints[0], new IncompleteChord({romanNumeral: start}));
        if(!reconciledConstraint) {
            return {solution: null, furthest: 0};
        }
        let furthest = 0;
        let results: HarmonizedChord[] = [];
        // TODO enable accumulate results before recursing
        for(const beginning of findSolutions(reconciledConstraint)) {
            const chord = new HarmonizedChord(beginning, start);
            if(!PartWriting.Rules.testSingular(chord)) {
                continue;
            }
            if(params.greedy) {
                const result = harmonizeRecursive(params, [chord]);
                if(result.solution != null) {
                    return {solution: [chord, ...result.solution], furthest: result.furthest};
                } else {
                    furthest = result.furthest > furthest ? result.furthest : furthest;
                }
            } else {
                results.push(chord);
            }
        }
        if(!params.greedy && results.length > 0) {
            (results as any).sort((a: HarmonizedChord, b: HarmonizedChord) => {
                let aScore = PartWriting.Preferences.evaluateSingle(a);
                let bScore = PartWriting.Preferences.evaluateSingle(b);
                for(let i = 0; i < aScore.length; i++) {
                    if(aScore[i] > bScore[i]){
                        return 1;
                    } else if(aScore[i] < bScore[i]) {
                        return -1;
                    }
                }
                return 0;
            });
            for(let chord of results) {
                const result = harmonizeRecursive(params, [chord]);
                if(result.solution != null) {
                    return {solution: [chord, ...result.solution], furthest: result.furthest};
                }
            }
        }
        return {solution: null, furthest: furthest};
    }
    
    export function harmonizeRecursive(params: Parameters, previous: HarmonizedChord[]): Result {
        if(params.constraints.length == previous.length) {
            return {solution: [], furthest: previous.length};
        }
        let furthest = previous.length;
        let results: HarmonizedChord[][] = [];
        for(let solution of harmonize(params, previous)){
            if(params.greedy) {
                const result = harmonizeRecursive(params, [...[...solution].reverse(), ...previous]);
                if(result.solution != null) {
                    return {solution: [...solution, ...result.solution], furthest: result.furthest};
                } else {
                    furthest = result.furthest > furthest ? result.furthest : furthest;
                }
            } else {
                results.push(solution);
            }
        }
        if(!params.greedy && results.length > 0) {
            (results as any).sort((a: HarmonizedChord[], b: HarmonizedChord[]) => {
                let aScore = PartWriting.Preferences.evaluateAll(a[0], previous[0]);
                let bScore = PartWriting.Preferences.evaluateAll(b[0], previous[0]);
                for(let i = 0; i < aScore.length; i++) {
                    if(aScore[i] > bScore[i]){
                        return 1;
                    } else if(aScore[i] < bScore[i]) {
                        return -1;
                    }
                }
                return 0;
            });
            for(let solution of results) {
                const result = harmonizeRecursive(params, [...[...solution].reverse(), ...previous]);
                if(result.solution) {
                    return {solution: [...solution, ...result.solution], furthest: result.furthest};
                }
            }
        }
        return {solution: null, furthest: furthest};
    }
}