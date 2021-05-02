export const returnOrError = <T>(t: T | undefined | null) => {
    if(t === undefined || t === null) {
        throw new Error('Value is falsy');
    }
    return t;
};