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

/**
 * @summary checks if a given room matches the id
 * @param room Room to check
 * @param roomId room id to compare to
 */
export const isSameRoom = (room: number | Room, roomId: number) =>
    (typeof room === "number" ? room : room.id) === roomId;

/**
 * @summary checks if a given string is a numeric string
 * @param str string to check
 */
export const isNumericString = (str: string) => !Number.isNaN(+str);