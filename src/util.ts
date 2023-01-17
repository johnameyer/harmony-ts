export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return Number.isFinite(value);
}

export function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}
