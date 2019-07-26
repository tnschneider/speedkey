class SpeedkeySettings {
    constructor(settings) {
        this.includeBookmarks = this.boolOrDefault(settings.includeBookmarks, true);
        this.includeTopSites = this.boolOrDefault(settings.includeTopSites, true);
        this.includeOpenTabs = this.boolOrDefault(settings.includeOpenTabs, true);
        this.switchToExistingTab = this.boolOrDefault(settings.switchToExistingTab, true);
        this.darkTheme = this.boolOrDefault(settings.darkTheme, true);
        this.darkOverlay = this.boolOrDefault(settings.darkOverlay, false);
        this.foldersToExclude = settings.foldersToExclude || [];
    }

    boolOrDefault(val, def) {
        if (!val && val !== false) {
            return def;
        }
        return val;
    }

    static async GetSettings() {
        return new SpeedkeySettings(await browser.storage.local.get());
    }

    static SetSettings(settings) {
        return browser.storage.local.set(new SpeedkeySettings(settings));
    }
}