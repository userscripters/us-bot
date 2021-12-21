import type { PackageEvent, PackagePublishedEvent, PackageUpdatedEvent, Schema } from "@octokit/webhooks-types";
import Room from "chatexchange/dist/Room";
import { mdLink } from "../helpers.js";

/**
 * @summary makes a PackageEvent payload guard
 * @param action action type to check against
 */
export const makeIsPackageEvent =
    <T extends PackageEvent["action"]>(action: T) =>
        /**
         * @summary checks if a payload is a package event payload
         * @param payload payload to check
         */
        (payload: Schema): payload is (T extends "updated" ? PackageUpdatedEvent : PackagePublishedEvent) =>
            "action" in payload &&
            "package" in payload &&
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

    const { version, release } = package_version;

    const { author, html_url: releaseUrl } = release;

    const { login: authorName, html_url: authorUrl } = author;

    const template = `**new package version published**
Package:   ${mdLink(packageUrl, name)}
Version:   ${version} | ${mdLink(releaseUrl, "release")}
Authored:  ${mdLink(authorUrl, authorName)}
Timestamp: ${updated_at}
---------
Versioned on behalf of ${mdLink(senderUrl, senderName)}`;

    await room.sendMessage(template);

    return true;
};
