/**
 * @summary splits ENV field into an array of strings
 */
export const splitENV = (env = "") => env.split(/\s*\|\s*/);

/**
 * @summary makes a markdown link
 */
export const mdLink = (url: string, title = url) => `[${title}](${url})`;

/**
 * @summary saves us from Jeff with a giant S
 */
export const pluralize = (num: number, text: string, suffix = "s") => {
    const rules = new Intl.PluralRules("en-US");
    const plural = rules.select(num) !== "one" ? `${text}${suffix}` : text;
    return `${num} ${plural}`;
};

/**
 * @summary turns list of items into a enumeration
 */
export const listify = (...items: string[]) =>
    items.length > 2
        ? `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
        : items.join(", ");

/**
 * @summary splits text arguments to pass into command manager
 */
export const splitArgs = (text: string) =>
    text
        .split(/(?<!"[\w ]+)\s+(?![\w ]+")/)
        // removes extra quotes from arguments
        .map((t) => t.replace(/^"(.+)"$/, "$1"));
