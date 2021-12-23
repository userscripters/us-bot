export const makeEventGuard = (action) => (payload) => "action" in payload &&
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
export const handlePullRequestOpened = async (room, payload) => {
    const { pull_request: { html_url: prUrl, title, user, body, created_at }, repository: { full_name } } = payload;
    const { login, html_url: userUrl, id } = user;
    const { DEPENDABOT_ID } = process.env;
    if (DEPENDABOT_ID && +DEPENDABOT_ID === id) {
        console.log("PR is opened by Dependabot, aborting");
        return true;
    }
    const template = `
pull request opened
---------
Repository: ${full_name}
PR URL:     ${prUrl}
Title:      ${title}
About:      ${body}
Timestamp:  ${created_at}
---------
Opened by ${login} (${userUrl})
    `;
    await room.sendMessage(template);
    return true;
};
export const handlePushedTag = async (room, payload) => {
    try {
        const { pusher, head_commit, repository, created, deleted, forced, ref } = payload;
        if (!ref.includes("/refs/tags/")) {
            return true;
        }
        const { full_name, html_url: repoUrl } = repository;
        const { message, timestamp, author, committer, id, added = [], removed = [], modified = [] } = head_commit || {};
        const { name } = pusher;
        const { username: authorName } = author || {};
        const { username: committerName } = committer || {};
        const actionMap = [
            [created, "created"],
            [deleted, "removed"]
        ];
        const [, action] = actionMap.find(([a]) => !!a) || [, "changed"];
        const hash = id ? ` (#${id.slice(0, 8)})` : "";
        const template = `
${forced ? "force-" : ""}${action} a tag${hash}
---------
Repository: ${full_name} (${repoUrl})
Message:    ${message || "unknown"}

Stats:
- ${added.length} added
- ${removed.length} removed
- ${modified.length} changed

Authored:   ${authorName || "unknown"}
Committed:  ${committerName || "unknown"}
Timestamp:  ${timestamp || "unknown"}
---------
Pushed by ${name}`;
        await room.sendMessage(template);
        return true;
    }
    catch (error) {
        console.warn(error);
        return false;
    }
};
