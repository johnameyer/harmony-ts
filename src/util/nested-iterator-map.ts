import { NestedIterable } from './nested-iterable';

export function * preorderNestedIterableMap<T, U = T>(iterator: NestedIterable<T>, mapping: (t: NestedIterable<T>, previous: U[]) => IterableIterator<[U, NestedIterable<T>]>, previous: U[] = []): NestedIterable<U> {
    for(const [ u, nested ] of mapping(iterator, previous)) {
        yield [ u, preorderNestedIterableMap(nested, mapping, [ ...previous, u ]) ] as [U, NestedIterable<U>];
    }
}

export function * postorderNestedIterableMap<T, U = T>(iterator: NestedIterable<T>, mapping: (t: IterableIterator<[T, NestedIterable<U>]>, previous: T[]) => IterableIterator<[U, NestedIterable<U>]>, previous: T[] = []): NestedIterable<U> {
    yield * mapping(function * () { 
        for(const [ t, nested ] of iterator) {
            yield [ t, postorderNestedIterableMap(nested, mapping, [ ...previous, t ]) ] as [T, NestedIterable<U>];
        }
    }(), previous);
}
