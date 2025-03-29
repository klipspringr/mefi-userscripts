// ==UserScript==
// @name         MeFi replace quote label
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-03-28-h
// @description  MetaFilter: nicer MefiQuote buttons
// @author       Klipspringe
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @grant        none
// ==/UserScript==

const getSetting = (key, defaultValue) => {
    try {
        return localStorage.getItem(key) || defaultValue;
    } catch {
        return defaultValue;
    }
};

const modifyQuoteButton = (quoteButtonNode, to) => {
    // replace quote button content
    quoteButtonNode.textContent = to;

    // move quote button to before flag button
    const quoteNode = quoteButtonNode.parentNode;
    const bylineNode = quoteNode.parentNode;
    const flagNode = bylineNode.querySelector("span[id^='flag']");
    if (flagNode) bylineNode.insertBefore(quoteNode, flagNode);

    // mark as done so we don't pick this up again
    quoteButtonNode.setAttribute("data-mrql-done", "");
};

const modifyQuoteButtons = (to) => {
    const start = performance.now();

    const quoteButtonNodes = document.querySelectorAll(
        'a[class="quotebutton"]:not([data-mrql-done])'
    );

    for (const quoteButtonNode of quoteButtonNodes)
        modifyQuoteButton(quoteButtonNode, to);

    console.debug(
        "mefi-replace-quote-label",
        quoteButtonNodes.length,
        `"${to}"`,
        performance.now() - start + "ms"
    );
};

(() => {
    if (!/^\/(\d|comments\.mefi)/.test(window.location.pathname)) return;

    const DEFAULT_TO = "↩ "; // note space, for aesthetics

    const to = getSetting("mefi-replace-quote-label", DEFAULT_TO);

    const runner = () => modifyQuoteButtons(to);

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
