(async function() {
    let fuse;
    
    async function loadBookmarks() {
        function flatten(results, node, path, foldersToExclude) {
            if (!node || (node.type == 'folder' && foldersToExclude.includes(node.title))) {
                return;
            } else if (node.type == 'bookmark') {
                results.push({
                    display: `${path}${(node.title || node.url)}`,
                    value: node.url,
                    resultType: "bookmark"
                });
            } else if (node.type == 'folder' && node.children && node.children.length > 0) {
                var newPath = node.id.endsWith('__') ? '' : `${path}${node.title}/`;
                node.children.forEach(x => {
                    flatten(results, x, newPath, foldersToExclude);
                })
            }
            return results;
        }

        let settings = await browser.storage.local.get();

        let bookmarks = await browser.bookmarks.getTree();

        let bookmarkResults = flatten([], bookmarks[0], '', (settings.foldersToExclude || []).filter(x => x.length > 0));

        let topSitesResults = settings.includeTopSites
            ? (await browser.topSites.get())
                .map(x => ({
                    display: x.title || x.url,
                    value: x.url,
                    resultType: 'top-site'
                }))
            : [];

        let allResults = [
            ...bookmarkResults,
            ...topSitesResults
        ]

        fuse = new Fuse(allResults, {
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
    }

    function filter(searchValue) {
        var results = fuse.search(searchValue).slice(0, 10);

        results.push({ display: "Search", value: "search", resultType: "search" });

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
            browser.tabs.sendMessage(x[0].id, message);
        });
    }

    await loadBookmarks();

    browser.commands.onCommand.addListener(handleCommand);
    browser.runtime.onMessage.addListener(handleMessage);

    browser.bookmarks.onCreated.addListener(() => loadBookmarks());
    browser.bookmarks.onRemoved.addListener(() => loadBookmarks());
    browser.bookmarks.onChanged.addListener(() => loadBookmarks());
    browser.bookmarks.onMoved.addListener(() => loadBookmarks());
    browser.storage.onChanged.addListener(() => loadBookmarks());
})();