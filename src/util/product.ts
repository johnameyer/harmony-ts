type Product<T extends unknown[][]> = { [I in keyof T]: T[I] extends (infer U)[] ? U : never }[];

/**
 * Util function allowing for iterating over multiple arrays 
 * @param args the arrays to iterate over
 * @returns an array of all possible combinations / the cartesian product
 */
export function product<T extends unknown[][]>(...args: T): Product<T> {
    return <Product<T>><unknown>args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))
}