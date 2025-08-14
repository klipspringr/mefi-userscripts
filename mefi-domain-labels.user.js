// ==UserScript==
// @name         MeFi Domain Labels
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-08-14-c
// @description  MetaFilter: label domains in post links. No mystery meat here!
// @author       Klipspringer
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-domain-labels.user.js
// @updateURL    https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-domain-labels.user.js
// ==/UserScript==

(async () => {
    "use strict";

    if (
        !/^\/($|\d|comments\.mefi)/.test(window.location.pathname) ||
        /rss$/.test(window.location.pathname)
    )
        return;

    const KEY_DOMAINS_HIGHLIGHT = "domains-highlight";

    const LABEL_CLASS = "mfdl-label";
    const HIGHLIGHT_CLASS = "mfdl-highlight";

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
        a > span.${LABEL_CLASS}.${HIGHLIGHT_CLASS} {
            background-color: rgba(255, 0, 0, 0.4);
            color:rgba(255, 255, 255, 1);
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

    const getHighlightDomains = async () => {
        const value = await GM_getValue(KEY_DOMAINS_HIGHLIGHT, "");
        return new Set(value.split(",").map((d) => d.trim().toLowerCase()));
    };

    const handleEditHighlightDomains = async () => {
        const existing = await GM_getValue(KEY_DOMAINS_HIGHLIGHT, "");
        const edited = prompt(
            "Domains to highlight in red (comma-separated list):",
            existing || ""
        );
        await GM_setValue(KEY_DOMAINS_HIGHLIGHT, edited || "");
        addLabels();
    };

    const addLabels = async () => {
        // remove existing elements
        document
            .querySelectorAll(`a > span.${LABEL_CLASS}`)
            .forEach((e) => e.remove());

        const highlightDomains = await getHighlightDomains();

        document
            .querySelectorAll("div.copy a:not(span.smallcopy *)")
            .forEach((a) => {
                const domain = getDomain(a.getAttribute("href"));
                if (!domain) return;

                const tag = document.createElement("span");

                const classes = [LABEL_CLASS];
                if (highlightDomains.has(domain)) classes.push(HIGHLIGHT_CLASS);

                tag.setAttribute("class", classes.join(" "));

                tag.textContent =
                    domain === "metafilter.com" ? INTERNAL_LABEL_TEXT : domain;

                a.insertAdjacentElement("beforeend", tag);
            });
    };

    GM_registerMenuCommand(
        "Edit highlighted domains",
        handleEditHighlightDomains
    );

    const styleElement = document.createElement("style");
    styleElement.textContent = LABEL_CSS;
    document.body.insertAdjacentElement("beforeend", styleElement);

    const start = performance.now();
    addLabels();
    console.log(
        "mefi-domain-labels",
        Math.round(performance.now() - start) + "ms"
    );
})();
