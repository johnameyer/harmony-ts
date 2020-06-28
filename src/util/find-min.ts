export function findMin<T>(arr: T[], comparator: (first: T, second: T) => number) {
    let min = 0;
    for(let i = 1; i < arr.length; i++) {
        if(comparator(arr[min], arr[i]) > 0) {
            min = i;
        }
    }
    return min;
}