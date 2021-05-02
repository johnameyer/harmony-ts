import { makeLazyMultiIterable, LazyMultiIterable } from './make-lazy-iterator';
import { makePeekableIterator } from './make-peekable-iterator';

export type NestedIterable<T> = IterableIterator<[T, NestedIterable<T>]>;

export function * unnestNestedIterable<T>(generator: NestedIterable<T>): IterableIterator<T[]> {
    for(const [ t, gen ] of generator) {
        let hasYielded = false;
        for(const inner of unnestNestedIterable(gen)) {
            hasYielded = true;
            yield [ t, ...inner ];
        }
        if(!hasYielded) {
            yield [ t ];
        }
    }
}

export function * flattenResult<T>(generator: NestedIterable<T>): IterableIterator<T[]> {
    for(const [ t, gen ] of generator) {
        let hasYielded = false;
        for(const inner of flattenResult(gen)) {
            hasYielded = true;
            yield [ t, ...inner ];
        }
        if(!hasYielded) {
            yield [ t ];
        }
    }
}

export function * flattenResults<T>(generator: NestedIterable<T[]>): IterableIterator<T[]> {
    for(const [ t, gen ] of generator) {
        let hasYielded = false;
        for(const inner of flattenResults(gen)) {
            hasYielded = true;
            yield [ t, ...inner ].flatMap(x => x);
        }
        if(!hasYielded) {
            yield [ t ].flatMap(x => x);
        }
    }
}

export function * resultsOfLength<T>(generator: NestedIterable<T>, length: number): NestedIterable<T> {
    for(const [ t, gen ] of generator) {
        const inner = makePeekableIterator(resultsOfLength(gen, length - 1));
        if(inner.hasItems) {
            yield [ t, inner[Symbol.iterator]() ];
        } else if(length === 1) {
            yield [ t, inner[Symbol.iterator]() ];
        }
    }
}

export function * resultsOfTotalLength<T>(generator: NestedIterable<T[]>, length: number): NestedIterable<T[]> {
    for(const [ t, gen ] of generator) {
        const inner = makePeekableIterator(resultsOfTotalLength(gen, length - t.length));
        if(inner.hasItems) {
            yield [ t, inner[Symbol.iterator]() ];
        } else if(t.length === length) {
            yield [ t, inner[Symbol.iterator]() ];
        }
    }
}

export type NestedLazyMultiIterable<T> = LazyMultiIterable<[T, NestedLazyMultiIterable<T>]>;

export function convertToMultiIterator<T>(generator: NestedIterable<T>): NestedLazyMultiIterable<T> {
    function * handleNested(inner: NestedIterable<T>): Generator<[T, NestedLazyMultiIterable<T>]> {
        for(const [ t, gen ] of inner) {
            yield [ t, makeLazyMultiIterable(handleNested(gen)) ];
        }
    }
    return makeLazyMultiIterable(handleNested(generator));
}

export function * convertToDeepNested<T>(generator: NestedIterable<T[]>): NestedIterable<T> {
    function * handleNested(tArr: T[], nested: NestedIterable<T[]>): NestedIterable<T> {
        if(tArr.length) {
            yield [ tArr[0], handleNested(tArr.slice(1), nested) ];
        } else {
            yield * convertToDeepNested(nested);
        }
    }

    for(const [ t, nested ] of generator) {
        yield * handleNested(t, nested);
    }
}
