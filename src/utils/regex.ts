/**
 * @summary safely matches a string
 */
export const safeMatch = (regex: RegExp, text: string): string[] => {
    const [, ...groups] = regex.exec(text) || [];
    return groups;
};
