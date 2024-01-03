
export interface LazyMultiIterable<T> extends IterableIterator<T> {
    reset(): void;
}

export function makeLazyMultiIterable<S>(generator: Iterator<S>) {
    const arr: (S | undefined)[] = [];
    let i = 0;

    const proxyHandler = {

        get: (_: S[], prop: symbol | string) => {
            if(prop == Symbol.iterator) {
                return function * () {
                    let i = 0;
                    for(; i < arr.length; i++) {
                        yield arr[i];
                    }
                    let { done, value } = generator.next();
                    while(!done) {
                        arr[i] = value;
                        yield arr[i];
                        i++;
                        ({ done, value } = generator.next());
                    }
                };
            }
            if(prop == 'length') {
                return arr.length;
            }
            if(prop == 'reset') {
                i = 0;
            }
            if(prop == 'next') {
                return () => {
                    i++;
                    if(arr[i] === undefined) {
                        // @ts-expect-error
                        for(let j = i; j < prop; j++) {
                            const next = generator.next();
                            if(next.done) {
                                break;
                            }
                            arr[j] = next.value;
                            return { value: arr[j] };
                        }
                    }
                };
            }
            // @ts-expect-error
            if(arr[prop] === undefined) {
                // @ts-expect-error
                for(let j = i; j < prop; j++) {
                    const next = generator.next();
                    if(next.done) {
                        break;
                    }
                    arr[j] = next.value;
                }
            }
            // @ts-expect-error
            return Reflect.get(...arguments);
        },
    };

    // @ts-expect-error
    return new Proxy(arr, proxyHandler) as LazyMultiIterable<S>;
}
