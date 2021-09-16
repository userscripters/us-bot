export const splitENV = (env = "") => env.split(/\s*\|\s*/);
export const mdLink = (url, title = url) => `[${title}](${url})`;
export const pluralize = (num, text, suffix = "s") => {
    const rules = new Intl.PluralRules("en-US");
    const plural = rules.select(num) !== "one" ? `${text}${suffix}` : text;
    return `${num} ${plural}`;
};
export const listify = (...items) => items.length > 2
    ? `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
    : items.join(", ");
export const splitArgs = (text) => text
    .split(/(?<!"[\w ]+)\s+(?![\w ]+")/)
    .map((t) => t.replace(/^"(.+)"$/, "$1"));