export function isString(value: any): value is string {
    return String(value) === value;
}

export function isNumber(value: any): value is number {
    return Number(value) === value;
}

export function isDefined <T> (value: T | undefined): value is T {
    return value !== undefined;
}