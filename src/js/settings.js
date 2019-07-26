class SpeedkeySettings {
    constructor(settings) {
        this.includeBookmarks = this.boolOrDefault(settings.includeBookmarks, true);
        this.includeTopSites = this.boolOrDefault(settings.includeTopSites, true);
        this.switchToExistingTab = this.boolOrDefault(settings.switchToExistingTab, true);
        this.foldersToExclude = settings.foldersToExclude || [];
    }

    boolOrDefault(val, def) {
        if (!val && val !== false) {
            return def;
        }
        return val;
    }
}