class SpeedkeyBackground {
    constructor() {
        this.settings = {};
        this.fuse = null;
        this.bookmarkResults = [];
        this.topSitesResults = [];
    }

    async load(reloadSettings, reloadBookmarks, reloadTopSites) {
        console.info('loading...');

        if (reloadSettings) {
            this.settings = new SpeedkeySettings(await browser.storage.local.get());
        }

        if (reloadBookmarks && this.settings.includeBookmarks) {
            console.info("reloading bookmarks...");
            let bookmarks = await browser.bookmarks.getTree();
            this.bookmarkResults = bookmarks.length > 0
                ? this.flattenBookmarks([], bookmarks[0], '', (this.settings.foldersToExclude || []).filter(x => x.length > 0))
                : [];
        } else if (!this.settings.includeBookmarks) {
            this.bookmarkResults = [];
        }

        if (reloadTopSites && this.settings.includeTopSites) {
            console.info("reloading top sites...");
            this.topSitesResults = (await browser.topSites.get())
                .map(x => ({
                    display: x.title || x.url,
                    value: x.url,
                    resultType: SPEEDKEY.RESULT_TYPES.TOP_SITE
                }));
        } else if (!this.settings.includeTopSites) {
            this.topSitesResults = [];
        }

        this.fuse = new Fuse([
            ...this.bookmarkResults,
            ...this.topSitesResults
        ], {
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

        console.info("finished loading.")
    }

    filter(searchValue) {
        if (!this.fuse) return;

        let results = this.fuse.search(searchValue).slice(0, 10);

        if (this.isUrl(searchValue)) {
            results.unshift({ display: "Go To", value: SPEEDKEY.RESULT_TYPES.GOTO, resultType: SPEEDKEY.RESULT_TYPES.GOTO });
        } 
        
        results.push({ display: "Search", value: SPEEDKEY.RESULT_TYPES.SEARCH, resultType: SPEEDKEY.RESULT_TYPES.SEARCH });

        return results;
    }

    async navigate(to, isGoto) {
        if (isGoto) {
            if (this.needsSchema(to)) {
                to = `http://${to}`;
            }

            if (this.needsTrailingSlash(to)) {
                to += '/';
            }
        }

        if (this.settings.switchToExistingTab) {
            try {
                let tabs = await browser.tabs.query({
                    currentWindow: true,
                    url: `${to}*`
                });
                
                if (tabs && tabs.length > 0) {
                    browser.tabs.update(tabs[0].id, {
                        active: true
                    })
                } else {
                    browser.tabs.create({
                        url: to
                    });
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            browser.tabs.create({
                url: to
            });
        }
    }

    search(val) {
        browser.search.search({
            query: val
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
        await this.load(true, true, true);

        browser.commands.onCommand.addListener((command) => {
            try {
                switch (command) {
                    case SPEEDKEY.COMMANDS.OPEN_LAUNCHER:
                        this.sendMessageToActiveTab({
                            action: SPEEDKEY.ACTIONS.OPEN
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
                        this.navigate(request.payload, request.isGoto);
                        break;
                    case SPEEDKEY.ACTIONS.SEARCH:
                        this.search(request.payload);
                        break;
                }
            } catch (err) {
                console.error(err);
            }
            
        });

        browser.bookmarks.onCreated.addListener(() => this.load(false, true, false));
        browser.bookmarks.onRemoved.addListener(() => this.load(false, true, false));
        browser.bookmarks.onChanged.addListener(() => this.load(false, true, false));
        browser.bookmarks.onMoved.addListener(() => this.load(false, true, false));
        browser.storage.onChanged.addListener(() => this.load(true, true, true));
    }
}

(async function() {
    await new SpeedkeyBackground().init();
})();
