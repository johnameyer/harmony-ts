import { makeLazyMultiIterable, LazyMultiIterable } from "./make-lazy-iterator";
import { makePeekableIterator } from "./make-peekable-iterator";

export type NestedIterable<T> = IterableIterator<[T, NestedIterable<T>]>;

export function * unnestNestedIterable<T>(generator: NestedIterable<T>): IterableIterator<T[]> {
    for(const [t, gen] of generator) {
        let hasYielded = false;
        for(const inner of unnestNestedIterable(gen)) {
            hasYielded = true;
            yield [t, ...inner];
        }
        if(!hasYielded) {
            yield [t];
        }
    }
}

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

export function * resultsOfLength<T>(generator: NestedIterable<T[]>, length: number): NestedIterable<T[]> {
    for(const [t, gen] of generator) {
        const inner = makePeekableIterator(resultsOfLength(gen, length - t.length));
        if(inner.hasItems) {
            yield [t, inner];
        } else if(t.length === length){
            yield [t, inner];
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