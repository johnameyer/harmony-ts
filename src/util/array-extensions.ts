export function group<T, K extends string | number | symbol>(arr: T[], fn: (item: T) => K) {
    return arr.reduce((prev, curr) => {
        const key = fn(curr);
        const group = prev[key] || [];
        group.push(curr);
        return { ...prev, [key]: group };
    }, {} as Record<K, T[]>);
}

export function groupIndices<T, K extends string | number | symbol>(arr: T[], fn: (item: T) => K) {
    return arr.reduce((prev, curr, index) => {
        const key = fn(curr);
        const group = prev[key] || [];
        group.push(index);
        return { ...prev, [key]: group };
    }, {} as Record<K, number[]>);
}

export function findIndices<T>(arr: T[], fn: (item: T, index: number) => boolean) {
    return arr.reduce((prev, curr, index) => {
        if(fn(curr, index)) {
            prev.push(index);
        }
        return prev;
    }, [] as number[]);
}

