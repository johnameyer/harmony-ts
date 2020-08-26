export function * iteratorFlatMap<T, U>(iterator: Iterable<T>, mapping: (t: T) => Iterable<U>) {
    for(const t of iterator) {
        yield * mapping(t);
    }
}