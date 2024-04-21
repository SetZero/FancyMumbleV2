import { Box } from "@mui/material";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { createEmbeddedIFrame } from "./DOMHelper";
import { UsersState } from "../store/features/users/userSlice";

interface LinkReplacement {
    regex: RegExp;
    replacement: string;
    inline: boolean;
}

class DOMMessageParser {
    static sanitizingHookRegistered = false;
    private document: Document;
    private replacementUrl: LinkReplacement[] = [
        { regex: /https:\/\/store\.steampowered\.com\/app\/([0-9]+)\/?.*/, replacement: 'steam://advertise/$1', inline: false },
        { regex: /https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/, replacement: 'https://www.youtube.com/embed/$1', inline: true },
        { regex: /https:\/\/www\.twitch\.tv\/videos\/([0-9]+)/, replacement: 'https://player.twitch.tv/?video=$1&parent=' + (window.location.hostname), inline: true },
        { regex: /https:\/\/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/, replacement: 'https://clips.twitch.tv/embed?clip=$1&parent=' + (window.location.hostname), inline: true },
        { regex: /https:\/\/www\.twitch\.tv\/([a-zA-Z0-9_-]+)/, replacement: 'https://player.twitch.tv/?channel=$1&parent=' + (window.location.hostname), inline: true },
        { regex: /https:\/\/twitter\.com\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/, replacement: 'https://twitframe.com/show?url=https://twitter.com/$1/status/$2&theme=dark', inline: true },
        { regex: /https:\/\/twitter\.com\/([a-zA-Z0-9_]+)/, replacement: 'https://twitframe.com/show?url=https://twitter.com/$1&theme=dark', inline: true },
        { regex: /https:\/\/giphy.com\/gifs\/.*-([a-zA-Z0-9_-]+)/, replacement: 'https://giphy.com/embed/$1', inline: true },
    ];

    constructor(input: string) {
        const parser = new DOMParser();
        this.document = parser.parseFromString(input, "text/html");

        if (DOMMessageParser.sanitizingHookRegistered) {
            return;
        }

        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
            DOMMessageParser.sanitizingHookRegistered = true;
            console.log("Sanitizing attributes");
            DOMPurify.addHook('afterSanitizeAttributes', function (node) {
                if (node.tagName && node.tagName === 'IMG' && node.hasAttribute('src')) {
                    const src = node.getAttribute('src');
                    if (src && src.startsWith('http')) {
                        console.log("Sanitizing attributes for image: ", node.getAttribute('src'));
                        node.removeAttribute('src');
                    }
                }

                if (node.tagName && node.tagName === 'VIDEO' && node.hasAttribute('src')) {
                    const src = node.getAttribute('src');
                    if (src && src.startsWith('http')) {
                        console.log("Sanitizing attributes for video: ", node.getAttribute('src'));
                        node.removeAttribute('src');
                    }
                }
            });
        });
    }

    parseForImages() {
        Array.from(this.document.querySelectorAll('img')).forEach(e => {
            e.setAttribute('style', 'max-width: 100%;');
        });

        return this;
    }

    parseForVideos() {
        Array.from(this.document.querySelectorAll('video')).forEach(e => {
            e.setAttribute('class', 'user-video-element');
        });

        return this;
    }

    parseForLinks() {
        Array.from(this.document.querySelectorAll('a')).forEach(e => {
            let replaced = !this.replacementUrl.every(r => {
                if (e.getAttribute('href')?.match(r.regex)) {
                    let replaced = e.getAttribute('href')?.replace(r.regex, r.replacement) ?? '';

                    if (!r.inline) {
                        e.setAttribute('href', replaced);
                    } else {
                        const b = createEmbeddedIFrame(replaced);
                        e.parentElement?.replaceChild(b, e);
                    }
                    return false;
                }
                return true;
            });
            if (!replaced) e.setAttribute('target', '_blank');
        });

        return this;
    }

    build() {
        return this.document.body.innerHTML;
    }
}

class MessageParser {
    private input: string;

    constructor(input: string) {
        this.input = input;
    }

    parseDOM(dom: (value: DOMMessageParser) => DOMMessageParser) {
        console.log("Parsing DOM");
        this.input = dom(new DOMMessageParser(this.input)).build();

        return this;
    }

    parseLinks() {
        const regex = /(?<!\S)((?:https?:\/\/)(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-zA-Z0-9()]{2,20}\b[-a-zA-Z0-9()@:%_\+.,~#?&\/=]*)/;
        this.input = this.input.replace(regex, '<a href="$1" target="_blank">$1</a>');

        return this;
    }

    parseCommands(userInfo: UsersState | undefined, messageCall: (data: string, userInfo: UsersState | undefined) => void) {
        const commandRegex = /^(@[A-Za-z]+)\s*(.*)/
        let foundCommand = this.input.match(commandRegex);
        if (!foundCommand) return this;

        //TODO: Move this to the backend
        switch (foundCommand[1]) {
            case "@dice":
                let diceRoll = Math.floor(Math.random() * 6) + 1;
                this.input = this.input.replace(commandRegex, "The dice rolled: \n # " + diceRoll);
                break;
            case "@coin":
                let coinFlip = Math.floor(Math.random() * 2) + 1;
                this.input = this.input.replace(commandRegex, "Coin flip: " + (coinFlip === 1 ? "Heads" : "Tails"));
                break;
            case "@timer":
                this.input = 'Timer has been set to ' + foundCommand[2];
                this.waitAndExecute(foundCommand[2], (remainingStr: string) => {
                    messageCall("Timer: " + remainingStr, userInfo);
                });
                break;
            default:
                console.log("Unknown command: ", foundCommand);
        }

        return this;
    }

    private waitAndExecute(timeStr: string, callback: (remainingStr: string) => void): void {
        let time = 0;
        let remainingStr = '';
        let timeUnits = timeStr.split(' ');

        for (let i = 0; i < timeUnits.length; i++) {
            let unitTime = parseInt(timeUnits[i]);
            let unit = timeUnits[i].replace(unitTime.toString(), '');

            switch (unit) {
                case 'ms':
                    time += unitTime;
                    break;
                case 's':
                    time += unitTime * 1000;
                    break;
                case 'm':
                    time += unitTime * 60000;
                    break;
                case 'h':
                    time += unitTime * 3600000;
                    break;
                default:
                    remainingStr = timeUnits.slice(i).join(' ');
                    i = timeUnits.length;
                    break;
            }
        }

        setTimeout(() => callback(remainingStr), time);
    }

    parseMarkdown() {
        this.input = marked.parseInline(this.input);

        return this;
    }

    public build() {
        return (<Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(this.input) }}></Box>);
    }

    public buildString() {
        return DOMPurify.sanitize(this.input);
    }
}

export default MessageParser;