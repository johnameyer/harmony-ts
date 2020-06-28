/**
 * Swap two items in the array
 * @param arr the array to swap the elements in
 * @param first the first index
 * @param second the second index
 */
function swap<T>(arr: T[], first: number, second: number) {
    [arr[first], arr[second]] = [arr[second], arr[first]];
}

/**
 * Returns an iterator that points to the index in the array that the next min (according to the provided comparator) is located at
 * This function mutates the original array
 * @param arr the array (will be reordered)
 * @param comparator the comparison function to find the minimum by
 * @returns a generator that yields the position of the next-most-minimum element
 */
export function * minGenerator<S, T>(arr: S[], mapper: (value: S) => T, comparator: (first: T, second: T) => number) {
    let start = 0;
    let mapped = arr.map(mapper);
    while(arr.length > start) {
        let min = start;
        for(let i = start + 1; i < arr.length; i++) {
            if(comparator(mapped[min], mapped[i]) > 0) {
                min = i;
            }
        }
        swap(arr, start, min);
        yield start;
        start++;
    }
}