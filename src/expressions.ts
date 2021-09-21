export const WHO_WE_ARE = /^who are (?:we|UserScripters)/;

export const SHOOT_THEM = /^shoot @[\w-]+/;

export const ADD_IDEA = /^(?:create|add|new)(?: (?:user)?script)? idea\s+.+/;

export const ADD_REPO = /^(?:create|add|new) repo(?:sitory)?/;

// https://chat.stackoverflow.com/transcript/message/53071488#53071488
export const LIST_COLUMNS =
    /^(?:list|show|display)(?:( columns(?!.*columns\s*$)|(?=.*columns$))(?: (?:from|of|for)|)(?: the|)( "\w+?" project)(?: columns)?)/;

export const LIST_MEMBERS =
    /^who (?:are|is)(?: (?:the|our))?(?: organi[sz]ation)? members?/;

export const LIST_PACKAGES =
    /^what (?:are|is)(?: (?:the|our))?(?: organi[sz]ation)? packages?/;

export const LIST_PROJECTS =
    /^(?:list|our|show|display)(?: our|orgs?)? projects?/;
