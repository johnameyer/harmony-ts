import { makeLazyMultiIterable, LazyMultiIterable } from "./make-lazy-iterator";

export type NestedIterable<T> = IterableIterator<[T, NestedIterable<T>]>;

export function * flattenResults<T>(generator: NestedIterable<T[]>): IterableIterator<T[]> {
    for(const [t, gen] of generator) {
        let hasYielded = false;
        for(const inner of flattenResults(gen)) {
            hasYielded = true;
            yield [t, ...inner].flatMap(x => x);
        }
        if(!hasYielded) {
            yield [t].flatMap(x => x);
        }
    }
}

export type NestedLazyMultiIterable<T> = LazyMultiIterable<[T, NestedLazyMultiIterable<T>]>;

export function convertToMultiIterator<T>(generator: NestedIterable<T>): NestedLazyMultiIterable<T> {
    function * handleNested(inner: NestedIterable<T>): Generator<[T, NestedLazyMultiIterable<T>]> {
        for(const [t, gen] of inner) {
            yield [t, makeLazyMultiIterable(handleNested(gen))];
        }
    }
    return makeLazyMultiIterable(handleNested(generator));
}