export function min<T>(arr: T[], comparator: (first: T, second: T) => number) {
    let min = arr[0];
    for(let i = 1; i < arr.length; i++) {
        if(comparator(min, arr[i]) > 0) {
            min = arr[i];
        }
    }
    return min;
}
