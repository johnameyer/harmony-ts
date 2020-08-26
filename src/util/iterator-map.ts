export function * iteratorMap<T, U>(iterator: Iterable<T>, mapping: (t: T) => U) {
    for(const t of iterator) {
        yield mapping(t);
    }
}