// ==UserScript==
// @name         MeFi replace quote label
// @namespace    https://github.com/klipspringr/mefi-userscripts
// @version      2025-03-28-h
// @description  MetaFilter: replace the MefiQuote label with an arrow, or a custom label
// @author       Klipspringer
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

(() => {
  if (!/^\/(\d|comments\.mefi)/.test(window.location.pathname)) return;

  const to = getSetting("mefi-replace-quote-label", "↩ "); // note space, for aesthetics

  const replaceQuoteLabels = () => {
    const nodes = document.querySelectorAll('a[class="quotebutton"]');
    nodes.forEach((node) => (node.textContent = to));
    console.log(`mefi-replace-quote-label: ${nodes.length} labels to "${to}"`);
  };

  const newCommentsWrapper = document.getElementById("newcomments");
  if (newCommentsWrapper) {
    // MefiQuote listens for the "mefi-comments" event, but:
    //    (a) my event listener wasn't picking that up, for some reason; and
    //    (b) there would be timing issues as MefiQuote needs to complete its work first
    // hence using MutationObserver instead
    const observer = new MutationObserver(() => replaceQuoteLabels());
    // listen for "childList" mutations, but not subtree as *we* are mutating that
    observer.observe(newCommentsWrapper, { childList: true });
  }

  replaceQuoteLabels();
})();
