export function makeLazyArray<S>(producers: (() => S)[]) {
    const arr: (S | undefined)[] = new Array(producers.length);

    const proxyHandler = {
        get(_: S[], prop: string) {
            if(prop == 'length') {
                return arr.length;
            }
            // @ts-expect-error
            if(arr[prop] === undefined) {
                // @ts-expect-error
                const producer = producers[prop];
                if(producer) {
                    // @ts-expect-error
                    arr[prop] = producer();
                }
            }
            // @ts-expect-error
            return Reflect.get(...arguments);
        },
    };

    return new Proxy(arr, proxyHandler) as S[];
}
