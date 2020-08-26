import { NestedIterable } from "./nested-iterable";

export function * nestedIterableMap<T>(iterator: NestedIterable<T>, mapping: (t: NestedIterable<T>, previous: T[]) => NestedIterable<T>, previous: T[] = []): NestedIterable<T> {
    for(const [t, nested] of mapping(iterator, previous)) {
        yield [t, nestedIterableMap(nested, mapping, [...previous, t])] as [T, NestedIterable<T>];
    }
}