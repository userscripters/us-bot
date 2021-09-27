import dotenv from "dotenv";
import got from "got";
import { URL, URLSearchParams } from "url";
dotenv.config();
const { OXFORD_ID, OXFORD_KEY } = process.env;
const request = got.extend({
    headers: {
        app_id: OXFORD_ID,
        app_key: OXFORD_KEY,
    },
    responseType: "json",
});
export const API_BASE = "https://od-api.oxforddictionaries.com/api";
export const API_VER = 2;
export const API_LANG = "en-gb";
export const getDefinitions = async (word) => {
    try {
        const url = new URL(`${API_BASE}/v${API_VER}/entries/${API_LANG}/${word.toLowerCase()}`);
        url.search = new URLSearchParams({ fields: "definitions" }).toString();
        const res = await request(url);
        const { body, statusCode } = res;
        if (statusCode !== 200) {
            console.log({ body });
            return [];
        }
        const { results = [] } = typeof body === "string" ? JSON.parse(body) : body;
        return results.flatMap(({ lexicalEntries = [] }) => lexicalEntries.flatMap(({ entries = [] }) => entries.flatMap(({ senses = [] }) => senses.flatMap(({ definitions = [] }) => definitions))));
    }
    catch (error) {
        console.log({ error });
        return [];
    }
};
