// ==UserScript==
// @name         MeFi replace quote label
// @namespace    https://github.com/klipspringr/mefi-scripts
// @version      2025-03-28
// @description  Replace the label on the quote button
// @author       Klipspringer
// @match        *://*.metafilter.com/*
// @grant        GM.getValue
// // ==/UserScript==

(async () => {
  if (!/^\/(\d|comments\.mefi)/.test(window.location.pathname)) return;

  const to = (await GM.getValue()) || "↩ ";
  document
    .querySelectorAll('a[class="quotebutton"]')
    .forEach((node) => (node.textContent = to));
})();
