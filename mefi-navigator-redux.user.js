// ==UserScript==
// @name         MeFi Navigator Redux
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-03-30-a
// @description  MetaFilter: navigate through users' comments, and highlight comments by OP and yourself
// @author       Klipspringer
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-navigator-redux.user.js
// @updateURL    https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-navigator-redux.user.js
// ==/UserScript==

const SELF_HTML =
    '<span style="padding:0 4px;margin-left:4px;background-color:#C8E0A1;color:#000;font-size:0.8em;border-radius:2px;">me</span>';

const getCookie = (key) => {
    const s = RegExp(key + "=([^;]+)").exec(document.cookie);
    if (!s || !s[1]) return null;
    return decodeURIComponent(s[1]);
};

const createLink = (href, content) => {
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = content;
    return a;
};

const markSelf = (targetNode) =>
    targetNode.insertAdjacentHTML("afterend", SELF_HTML);

const markOP = (targetNode) => {
    const wrapper = targetNode.parentNode.parentNode;
    wrapper.style["border-left"] = "5px solid #0004"; // 40% black
    wrapper.style["padding-left"] = "10px";
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
    if (firstRun || !bylineNode.hasAttribute("data-mfnr-byline")) {
        if (self !== null && user === self) markSelf(bylineNode);
        if (op !== null && user === op) markOP(bylineNode);
        bylineNode.setAttribute("data-mfnr-byline", "");
    }

    if (anchors.length <= 1) return;

    const i = anchors.indexOf(anchor);
    const previous = anchors[i - 1];
    const next = anchors[i + 1];

    // if not first run, check for existing nav and remove it if exists
    if (!firstRun)
        bylineNode.parentNode.querySelector("span[data-mfnr-nav]")?.remove();

    const navigator = document.createElement("span");
    navigator.setAttribute("data-mfnr-nav", "");

    const navigatorNodes = [" ["];
    if (previous) navigatorNodes.push(createLink("#" + previous, "⮝"));
    navigatorNodes.push(anchors.length);
    if (next) navigatorNodes.push(createLink("#" + next, "⮟"));
    navigatorNodes.push("]");

    navigator.append(...navigatorNodes);
    bylineNode.parentNode.append(navigator);
};

const run = (firstRun = false) => {
    const start = performance.now();

    const subsite = window.location.hostname.split(".")[0];
    const self = getCookie("USER_NAME");

    // post node: first smallcopy in div.copy (works on all subsites, 2025-03-29)
    const postNode = document.querySelector(
        "div.copy > span.smallcopy > a:first-child"
    );
    const op = postNode.textContent;

    // initialise with post
    const bylines = [[op, "top"]];
    const mapUsersAnchors = new Map([[op, ["top"]]]);

    // comment nodes: smallcopy children of div.comments (works on all subsites, 2025-03-29)
    const commentNodes = document.querySelectorAll(
        "div.comments > span.smallcopy > a:first-child"
    );

    for (const node of commentNodes) {
        const user = node.textContent;

        const anchorElement =
            node.parentElement.parentElement.previousElementSibling;
        const anchor = anchorElement.getAttribute("name");

        bylines.push([user, anchor]);

        const anchors = mapUsersAnchors.get(user) ?? [];
        mapUsersAnchors.set(user, anchors.concat(anchor));
    }

    for (const [i, bylineNode] of [postNode, ...commentNodes].entries()) {
        processByline(
            bylineNode,
            bylines[i][0],
            bylines[i][1],
            mapUsersAnchors.get(bylines[i][0]),
            firstRun,
            self,
            subsite !== "ask" && i > 0 ? op : null // don't highlight OP on AskMe, as site already does
        );
    }

    console.log(
        "mefi-navigator-redux",
        firstRun ? "first-run" : "new-comments",
        1 + commentNodes.length,
        performance.now() - start
    );
};

(() => {
    if (!/^\/(\d|comments\.mefi)/.test(window.location.pathname)) return;

    const newCommentsElement = document.getElementById("newcomments");
    if (newCommentsElement) {
        const observer = new MutationObserver(() => run(false));
        observer.observe(newCommentsElement, { childList: true });
    }

    run(true);
})();
