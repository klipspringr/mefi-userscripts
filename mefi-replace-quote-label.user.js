// ==UserScript==
// @name         MeFi replace quote label
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-04-02
// @description  MetaFilter: nicer MefiQuote buttons
// @author       Klipspringer
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-replace-quote-label.user.js
// @updateURL    https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-replace-quote-label.user.js
// ==/UserScript==

const SVG_REPLY = `<svg xmlns="http://www.w3.org/2000/svg" hidden viewBox="0 0 100 80"><path id="mrql-reply" fill="currentColor" d="M 69.941 48.117 C 72.437 48.117 74.776 47.63 76.959 46.657 C 79.142 45.684 81.043 44.37 82.66 42.715 C 84.279 41.06 85.555 39.134 86.491 36.934 C 87.427 34.735 87.894 32.39 87.894 29.898 C 87.894 27.406 87.427 25.071 86.491 22.891 C 85.555 20.711 84.279 18.803 82.66 17.169 C 81.043 15.532 79.142 14.248 76.959 13.314 C 74.776 12.379 72.437 11.912 69.941 11.912 L 68.071 12.087 L 68.071 0 L 69.941 0 C 74.074 0 77.963 0.779 81.608 2.336 C 85.253 3.892 88.441 6.024 91.169 8.729 C 93.899 11.435 96.053 14.608 97.632 18.249 C 99.211 21.888 100 25.772 100 29.898 C 100 34.025 99.211 37.908 97.632 41.548 C 96.053 45.187 93.899 48.37 91.169 51.095 C 88.441 53.82 85.253 55.972 81.608 57.548 C 77.963 59.125 74.074 59.913 69.941 59.913 L 23.626 59.913 L 44.036 80 L 27.953 80 L 0 53.723 L 27.953 28.028 L 44.036 28.028 L 23.626 48.117 L 69.941 48.117 Z" /></svg>`;
const SVG_USE_REPLY = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="0.8em" viewBox="0 0 100 80"><use href="#mrql-reply" /></svg>`;

const getSetting = (key) => {
    try {
        return localStorage.getItem(key) || null;
    } catch {
        return null;
    }
};

const modifyQuoteButton = (quoteButtonNode, customText) => {
    // replace quote button content
    quoteButtonNode.innerHTML = customText || SVG_USE_REPLY; // DOM manipulation would be faster, but innerHTML is fast enough

    // move quote button to before flag button
    quoteButtonNode.parentNode.parentNode
        .querySelector("span[id^='flag']")
        ?.before(quoteButtonNode.parentNode);

    // mark as done so we don't pick this up again
    quoteButtonNode.setAttribute("data-mrql-done", "");
};

const modifyQuoteButtons = (customText) => {
    const start = performance.now();

    const quoteButtonNodes = document.querySelectorAll(
        'a[class="quotebutton"]:not([data-mrql-done])'
    );

    for (const quoteButtonNode of quoteButtonNodes)
        modifyQuoteButton(quoteButtonNode, customText);

    console.log(
        "mefi-replace-quote-label",
        quoteButtonNodes.length,
        Math.round(performance.now() - start) + "ms"
    );
};

(() => {
    if (!/^\/(\d|comments\.mefi)/.test(window.location.pathname)) return;

    const customText = getSetting("mefi-replace-quote-label");
    if (!customText) document.body.insertAdjacentHTML("beforeend", SVG_REPLY);

    const runner = () => modifyQuoteButtons(customText);

    // MefiQuote listens for the "mefi-comments" event, but:
    //    (a) my event listener wasn't picking that up, for some reason; and
    //    (b) there could be timing issues as MefiQuote needs to complete its work first
    // hence using MutationObserver instead.
    const newCommentsElement = document.getElementById("newcomments");
    if (newCommentsElement) {
        const observer = new MutationObserver(runner);
        observer.observe(newCommentsElement, { childList: true });
    }

    runner();
})();
