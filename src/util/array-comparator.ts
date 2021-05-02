export function arrayComparator<T>(a: T[], b: T[]) {
    for(let i = 0; i < a.length && i < b.length; i++) {
        if(a[i] > b[i]) {
            return -1;
        } else if(a[i] < b[i]) {
            return 1;
        }
    }
    return 0;
}
