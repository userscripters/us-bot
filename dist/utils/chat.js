export const stripLeadingMention = (text, name) => {
    const nameexpr = new RegExp(`^@${name.replace(/\s+/g, "")}:?\\s+`, "i");
    return text.replace(nameexpr, "");
};
