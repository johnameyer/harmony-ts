import { NestedIterable } from "./nested-iterable";

export function * nestedIterableMap<T>(iterator: NestedIterable<T>, mapping: (t: NestedIterable<T>, previous: T[]) => IterableIterator<[T, NestedIterable<T>]>, previous: T[] = []): NestedIterable<T> {
    for(const [u, nested] of mapping(iterator, previous)) {
        yield [u, nestedIterableMap(nested, mapping, [...previous, u])] as [T, NestedIterable<T>];
    }
}