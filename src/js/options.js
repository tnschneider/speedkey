function saveOptions(e) {
    e.preventDefault();
    browser.storage.local.set({
        includeBookmarks: document.querySelector("#include-bookmarks").checked,
        includeTopSites: document.querySelector("#include-top-sites").checked,
        switchToExistingTab: document.querySelector("#switch-to-existing-tab").checked,
        foldersToExclude: (document.querySelector("#folders-to-exclude").value || '')
            .split('\n')
            .map(x => x.trim())
            .filter(x => x.length > 0)
    });
}

function restoreOptions() {
    browser.storage.local.get().then((x) => {
        let settings = new SpeedkeySettings(x);
        document.querySelector("#include-bookmarks").checked = settings.includeBookmarks;
        document.querySelector("#include-top-sites").checked = settings.includeTopSites;
        document.querySelector("#switch-to-existing-tab").checked = settings.switchToExistingTab;
        document.querySelector("#folders-to-exclude").value = settings.foldersToExclude.join('\n');
    }, (err) => {
        console.error(err);
    });

    document.querySelector('#container').style.display = 'block'
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);