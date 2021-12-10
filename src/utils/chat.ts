/**
 * @summary strips chat message leading @-mention
 * @param text text to process
 * @param name @-mention to strip out
 */
export const stripLeadingMention = (text: string, name: string) => {
    const nameexpr = new RegExp(`^@${name.replace(/\s+/g, "")}:?\\s+`, "i");
    return text.replace(nameexpr, "");
}