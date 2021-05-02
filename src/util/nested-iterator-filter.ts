import { NestedIterable } from './nested-iterable';

export function * nestedIterableFilter<T>(iterator: NestedIterable<T>, filter: (t: T, previous: T[]) => boolean, previous: T[] = []): NestedIterable<T> {
    for(const [t, nested] of iterator) {
        if(filter(t, previous)) {
            yield [t, nestedIterableFilter(nested, filter, [...previous, t])] as [T, NestedIterable<T>];
        }
    }
}