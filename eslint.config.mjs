import js from "@eslint/js";
import globals from "globals";
import userscripts from "eslint-plugin-userscripts";

export default [
    {
        files: ["**/*.js", "**/*.user.js"],
        plugins: {
            userscripts: {
                rules: userscripts.rules,
            },
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,

                // Tampermonkey/Greasemonkey APIs
                GM_setValue: "readonly",
                GM_getValue: "readonly",
                GM_deleteValue: "readonly",
                GM_listValues: "readonly",
                GM_addStyle: "readonly",
                GM_getResourceText: "readonly",
                GM_getResourceURL: "readonly",
                GM_registerMenuCommand: "readonly",
                GM_unregisterMenuCommand: "readonly",
                GM_openInTab: "readonly",
                GM_xmlhttpRequest: "readonly",
                GM_download: "readonly",
                GM_getTab: "readonly",
                GM_saveTab: "readonly",
                GM_getTabs: "readonly",
                GM_notification: "readonly",
                GM_setClipboard: "readonly",
                GM_info: "readonly",
                unsafeWindow: "readonly",
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...userscripts.configs.recommended.rules,
            "no-unused-vars": "warn",
            "no-console": "off",
            "no-undef": "error",
        },
        settings: {
            userscriptVersions: {
                violentmonkey: "*",
            },
        },
    },
];
