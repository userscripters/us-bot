export const makeIsPackageEvent = (action) => (payload) => "action" in payload &&
    "package" in payload &&
    payload.action === action;
export const handlePackagePublished = async (room, payload) => {
    const { package: { updated_at, name, html_url: packageUrl, package_version }, sender: { login: senderName, html_url: senderUrl } } = payload;
    const { version, html_url: versionUrl, author } = package_version;
    const { login: authorName, html_url: authorUrl } = author;
    const template = `
new package version published
---------
Package:   ${name} (${packageUrl})
Version:   ${version} (${versionUrl})
Authored:  ${authorName} (${authorUrl})
Timestamp: ${updated_at}
---------
Versioned by ${senderName}
${senderUrl}`;
    await room.sendMessage(template);
    return true;
};
