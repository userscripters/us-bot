import type Room from "chatexchange/dist/Room";
import type Queue from "p-queue";

/**
 * @summary strips chat message leading @-mention
 * @param text text to process
 * @param name @-mention to strip out
 */
export const stripLeadingMention = (text: string, name: string) => {
    const nameexpr = new RegExp(`^@${name.replace(/\s+/g, "")}:?\\s+`, "i");
    return text.replace(nameexpr, "");
};

/**
 * @summary split message into chunks equal to the char limit and send in sequence
 * @param queue message queue instance
 * @param room room to send messages to
 * @param message message to process and send
 * @param limit character limit
 */
export const sendMultipartMessage = (queue: Queue, room: Room, message: string, limit: number) => {
    const messages = message
        .split(new RegExp(`(^(?:.|\\n|\\r){1,${limit}})(?:\\n|\\s|$)`, "gm"))
        .filter(Boolean);

    for (const message of messages) {
        queue.add(() => room.sendMessage(message));
    }

    return queue;
};