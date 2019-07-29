function saveOptions(e) {
    e.preventDefault();
    SpeedkeySettings.SetSettings({
        includeBookmarks: document.querySelector("#include-bookmarks").checked,
        includeTopSites: document.querySelector("#include-top-sites").checked,
        includeOpenTabs: document.querySelector("#include-open-tabs").checked,
        switchToExistingTab: document.querySelector("#switch-to-existing-tab").checked,
        darkTheme: document.querySelector("#dark-theme").checked,
        foldersToExclude: (document.querySelector("#folders-to-exclude").value || '')
            .split('\n')
            .map(x => x.trim())
            .filter(x => x.length > 0)
    });
}

async function restoreOptions() {
    let settings = await SpeedkeySettings.GetSettings();

    document.querySelector("#include-bookmarks").checked = settings.includeBookmarks;
    document.querySelector("#include-top-sites").checked = settings.includeTopSites;
    document.querySelector("#include-open-tabs").checked = settings.includeOpenTabs;
    document.querySelector("#switch-to-existing-tab").checked = settings.switchToExistingTab;
    document.querySelector("#dark-theme").checked = settings.darkTheme;
    document.querySelector("#folders-to-exclude").value = settings.foldersToExclude.join('\n');
    
    document.querySelector('#container').style.display = 'block'
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);