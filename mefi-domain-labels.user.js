// ==UserScript==
// @name         MeFi Domain Labels
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2026-04-11-a
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

"use strict"

const HOSTNAME_EXCLUDE = /^(?:bestof|chat|faq|labs|stuff)\./

const PATHNAME_INCLUDE =
    /^\/(?:$|\d+\/|activity\/\d+\/?$|activity\/\d+\/posts\/$|archived.mefi|comments\.mefi|home\/|index\.cfm|popular\.mefi|tags\/)/

const PATHNAME_EXCLUDE = /rss$/

const KEY_DOMAINS_HIGHLIGHT = "domains-highlight"

const LABEL_CLASS = "mfdl-label"
const HIGHLIGHT_CLASS = "mfdl-highlight"

const LABEL_CSS = `
    a > span.${LABEL_CLASS} {
        background-color: rgba(0, 0, 0, 0.15);
        border-radius: 5px;
        color:rgba(255, 255, 255, 0.8);
        font-size: 80%;
        font-style: normal;
        font-weight: normal;
        margin-left: 4px;
        padding: 1px 4px 2px 4px;
        transition: color 100ms;
        user-select: none;
        white-space: nowrap;
    }
    a > span.${LABEL_CLASS}.${HIGHLIGHT_CLASS} {
        background-color: rgba(255, 0, 0, 0.4);
        color:rgb(255, 255, 255);
    }
    a:hover > span.${LABEL_CLASS} {
        color: rgb(255, 255, 255);
    }`

const SECOND_LEVEL_TLDS = ["co", "com", "net", "org", "gov", "edu", "ac", "mil"]

// given an <a> element, return an object with the label and whether it needs highlighting, or null if it can't be parsed
const processLinkElement = (linkElement, highlightDomains) => {
    const href = linkElement.getAttribute("href")

    if (!href) {
        return null
    }

    try {
        // the URL parser returns a normalised lowercase hostname
        const hostname = new URL(href).hostname

        const parts = hostname.split(".")

        // highlight: exact hostname match, or subdomain
        let highlight = false

        for (const d of highlightDomains) {
            if (hostname === d || hostname.endsWith("." + d)) {
                highlight = true
                break
            }
        }

        // label is:
        // - on metafilter.com: hardcoded strings for known subdomains, else "MeFi"
        // - for multi-level TLDs like .co.uk: the last three parts of the hostname
        // - for normal domains: the last two parts of the hostname
        let label

        if (parts.at(-2) === "metafilter" && parts.at(-1) === "com") {
            const sub = parts.at(-3)
            if (sub === "ask") {
                label = "Ask"
            } else if (sub === "fanfare") {
                label = "FanFare"
            } else if (sub === "projects") {
                label = "Projects"
            } else if (sub === "music") {
                label = "Music"
            } else if (sub === "jobs") {
                label = "Jobs"
            } else if (sub === "irl") {
                label = "IRL"
            } else if (sub === "metatalk") {
                label = "MeTa"
            } else {
                label = "MeFi"
            }
        } else {
            let partsToInclude = 2

            if (parts.length >= 3 && SECOND_LEVEL_TLDS.includes(parts.at(-2))) {
                partsToInclude = 3
            }

            label = parts.slice(-partsToInclude).join(".")
        }

        return { label, highlight }
    } catch (e) {
        // URL() throws on invalid URLs
        console.warn(`Error on parsing "${href}"`, e)
        return null
    }
}

const getHighlightDomains = async () => {
    const value = await GM_getValue(KEY_DOMAINS_HIGHLIGHT, "")

    if (typeof value !== "string") {
        return []
    }

    return value.split(",").map((d) => d.trim().toLowerCase())
}

const handleEditHighlightDomains = async () => {
    const existing = await GM_getValue(KEY_DOMAINS_HIGHLIGHT, "")

    const edited = prompt(
        "Domains to highlight in red (comma-separated list):",
        String(existing),
    )

    await GM_setValue(KEY_DOMAINS_HIGHLIGHT, edited || "")

    addDomainLabels()
}

const addDomainLabels = async () => {
    const start = performance.now()

    const highlightDomains = await getHighlightDomains()

    // remove any existing labels
    const existingLabels = document.querySelectorAll(`a > span.${LABEL_CLASS}`)

    for (const element of existingLabels) {
        element.remove()
    }

    const linkElements = document.querySelectorAll(
        "#posts div.copy:not(.recently) a:not(.smallcopy *), " +
            "#popposts div.copy:not(#morepostsmsg) a:not(.smallcopy *)",
    )

    for (const linkElement of linkElements) {
        const link = processLinkElement(linkElement, highlightDomains)

        if (link === null) {
            return
        }

        const labelElement = document.createElement("span")
        labelElement.classList.add(LABEL_CLASS)
        if (link.highlight) {
            labelElement.classList.add(HIGHLIGHT_CLASS)
        }
        labelElement.textContent = link.label

        linkElement.insertAdjacentElement("beforeend", labelElement)

        // remove any stray period after the domain label
        const nextSibling = linkElement.nextSibling
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
            const text = nextSibling.textContent
            if (/^\s*\./.test(text)) {
                nextSibling.textContent = text.replace(/^\s*\./, "")
            }
        }
    }

    console.log(
        "mefi-domain-labels",
        linkElements.length,
        Math.round(performance.now() - start) + "ms",
    )
}

;(() => {
    if (
        HOSTNAME_EXCLUDE.test(window.location.hostname) ||
        !PATHNAME_INCLUDE.test(window.location.pathname) ||
        PATHNAME_EXCLUDE.test(window.location.pathname)
    ) {
        return
    }

    GM_registerMenuCommand(
        "Edit highlighted domains",
        handleEditHighlightDomains,
    )

    const styleElement = document.createElement("style")
    styleElement.textContent = LABEL_CSS
    document.body.insertAdjacentElement("beforeend", styleElement)

    addDomainLabels()
})()
