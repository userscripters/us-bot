import { getIgnoredUsers } from "./access.js";
export const isIgnoredUser = (room, user) => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof user === "number" ? user : user.id;
    return ignoredList.has(userId);
};
export const isSameRoom = (room, roomId) => (typeof room === "number" ? room : room.id) === roomId;
export const isNumericString = (str) => !Number.isNaN(+str);
