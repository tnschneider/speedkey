const SPEEDKEY = {
    ACTIONS: {
        OPEN: "open",
        FILTER: "filter",
        NAVIGATE: "navigate",
        SEARCH: "search"
    },
    COMMANDS: {
        OPEN_LAUNCHER: "open-launcher"
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
        TOP_SITE: "top-site"
    }
}