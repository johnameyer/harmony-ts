export function * defaultChainedIterator<T>(wrapped: Iterable<T>, otherwise: () => Iterable<T>) {
    let yielded = false;
    for(const item of wrapped) {
        yielded = true;
        yield item;
    }
    if(!yielded) {
        yield * otherwise();
    }
}
