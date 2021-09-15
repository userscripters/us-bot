const ignoredUsers = new Map();
export const getIgnoredUsers = (room) => {
    const { id } = room;
    const ignoredList = ignoredUsers.get(id) || new Set();
    ignoredUsers.set(id, ignoredList);
    return ignoredList;
};
export const ignoreUser = (room, idOrUser) => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof idOrUser === "number" ? idOrUser : idOrUser.id;
    ignoredList.add(userId);
};
export const pardonUser = (room, idOrUser) => {
    const ignoredList = getIgnoredUsers(room);
    const userId = typeof idOrUser === "number" ? idOrUser : idOrUser.id;
    ignoredList.delete(userId);
};
