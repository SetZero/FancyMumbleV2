/* listen for the return message once the tweet has been loaded */
window.addEventListener("message", (event) => {
    if (event.origin !== "https://twitframe.com") return;

    const { element, height } = event.data;
    element.style.height = `${height}px`;
});

export function createEmbeddedIFrame(url: string): Node {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.minWidth = '480px';
    iframe.style.minHeight = '270px';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';
    iframe.style.colorScheme = 'auto';
    iframe.className = 'embedded-iframe';
    iframe.allowFullscreen = true;

    iframe.onload = (el) => {
        console.log("iframe loaded", el);
        //iframe.contentWindow?.postMessage({ element: el.target, query: "height" },
        //    "https://twitframe.com");
    }


        return iframe;
    }