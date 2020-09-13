export function isString(value: any): value is string {
    return typeof value === 'string';
}

export function isNumber(value: any): value is number {
    return Number.isFinite(value);
}

export function isDefined <T> (value: T | undefined): value is T {
    return value !== undefined;
}