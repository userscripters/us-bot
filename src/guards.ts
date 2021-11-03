import type Room from "chatexchange/dist/Room";
import type User from "chatexchange/dist/User";
import { getIgnoredUsers } from "./access.js";

/**
 * @summary checks if a user is in the ignore list
 * @param room Room to check the user in
 * @param user user id or user to check
 */
export const isIgnoredUser = (room: Room, user: number | User): boolean => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof user === "number" ? user : user.id;
    return ignoredList.has(userId);
};

