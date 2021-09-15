import Room from "chatexchange/dist/Room";
import User from "chatexchange/dist/User";

/**
 * @summary list of ignored users for various reasons
 */
const ignoredUsers: Map<number, Set<number>> = new Map();

/**
 * @summary lists ignored users of the room
 * @param room Room to list ignored users for
 */
export const getIgnoredUsers = (room: Room): Set<number> => {
    const { id } = room;
    const ignoredList = ignoredUsers.get(id) || new Set();
    ignoredUsers.set(id, ignoredList);
    return ignoredList;
};

/**
 * @summary ignores a given user
 * @param room Room to ignore the user in
 * @param idOrUser user id or user to ignore
 */
export const ignoreUser = (room: Room, idOrUser: number | User): void => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof idOrUser === "number" ? idOrUser : idOrUser.id;
    ignoredList.add(userId);
};

/**
 * @summary removes the user from the list of ignored ones
 * @param room Room to unignore user in
 */
export const pardonUser = (room: Room, idOrUser: number | User): void => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof idOrUser === "number" ? idOrUser : idOrUser.id;
    ignoredList.delete(userId);
};
