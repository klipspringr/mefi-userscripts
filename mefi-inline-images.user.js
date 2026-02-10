// ==UserScript==
// @name         MeFi Inline Images
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2026-02-10-b
// @description  MetaFilter: restore the glory days of the IMG tag by inlining images linked in comments
// @author       Klipspringer
// @supportURL   https://github.com/klipspringr/mefi-userscripts
// @license      MIT
// @match        *://*.metafilter.com/*
// @downloadURL  https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-inline-images.user.js
// @updateURL    https://raw.githubusercontent.com/klipspringr/mefi-userscripts/main/mefi-inline-images.user.js
// ==/UserScript==

;(async () => {
    ;("use strict")

    const IMG_CLASS = "mfit"
    const ATTRIBUTE_DONE = "data-mfit"

    const REGEX_IMAGE_PATHS = /\.(apng|avif|bmp|gif|jpeg|jpg|png|svg|webp)$/i
    const REGEX_IMGUR_PATH = /^\/\w+\/?$/

    if (
        !/^\/(\d|comments\.mefi)/.test(window.location.pathname) ||
        /rss$/.test(window.location.pathname)
    ) {
        return
    }

    // if failed to load, remove element (avoids broken image icon)
    const onImageError = (e) => e.target?.remove()

    const run = async (target) => {
        const start = performance.now()

        let inserted = 0

        const nodes = (target ?? document).querySelectorAll(
            `div.comments a:not(.smallcopy *):not([${ATTRIBUTE_DONE}])`,
        )

        for (const node of nodes) {
            const href = node.getAttribute("href")
            if (!href) {
                continue
            }

            let url
            try {
                url = new URL(href)
            } catch {
                continue
            }

            let imageHref

            if (REGEX_IMAGE_PATHS.test(url.pathname)) {
                imageHref = href
            } else if (
                url.hostname.endsWith("imgur.com") &&
                REGEX_IMGUR_PATH.test(url.pathname)
            ) {
                // special case: https://imgur.com/cvxGSlG can be treated as https://i.imgur.com/cvxGSlG.png
                // using the i subdomain saves a 302 redirect, and .png extension works for all MIME types
                imageHref = `https://i.imgur.com${url.pathname}.png`
            } else {
                continue
            }

            // don't inject images twice - e.g. when new comments loaded a second time
            node.setAttribute(ATTRIBUTE_DONE, "done")

            const img = document.createElement("img")
            img.setAttribute("src", imageHref)
            img.setAttribute("class", IMG_CLASS)
            img.addEventListener("error", onImageError)

            // we're setting display:block on the img. so a following <br> causes an empty line
            if (node.nextElementSibling?.tagName === "BR") {
                node.nextElementSibling.remove()
            }

            node.insertAdjacentElement("afterend", img)

            inserted += 1
        }

        console.log(
            "mefi-inline-images",
            nodes.length,
            inserted,
            Math.round(performance.now() - start) + "ms",
        )
    }

    const styleElement = document.createElement("style")

    styleElement.textContent = `img.${IMG_CLASS} {
        display: block;
        max-width: 100%;
        max-height: 50vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border: 1px solid rgba(0, 0, 0, 0.2);
    }`

    document.body.insertAdjacentElement("beforeend", styleElement)

    const newCommentsElement = document.getElementById("newcomments")

    if (newCommentsElement) {
        const observer = new MutationObserver(() => run(newCommentsElement))
        observer.observe(newCommentsElement, { childList: true })
    }

    run()
})()
