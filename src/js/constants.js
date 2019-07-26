const SPEEDKEY = {
    ACTIONS: {
        TOGGLE: "toggle",
        FILTER: "filter",
        NAVIGATE: "navigate"
    },
    COMMANDS: {
        TOGGLE_LAUNCHER: "toggle-launcher"
    },
    REGEXES: {
        URL: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
        SCHEMA: /^http(s)?:\/\//,
        FULL_DOMAIN: /^http(s)?:\/\/.*(\/|\?)/
    },
    RESULT_TYPES: {
        GOTO: "goto",
        SEARCH: "search",
        BOOKMARK: "bookmark",
        TOP_SITE: "top-site",
        OPEN_TAB: "open-tab"
    }
}