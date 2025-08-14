// ==UserScript==
// @name         MeFi Domain Labels
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-08-14-b
// @description  MetaFilter: label domains in post links. No mystery meat here!
// @author       Klipspringer
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-domain-labels.user.js
// @updateURL    https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-domain-labels.user.js
// ==/UserScript==

(() => {
    "use strict";

    if (
        !/^\/($|\d|comments\.mefi)/.test(window.location.pathname) ||
        /rss$/.test(window.location.pathname)
    )
        return;

    const LABEL_CLASS = "mfdl-label";

    const LABEL_CSS = `
        a > span.${LABEL_CLASS} { 
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
            color:rgba(255, 255, 255, 0.8);
            font-size: 80%;
            font-weight: normal;
            margin-left: 4px;
            padding: 0.1em 0.3em;
            user-select: none;
            white-space: nowrap;
        }
        a:hover > span.${LABEL_CLASS} {
            color: rgba(255, 255, 255, 1);
        }`;

    const INTERNAL_LABEL_TEXT = "MeFi";

    const COMPLEX_TLDS = /\.(co|com|net|org|gov|edu|ac|mil)\.[a-z]{2}$/i;

    const getDomain = (href) => {
        if (!href) return;

        let hostname;
        try {
            hostname = new URL(href).hostname;
        } catch {
            return;
        }

        // Common patterns for multi-level TLDs like .co.uk, .com.au, etc.
        const parts = hostname.split(".");

        if (COMPLEX_TLDS.test(hostname)) {
            return parts.slice(-3).join(".");
        } else {
            return parts.slice(-2).join(".");
        }
    };

    const styleElement = document.createElement("style");
    styleElement.textContent = LABEL_CSS;
    document.body.insertAdjacentElement("beforeend", styleElement);

    document
        .querySelectorAll("div.copy a:not(span.smallcopy *)")
        .forEach((a) => {
            const domain = getDomain(a.getAttribute("href"));
            if (!domain) return;

            const tag = document.createElement("span");
            tag.setAttribute("class", LABEL_CLASS);
            tag.textContent =
                domain === "metafilter.com" ? INTERNAL_LABEL_TEXT : domain;

            a.insertAdjacentElement("beforeend", tag);
        });
})();
