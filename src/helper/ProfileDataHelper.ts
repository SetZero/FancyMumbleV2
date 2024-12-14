import { invoke } from "@tauri-apps/api/core";
import { UserCommentData } from "../store/features/users/userSlice";

const TOKEN = ">>>FM;";

export async function parseUserCommentForData(data: string): Promise<UserCommentData | null> {
    if (!data) {
        return null;
    }

    console.log("updating user comment data");
    let index = data.indexOf(TOKEN);
    if (index > -1) {
        const raw_data = data.substring(index + TOKEN.length);
        console.log(raw_data);

        let result = await invoke('unzip_data_from_utf8', { data: raw_data })
            .then((result) => {
                const json = JSON.parse(result as string);
                console.log("JSON", json);
                return json;
            })
            .catch((error) => {
                console.log(error);
                return { comment: '', background_picture: '', settings: {} };
            });
        return { comment: '', background_picture: '', settings: result };
    }

    return null;
}

export async function encodeUserCommentData(comment: string, data: UserCommentData | null): Promise<string> {
    if (!data) {
        data = { comment: comment, background_picture: '', settings: {} };
    }
    const json = JSON.stringify(data.settings);
    const compressed = await invoke('zip_data_to_utf8', { data: json, quality: 11 });
    if (comment && comment.includes(TOKEN)) {
        return comment.split(TOKEN)[0] + TOKEN + (compressed as string);
    } else {
        return (comment || '') + TOKEN + (compressed as string);
    }
}