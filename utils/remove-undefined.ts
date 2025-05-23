export function removeUndefined<T extends object>(obj: T): Partial<T> {
    const result = { ...obj };
    Object.keys(result).forEach((key) => {
        if (result[key as keyof T] === undefined) {
            delete result[key as keyof T];
        }
    });
    return result;
}
