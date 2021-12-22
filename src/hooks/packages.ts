import type { PackagePublishedEvent, PullRequestOpenedEvent, Schema } from "@octokit/webhooks-types";
import Room from "chatexchange/dist/Room";

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
 * @param room chat room the bot is listening to
 * @param payload "updated" package event payload
 */
export const handlePackagePublished = async (room: Room, payload: PackagePublishedEvent) => {

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

    await room.sendMessage(template);

    return true;
};
