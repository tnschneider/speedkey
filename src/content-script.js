const SPEEDKEY_OVERLAY_ELEMENT_ID = "speedkey-launcher-overlay";
const SPEEDKEY_INPUT_ELEMENT_ID = "speedkey-launcher-input";

function appendSearchBox() {
    // create overlay
    var launcherOverlay = document.createElement("div");
    launcherOverlay.className = SPEEDKEY_OVERLAY_ELEMENT_ID;
    launcherOverlay.id = SPEEDKEY_OVERLAY_ELEMENT_ID;
    launcherOverlay.style.display = 'none';

    // create input
    var launcherInput = document.createElement("input");
    launcherInput.className = SPEEDKEY_INPUT_ELEMENT_ID;
    launcherInput.id = SPEEDKEY_INPUT_ELEMENT_ID;

    // register input key handler
    launcherInput.addEventListener("keyup", (e) => {
        switch (e.key) {
            case SPEEDKEY.KEYS.ESC:
                hideSearchBox();
                break;
            case SPEEDKEY.KEYS.ENTER:
                browser.runtime.sendMessage({
                    action: SPEEDKEY.ACTIONS.SELECT,
                    payload: document.getElementById('speedkey-launcher-input').value
                });
                hideSearchBox();
                break;
        }
        
    });
    
    // append to document
    launcherOverlay.appendChild(launcherInput);
    document.body.appendChild(launcherOverlay);
}

function showSearchBox() {
    getOverlayElement().style.display = 'flex';
}

function hideSearchBox() {
    getOverlayElement().style.display = 'none';
}

function getOverlayElement() {
    return document.getElementById(SPEEDKEY_OVERLAY_ELEMENT_ID)
}

function getInputElement() {
    return document.getElementById(SPEEDKEY_INPUT_ELEMENT_ID)
}

function handleMessage(request) {
    switch (request.action) {
        case SPEEDKEY.ACTIONS.OPEN:
            showSearchBox();
            break;
    }
}

browser.runtime.onMessage.addListener(handleMessage);

appendSearchBox();