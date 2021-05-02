export interface PeekableIterator<T> extends Iterable<T> {
    [Symbol.iterator](): IterableIterator<T>;
    hasItems: boolean;
}

export function makePeekableIterator<S>(generator: IterableIterator<S>) {
    let top: S | undefined;

    const wrapped = function * () {
        if(top) {
            yield top;
        }
        for(const item of generator) {
            if(!top) {
                top = item;
            }
            yield item;
        }
    }();

    const proxyHandler = {
        get: (_: any, prop: symbol | string) => {
            if(prop == Symbol.iterator) {
                return () => wrapped;
            }
            if(prop == 'hasItems') {
                if(!top) {
                    top = generator.next().value;
                }
                return top !== undefined;
            }
            // @ts-ignore
            return Reflect.get(...arguments);
        }
    };

    return new Proxy({}, proxyHandler) as PeekableIterator<S>;
}