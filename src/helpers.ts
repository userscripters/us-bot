/**
 * @summary splits ENV field into an array of strings
 */
export const splitENV = (env = "") => env.split(/\s*\|\s*/);

/**
 * @summary makes a markdown link
 */
export const mdLink = (url: string, title = url) => `[${title}](${url})`;
