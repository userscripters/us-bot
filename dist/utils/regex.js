export const safeMatch = (regex, text) => {
    const [, ...groups] = regex.exec(text) || [];
    return groups;
};
