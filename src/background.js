var allResults = [
    { display: "wikipedia", value: "https://en.wikipedia.org" },
    { display: "google", value: "https://www.google.com" },
    { display: "reddit", value: "https://www.reddit.com" },
    { display: "youtube", value: "https://www.youtube.com" }
];

var fuse = new Fuse(allResults, {
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        "display",
        "value"
    ]
});

function filter(searchValue) {
    var results = fuse.search(searchValue).slice(0, 10);

    results.push({ display: "Search", value: "search" });

    return results;
}

function handleCommand(command) {
    switch (command) {
        case SPEEDKEY.COMMANDS.OPEN_LAUNCHER:
            sendMessageToActiveTab({
                action: SPEEDKEY.ACTIONS.OPEN
            });
            break;
    }
}

function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
        case SPEEDKEY.ACTIONS.FILTER:
            sendResponse({
                results: filter(request.payload)
            });
            break;
        case SPEEDKEY.ACTIONS.NAVIGATE:
            browser.tabs.create({
                url: request.payload
            });
            break;
        case SPEEDKEY.ACTIONS.SEARCH:
            browser.search.search({
                query: request.payload
            });
            break;
    }
}

function sendMessageToActiveTab(message) {
    return browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(x => {
        let tabId = x[0].id;
        console.log(tabId);
        browser.tabs.sendMessage(tabId, message);
    });
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);