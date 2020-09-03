import { AbsoluteNote } from './note/absolute-note';
import { IncompleteChord } from './chord/incomplete-chord';
import { Scale } from './scale';
import { Harmonizer, HarmonizerParameters } from './harmony/harmonizer';
import { RomanNumeral } from './harmony/roman-numeral';
import { Interval } from './interval/interval';
import { Note } from './note/note';
import { Accidental } from './accidental';
import { Progression, ProgressionPredicate, ProgressionProducer } from './harmony/progression';
import { ChordQuality } from './chord/chord-quality';
import { IntervalQuality } from './interval/interval-quality';
import { Key } from './key';
import { PartWritingParameters, PartWriting, defaultPartWritingParameters } from './part-writing/part-writing';
import { Expansion, ExpansionOperator } from './harmony/expansion';
import { Chord } from './chord/chord';
import { HarmonizedChord } from './chord/harmonized-chord';
import { Motion } from './interval/motion';
import { ScaleDegree } from './harmony/scale-degree';
import { ComplexInterval } from './interval/complex-interval';
import { IChord } from './chord/ichord';
import { flattenResults, NestedIterable, resultsOfTotalLength, resultsOfLength, flattenResult } from './util/nested-iterable';
import { PartWriter, PartWriterParameters } from './part-writing/part-writer';

export {
    AbsoluteNote,
    Accidental,
    Chord,
    IncompleteChord,
    HarmonizedChord,
    IChord,
    Scale,
    Harmonizer,
    HarmonizerParameters,
    PartWriting,
    PartWritingParameters,
    PartWriter,
    PartWriterParameters,
    defaultPartWritingParameters,
    RomanNumeral,
    Interval,
    Note,
    Progression,
    ProgressionPredicate,
    ProgressionProducer,
    Expansion,
    ExpansionOperator,
    ChordQuality,
    IntervalQuality,
    Key,
    Motion,
    ScaleDegree,
    ComplexInterval,
    flattenResult,
    flattenResults,
    NestedIterable,
    resultsOfTotalLength,
    resultsOfLength
};