// ==UserScript==
// @name         MeFi replace quote label
// @namespace    https://github.com/klipspringr/mefi-scripts
// @version      2025-03-28-c
// @description  Replace the label on the quote button
// @author       Klipspringer
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

(async () => {
  if (!/^\/(\d|comments\.mefi)/.test(window.location.pathname)) return;

  const to = getSetting("mefi-replace-quote-label", "↩ ");
  document
    .querySelectorAll('a[class="quotebutton"]')
    .forEach((node) => (node.textContent = to));
})();
