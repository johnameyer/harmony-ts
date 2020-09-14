export function * defaultIterator<T>(wrapped: Iterable<T>, otherwise: () => T) {
    let yielded = false;
    for(const item of wrapped) {
        yielded = true;
        yield item;
    }
    if(!yielded) {
        yield otherwise();
    }
}