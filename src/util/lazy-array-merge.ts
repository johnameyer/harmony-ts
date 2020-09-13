import { makeLazyArray } from "./make-lazy-array";

export function lazyArrayMerge<S, T, U>(one: S[], two: T[], merge: (one: S, two: T) => U) {
    return makeLazyArray(new Array(Math.min(one.length, two.length)).fill(0).map((_, i) => merge.bind(undefined, one[i], two[i])));
}