export interface LazyMultiIterable<T> {
    [Symbol.iterator](): Iterator<T>;
    [index: number]: T;
};

export function makeLazyMultiIterable<S>(generator: IterableIterator<S>) {
    const arr: (S | undefined)[] = new Array();

    const proxyHandler = {

        get: (_: S[], prop: symbol | string) => {
            if(prop == Symbol.iterator) {
                return function * () {
                    let i = 0;
                    for(; i < arr.length; i++) {
                        yield arr[i];
                    }
                    for(const result of generator) {
                        arr[i] = result;
                        yield arr[i];
                        i++;
                    }
                }
            }
            if(prop == 'length') {
                return arr.length;
            }
            // @ts-ignore
            if(arr[prop] === undefined) {
                // @ts-ignore
                for(let i = 0; i < prop; i++) {
                    const next = generator.next();
                    if(next.done) {
                        break;
                    }
                    arr[i] = next.value;
                }
            }
            // @ts-ignore
            return Reflect.get(...arguments);
        }
    }

    return new Proxy(arr, proxyHandler) as LazyMultiIterable<S>;
}