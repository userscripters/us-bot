import { mdLink } from "../helpers.js";
export const makeIsPackageEvent = (action) => (payload) => "action" in payload &&
    "package" in payload &&
    payload.action === action;
export const handlePackageUpdate = async (room, payload) => {
    const { package: { updated_at, name, html_url: packageUrl, package_version }, sender: { login: senderName, html_url: senderUrl } } = payload;
    const { version, release } = package_version;
    const { author, html_url: releaseUrl } = release;
    const { login: authorName, html_url: authorUrl } = author;
    const template = `**new package version**
Package:   ${mdLink(packageUrl, name)}
Version:   ${version} | ${mdLink(releaseUrl, "release")}
Authored:  ${mdLink(authorUrl, authorName)}
Timestamp: ${updated_at}
---------
Versioned on behalf of ${mdLink(senderUrl, senderName)}`;
    await room.sendMessage(template);
    return true;
};
