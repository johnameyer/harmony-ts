type ArrayItem<T> = T extends (infer S)[] ? S : never; 

type MappedCartesian<T> = {
    [K in keyof T]: ArrayItem<T[K]>
}

/**
 * Util function allowing for iterating over multiple arrays 
 * @param args the arrays to iterate over
 * @returns an array of all possible combinations / the cartesian product
 */
export function product<T extends any[][]>(...args: T): MappedCartesian<T>[] {
    return args.reduce(
        (results, entries) => results
            .map(result => entries.map(entry => result.concat([ entry ])))
            .reduce((subResults, result) => subResults.concat(result), []),
        [[]],
    );
}
