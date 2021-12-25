import type { PackagePublishedEvent, PullRequestOpenedEvent, PullRequestReviewRequestedEvent, PushEvent, Schema } from "@octokit/webhooks-types";
import Room from "chatexchange/dist/Room";
import type Queue from "p-queue";
import { mdLink } from "../helpers.js";
import { sendMultipartMessage } from "../utils/chat.js";

/**
 * @summary makes a GitHub webhook payload guard
 * @param action action type to check against
 */
export const makeEventGuard =
    <T extends Extract<Schema, { action: string; }>>(action: T["action"]) =>
        /**
         * @summary concrete event guard
         * @param payload payload to check
         */
        (payload: Schema): payload is T =>
            "action" in payload &&
            payload.action === action;

/**
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#package
 * @summary handles the package "updated" event
 * @param queue message queue instance
 * @param room chat room the bot is listening to
 * @param payload "updated" package event payload
 */
export const handlePackagePublished = async (queue: Queue, room: Room, payload: PackagePublishedEvent) => {

    const {
        package: { updated_at, name, html_url: packageUrl, package_version },
        sender: { login: senderName, html_url: senderUrl }
    } = payload;

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

    sendMultipartMessage(queue, room, template, 500);

    return true;
};

/**
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
 * @summary handles a pull request "opened" event
 * @param queue message queue instance
 * @param room chat room the bot is listening to
 */
export const handlePullRequestOpened = async (queue: Queue, room: Room, payload: PullRequestOpenedEvent) => {

    const {
        pull_request: { html_url: prUrl, title, user, body, created_at },
        repository: { full_name }
    } = payload;

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

    sendMultipartMessage(queue, room, template, 500);

    return true;
};

/**
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push
 * @summary handles a "push" event (tags only)
 * @param queue message queue instance
 * @param room chat room the bot is listening to
 * @param payload event payload
 */
export const handlePushedTag = async (queue: Queue, room: Room, payload: PushEvent) => {
    try {
        const { pusher, head_commit, repository, created, deleted, forced, ref } = payload;

        if (!ref.includes("refs/tags/")) {
            console.log(`got a push event, not a tag push: ${ref}`);
            return true;
        }

        const { full_name, html_url: repoUrl } = repository;

        const {
            message, timestamp, author, committer, id,
            added = [], removed = [], modified = []
        } = head_commit || {};

        const { name } = pusher;

        const { username: authorName } = author || {};
        const { username: committerName } = committer || {};

        const actionMap: [boolean, string][] = [
            [created, "created"],
            [deleted, "removed"]
        ];

        const [, action] = actionMap.find(([a]) => !!a) || [, "changed"];

        const hash = id ? ` (#${id.slice(0, 7)})` : "";

        const commitStats = deleted ? `Ref: ${ref}` : `Message: ${message || "unknown"}
Stats: ${added.length} added, ${removed.length} removed, ${modified.length} changed

Authored:   ${authorName || "unknown"}
Committed:  ${committerName || "unknown"}
Timestamp:  ${timestamp || "unknown"}`;

        const template = `
${forced ? "force-" : ""}${action} a tag${hash}
---------
Repository: ${full_name} (${repoUrl})
${commitStats}
---------
Pushed by ${name}`;

        sendMultipartMessage(queue, room, template, 500);

        return true;

    } catch (error) {
        console.warn(error);
        return false;
    }
};

/**
 * @see https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
 * @summary handles a "pull_request" event (review requested only)
 * @param queue message queue instance
 * @param room chat room the bot is listening to
 * @param payload event payload
 */
export const handleReviewRequested = async (queue: Queue, room: Room, payload: PullRequestReviewRequestedEvent) => {
    try {
        const {
            repository: { full_name, html_url: repoUrl },
            pull_request: { html_url: prUrl, title, user, number },
            sender: { login: requesterName, html_url: requesterUrl, id: requesterId }
        } = payload;

        const { login, html_url: userUrl } = user;

        // TODO: pass bot config to the handler
        const { GITHUB_TO_CHAT_USERS = "[]" } = process.env;
        const uidMap: Map<number, string> = new Map(JSON.parse(GITHUB_TO_CHAT_USERS));

        const reviewerIds: Set<number> = new Set([requesterId]);

        const requested = "requested_reviewer" in payload ?
            payload.requested_reviewer :
            payload.requested_team;

        const { html_url, id } = requested;

        reviewerIds.add(id);

        const isTeam = "name" in requested;
        const username = isTeam ? requested.name : requested.login;
        const teamPfx = isTeam ? `[team] ` : "";

        const template = `
${requesterName} (${requesterUrl})
requested review from:
${teamPfx}${username} (${html_url})
---------
Repository: ${full_name} (${repoUrl})
PR URL:     ${prUrl}
Title:      ${title}
---------
Opened by ${login} (${userUrl})`;

        sendMultipartMessage(queue, room, template, 500);

        const cc: string[] = [];
        reviewerIds.forEach((id) => {
            if (!uidMap.has(id)) return;
            cc.push(`@${uidMap.get(id)}`);
        });

        if (cc.length) {
            const reviewPls = `${cc.join(", ")} please review ${mdLink(prUrl, `PR #${number}`)} when you have time, thank you`;
            sendMultipartMessage(queue, room, reviewPls, 500);
        }

        return true;

    } catch (error) {
        console.warn(error);
        return false;
    }
};