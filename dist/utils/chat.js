export const stripLeadingMention = (text, name) => {
    const nameexpr = new RegExp(`^@${name.replace(/\s+/g, "")}:?\\s+`, "i");
    return text.replace(nameexpr, "");
};
export const sendMultipartMessage = (queue, room, message, limit) => {
    const messages = message
        .split(new RegExp(`(^(?:.|\\n|\\r){1,${limit}})(?:\\n|\\s|$)`, "gm"))
        .filter(Boolean);
    for (const message of messages) {
        queue.add(() => room.sendMessage(message));
    }
    return queue;
};
