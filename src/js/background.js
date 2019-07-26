class SpeedkeyBackground {
    constructor() {
        this.settings = {};
        this.fuse = null;
        this.bookmarkResults = [];
        this.topSitesResults = [];
        this.openTabsResults = [];
    }

    async load(reloadSettings, reloadBookmarks, reloadTopSites, reloadOpenTabs) {
        if (reloadSettings) {
            this.settings = await SpeedkeySettings.GetSettings();
        }

        if (reloadBookmarks && this.settings.includeBookmarks) {
            let bookmarks = await browser.bookmarks.getTree();
            this.bookmarkResults = bookmarks.length > 0
                ? this.flattenBookmarks([], bookmarks[0], '', (this.settings.foldersToExclude || []).filter(x => x.length > 0))
                : [];
        } else if (!this.settings.includeBookmarks) {
            this.bookmarkResults = [];
        }

        if (reloadTopSites && this.settings.includeTopSites) {
            this.topSitesResults = (await browser.topSites.get())
                .map(x => ({
                    display: x.title || x.url,
                    value: x.url,
                    resultType: SPEEDKEY.RESULT_TYPES.TOP_SITE
                }));
        } else if (!this.settings.includeTopSites) {
            this.topSitesResults = [];
        }

        if (reloadOpenTabs && this.settings.includeOpenTabs) {
            this.openTabsResults = (await browser.tabs.query({}))
                .map(x => ({
                    display: x.title || x.url,
                    value: {
                        id: x.id,
                        windowId: x.windowId
                    },
                    resultType: SPEEDKEY.RESULT_TYPES.OPEN_TAB
                }));
        } else if (!this.settings.includeOpenTabs) {
            this.openTabsResults = [];
        }

        this.fuse = new Fuse([
            ...this.bookmarkResults,
            ...this.topSitesResults,
            ...this.openTabsResults
        ], {
            shouldSort: true,
            threshold: 0.4,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                "display",
                "value"
            ]
        });
    }

    removeTab(tabId) {
        this.openTabsResults = this.openTabsResults.filter(x => x.value !== tabId);
        this.load(false, false, false, false);
    }

    filter(searchValue) {
        if (!this.fuse) return;

        let results = this.fuse.search(searchValue).slice(0, 10);

        if (this.isUrl(searchValue)) {
            results.unshift({ display: "Go To", value: searchValue, resultType: SPEEDKEY.RESULT_TYPES.GOTO });
        } 
        
        results.push({ display: "Search", value: searchValue, resultType: SPEEDKEY.RESULT_TYPES.SEARCH });

        return results;
    }

    async navigate(value, type) {
        if (type === SPEEDKEY.RESULT_TYPES.OPEN_TAB) {
            this.goToTab(value.id, value.windowId);
            return;
        }

        if (type === SPEEDKEY.RESULT_TYPES.SEARCH) {
            this.search(value);
            return;
        }

        if (type === SPEEDKEY.RESULT_TYPES.GOTO) {
            if (this.needsSchema(value)) {
                value = `https://${value}`;
            }
        }

        if (this.needsTrailingSlash(value)) {
            value += '/';
        }

        if (this.settings.switchToExistingTab) {
            try {
                let tabs = await browser.tabs.query({
                    url: `${value}*`
                });
                
                if (tabs && tabs.length > 0) {
                    this.goToTab(tabs[0].id, tabs[0].windowId);
                } else {
                    this.newTab(value);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            this.newTab(value);
        }
    }

    search(val) {
        browser.search.search({
            query: val
        });
    }

    async goToTab(id, windowId) {
        if (windowId) {
            browser.windows.update(windowId, {
                focused: true
            });
        }

        browser.tabs.update(id, {
            active: true
        });
    }

    newTab(url) {
        browser.tabs.create({
            url: url
        });
    }

    async sendMessageToActiveTab(message) {
        try {
            let tabs = await browser.tabs.query({
                currentWindow: true,
                active: true
            });
            
            browser.tabs.sendMessage(tabs[0].id, message);
        } catch (err) {
            console.error(err);
        }   
    }

    isUrl(val) {
        return SPEEDKEY.REGEXES.URL.test(val);
    }

    needsSchema(val) {
        return !SPEEDKEY.REGEXES.SCHEMA.test(val);
    }

    needsTrailingSlash(val) {
        return !SPEEDKEY.REGEXES.FULL_DOMAIN.test(val);
    }

    flattenBookmarks(results, node, path, foldersToExclude) {
        if (!node || (node.type == 'folder' && foldersToExclude.includes(node.title))) {
            return;
        } else if (node.type == 'bookmark') {
            results.push({
                display: `${path}${(node.title || node.url)}`,
                value: node.url,
                resultType: SPEEDKEY.RESULT_TYPES.BOOKMARK
            });
        } else if (node.type == 'folder' && node.children && node.children.length > 0) {
            var newPath = node.id.endsWith('__') ? '' : `${path}${node.title}/`;
            node.children.forEach(x => {
                this.flattenBookmarks(results, x, newPath, foldersToExclude);
            })
        }
        return results;
    }

    async init() {
        await this.load(true, true, true, true);

        browser.commands.onCommand.addListener((command) => {
            try {
                switch (command) {
                    case SPEEDKEY.COMMANDS.TOGGLE_LAUNCHER:
                        this.sendMessageToActiveTab({
                            action: SPEEDKEY.ACTIONS.TOGGLE
                        });
                        break;
                }
            } catch (err) {
                console.error(err);
            }
            
        });

        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
                switch (request.action) {
                    case SPEEDKEY.ACTIONS.FILTER:
                        sendResponse({
                            results: this.filter(request.payload)
                        });
                        break;
                    case SPEEDKEY.ACTIONS.NAVIGATE:
                        this.navigate(request.payload, request.resultType);
                        break;
                }
            } catch (err) {
                console.error(err);
            }
            
        });

        //settings
        browser.storage.onChanged.addListener(() => this.load(true, true, true, true));
        
        //bookmarks
        browser.bookmarks.onCreated.addListener(() => this.load(false, true, false, false));
        browser.bookmarks.onRemoved.addListener(() => this.load(false, true, false, false));
        browser.bookmarks.onChanged.addListener(() => this.load(false, true, false, false));
        browser.bookmarks.onMoved.addListener(() => this.load(false, true, false, false));

        //tabs
        browser.tabs.onCreated.addListener(() => this.load(false, false, false, true));
        browser.tabs.onUpdated.addListener(() => this.load(false, false, false, true));
        browser.tabs.onRemoved.addListener((tabId) => this.removeTab(tabId));
    }
}

(async function() {
    await new SpeedkeyBackground().init();
})();
