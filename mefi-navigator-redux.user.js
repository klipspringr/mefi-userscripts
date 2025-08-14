// ==UserScript==
// @name         MeFi Navigator Redux
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-08-14-a
// @description  MetaFilter: navigate through users' comments, and highlight comments by OP and yourself
// @author       Klipspringer
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-navigator-redux.user.js
// @updateURL    https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-navigator-redux.user.js
// ==/UserScript==

(() => {
    "use strict";

    if (
        !/^\/(\d|comments\.mefi)/.test(window.location.pathname) ||
        /rss$/.test(window.location.pathname)
    ) {
        return;
    }

    const SVG_UP = `<svg xmlns="http://www.w3.org/2000/svg" hidden style="display:none"><path id="mfnr-up" fill="currentColor" d="M 0 93.339 L 50 6.661 L 100 93.339 L 50 64.399 L 0 93.339 Z" /></svg>`;
    const SVG_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" hidden style="display:none"><path id="mfnr-down" fill="currentColor" d="M 100 6.69 L 50 93.31 L 0 6.69 L 50 35.607 L 100 6.69 Z" /></svg>`;

    // CSS notes:
    // - mfnr-op needs to play nicely with .mod in threads where OP is a mod
    // - classic theme has different margins from modern, so we can't change margin-left without knowing what theme we're on
    // - relative positioning seems to work better
    const CLASSES = `<style>
        .mfnr-op {
            border-left: 5px solid #0004 !important;
            padding-left: 10px !important;
            position: relative !important;
            left: -15px !important;
        }
        @media (max-width: 550px) {
            .mfnr-op {
                left: -5px !important;
            }
        }
        .mfnr-self-badge {
            background-color: #C8E0A1;
            border-radius: 2px;
            color: #000;
            font-size: 0.8em;
            margin-left: 4px;
            padding: 0 4px;
            cursor: default;
        }
        .mfnr-nav {
            white-space: nowrap;
        }
        .mfnr-nav svg {
            vertical-align: middle;
            top: -1px;
        }
        </style>`;

    const ATTR_BYLINE = "data-mfnr-byline";

    const getCookie = (key) => {
        const s = RegExp(key + "=([^;]+)").exec(document.cookie);
        if (!s || !s[1]) return null;
        return decodeURIComponent(s[1]);
    };

    const markSelf = (targetNode) => {
        const span = document.createElement("span");
        span.classList.add("mfnr-self-badge");
        span.textContent = "me";
        targetNode.after(span);
    };

    const markOP = (targetNode) =>
        targetNode.parentElement.parentElement.classList.add("mfnr-op");

    const createLink = (href, svgHref) => {
        const a = document.createElement("a");
        a.setAttribute("href", "#" + href);
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        svg.setAttribute("width", "1em");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("class", "mfnr-nav");
        const use = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "use"
        );
        use.setAttribute("href", "#" + svgHref);
        svg.appendChild(use);
        a.appendChild(svg);
        return a;
    };

    const processByline = (
        bylineNode,
        user,
        anchor,
        anchors,
        firstRun,
        self = null,
        op = null
    ) => {
        // don't mark self or OP more than once
        if (firstRun || !bylineNode.hasAttribute(ATTR_BYLINE)) {
            if (self !== null && user === self) markSelf(bylineNode);
            if (op !== null && user === op) markOP(bylineNode);
            bylineNode.setAttribute(ATTR_BYLINE, "");
        }

        if (anchors.length <= 1) return;

        const i = anchors.indexOf(anchor);
        const previous = anchors[i - 1];
        const next = anchors[i + 1];

        const navigator = document.createElement("span");
        navigator.setAttribute("class", "mfnr-nav");

        const nodes = ["["];
        if (previous) nodes.push(createLink(previous, "mfnr-up"));
        nodes.push(anchors.length);
        if (next) nodes.push(createLink(next, "mfnr-down"));
        nodes.push("]");

        navigator.append(...nodes);
        bylineNode.parentElement.appendChild(navigator);
    };

    const run = (subsite, self, firstRun) => {
        const start = performance.now();

        const opHighlight = subsite !== "ask" && subsite !== "projects"; // don't highlight OP on subsites with this built in

        // if not first run, remove any existing navigators (from both post and comments)
        if (!firstRun)
            document
                .querySelectorAll("span.mfnr-nav")
                .forEach((n) => n.remove());

        // post node
        // tested on all subsites, modern and classic, 2025-04-10
        const postNode = document.querySelector(
            "div.copy > span.smallcopy > a:first-child"
        );
        const op = postNode.textContent.trim();

        // initialise with post
        const bylines = [[op, "top"]];
        const mapUsersAnchors = new Map([[op, ["top"]]]);

        // comment nodes, excluding live preview
        // tested on all subsites, modern and classic, 2025-04-10
        const commentNodes = document.querySelectorAll(
            "div.comments:not(#commentform *) > span.smallcopy > a:first-child"
        );

        for (const node of commentNodes) {
            const user = node.textContent.trim();

            const anchorElement =
                node.parentElement.parentElement.previousElementSibling;
            const anchor = anchorElement.getAttribute("name");

            bylines.push([user, anchor]);

            const anchors = mapUsersAnchors.get(user) ?? [];
            mapUsersAnchors.set(user, anchors.concat(anchor));
        }

        for (const [i, bylineNode] of [postNode, ...commentNodes].entries())
            processByline(
                bylineNode,
                bylines[i][0],
                bylines[i][1],
                mapUsersAnchors.get(bylines[i][0]),
                firstRun,
                self,
                opHighlight && i > 0 ? op : null
            );

        console.log(
            "mefi-navigator-redux",
            firstRun ? "first-run" : "new-comments",
            1 + commentNodes.length,
            Math.round(performance.now() - start) + "ms"
        );
    };

    document.body.insertAdjacentHTML("beforeend", SVG_UP + SVG_DOWN);
    document.body.insertAdjacentHTML("beforeend", CLASSES);

    const subsite = window.location.hostname.split(".", 1)[0];
    const self = getCookie("USER_NAME");

    const newCommentsElement = document.getElementById("newcomments");
    if (newCommentsElement) {
        const observer = new MutationObserver(() => run(subsite, self, false));
        observer.observe(newCommentsElement, { childList: true });
    }

    run(subsite, self, true);
})();
