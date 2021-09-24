const ignoredUsers = new Map();
export const getIgnoredUsers = (room) => {
    const { id } = room;
    const ignoredList = ignoredUsers.get(id) || new Set();
    ignoredUsers.set(id, ignoredList);
    return ignoredList;
};
export const ignoreUser = (room, user) => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof user === "number" ? user : user.id;
    ignoredList.add(userId);
};
export const pardonUser = (room, user) => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof user === "number" ? user : user.id;
    ignoredList.delete(userId);
};
export const isIgnoredUser = (room, user) => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof user === "number" ? user : user.id;
    return ignoredList.has(userId);
};
