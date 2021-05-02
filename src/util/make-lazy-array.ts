export function makeLazyArray<S>(producers: (() => S)[]) {
    const arr: (S | undefined)[] = new Array(producers.length);

    const proxyHandler = {
        get(_: S[], prop: string) {
            if(prop == 'length') {
                return arr.length;
            }
            // @ts-ignore
            if(arr[prop] === undefined) {
                // @ts-ignore
                const producer = producers[prop];
                if(producer) {
                    // @ts-ignore
                    arr[prop] = producer();
                }
            }
            // @ts-ignore
            return Reflect.get(...arguments);
        },
    };

    return new Proxy(arr, proxyHandler) as S[];
}
