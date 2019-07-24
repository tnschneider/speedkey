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
        case SPEEDKEY.ACTIONS.SELECT:
            browser.tabs.create({
                url: request.payload
            });
            break;
    }
}

function sendMessageToActiveTab(message) {
    return getActiveTab().then(x => {
        let tabId = x[0].id;
        browser.tabs.sendMessage(tabId, message);
    });
}

function getActiveTab() {
    return browser.tabs.query({
        currentWindow: true,
        active: true
    });
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);