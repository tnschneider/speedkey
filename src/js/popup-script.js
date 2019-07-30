(async function() {
    const ASSET_URLS = {
        THEME_LIGHT: {
            [SPEEDKEY.RESULT_TYPES.BOOKMARK]: browser.runtime.getURL("assets/icons/star_light.svg"),
            [SPEEDKEY.RESULT_TYPES.SEARCH]: browser.runtime.getURL("assets/icons/search_light.svg"),
            [SPEEDKEY.RESULT_TYPES.TOP_SITE]: browser.runtime.getURL("assets/icons/whatshot_light.svg"),
            [SPEEDKEY.RESULT_TYPES.GOTO]: browser.runtime.getURL("assets/icons/arrow_forward_light.svg"),
            [SPEEDKEY.RESULT_TYPES.OPEN_TAB]: browser.runtime.getURL("assets/icons/tab_light.svg"),
        },
        THEME_DARK: {
            [SPEEDKEY.RESULT_TYPES.BOOKMARK]: browser.runtime.getURL("assets/icons/star_dark.svg"),
            [SPEEDKEY.RESULT_TYPES.SEARCH]: browser.runtime.getURL("assets/icons/search_dark.svg"),
            [SPEEDKEY.RESULT_TYPES.TOP_SITE]: browser.runtime.getURL("assets/icons/whatshot_dark.svg"),
            [SPEEDKEY.RESULT_TYPES.GOTO]: browser.runtime.getURL("assets/icons/arrow_forward_dark.svg"),
            [SPEEDKEY.RESULT_TYPES.OPEN_TAB]: browser.runtime.getURL("assets/icons/tab_dark.svg"),
        }
    }

    new Vue({
        render(createElement) {
            if (this.settings) {
                return createElement('div', {
                    class: {
                        'speedkey-launcher-container': true,
                        'speedkey-theme-dark': this.settings.darkTheme
                    }
                }, [
                    createElement('div', {
                        class: 'speedkey-launcher-box',
                        on: {
                            keyup: this.onKeyup
                        }
                    }, [
                        createElement('input', {
                            ref: 'input',
                            class: 'speedkey-launcher-input',
                            attrs: {
                                placeholder: 'Search'
                            },
                            props: { value: this.searchValue }, 
                            on: { 
                                input: (e) => { 
                                    this.searchValue = e.target.value;
                                }
                            }
                        }),
                        createElement('div', {
                            class: 'speedkey-match-list'
                        }, this.results.map((result, index) => {
                            return createElement('div', {
                                on: {
                                    click: () => {
                                        this.submit(index);
                                    }
                                },
                                attrs: {
                                    id: this.getResultId(index)
                                },
                                class: {
                                    'speedkey-match-list-member': true,
                                    'highlighted': this.highlightedResult === index
                                }
                            }, [
                                createElement('div', {}, [
                                    ...(result.value.identity ? [
                                        createElement('span', {
                                            style: {
                                                color: result.value.identity.colorCode
                                            }
                                        }, [`[${result.value.identity.name}] `])
                                    ] : []),
                                    result.display
                                ]),
                                createElement('img', {
                                    attrs: {
                                        src: this.getResultIconSrc(result)
                                    }
                                })
                            ])
                        }))
                    ])
                ]);
            }
        },
        data: {
            searchValue: null,
            highlightedResult: 0,
            results: [],
            settings: null
        },
        computed: {
            numResults() {
                return this.results.length;
            }
        },
        methods: {
            submit(index) {
                if (!index && index !== 0) index = this.highlightedResult;

                let selected = this.results[index];

                if (!selected) {
                    selected = {
                        value: this.searchValue,
                        resultType: SPEEDKEY.RESULT_TYPES.SEARCH
                    }
                }

                browser.runtime.sendMessage({
                    action: SPEEDKEY.ACTIONS.NAVIGATE,
                    payload: selected.value,
                    resultType: selected.resultType
                });

                window.close();
            },
            filter: _SPEEDKEY_debounce(function() {
                return browser.runtime.sendMessage({
                    action: SPEEDKEY.ACTIONS.FILTER,
                    payload: this.searchValue
                }).then((res) => {
                    this.results = res.results;
                    this.highlightedResult = 0;
                });
            }, 100, false),
            getResultIconSrc(result) {
                const theme = this.settings.darkTheme ? 'THEME_DARK' : 'THEME_LIGHT';
                return ASSET_URLS[theme][result.resultType] || '';
            },
            getResultId(index) {
                return `result-${index}`;
            },
            onKeyup(e) {
                switch(e.key) {
                    case 'ArrowDown':
                        if (this.highlightedResult < this.numResults - 1) {
                            this.highlightedResult++;
                        } else {
                            this.highlightedResult = 0;
                        }
                        this.scrollResultIntoView();
                        break;
                    case 'ArrowUp':
                        if (this.highlightedResult > 0) {
                            this.highlightedResult--;
                        } else {
                            this.highlightedResult = this.numResults > 0 ? this.numResults - 1 : 0;
                        }
                        this.scrollResultIntoView();
                        break;
                    case 'PageDown':
                        this.highlightedResult = this.numResults > 0 ? this.numResults - 1 : 0;
                        this.scrollResultIntoView();
                        break;
                    case 'PageUp': 
                        this.highlightedResult = 0;
                        this.scrollResultIntoView();
                        break;
                    case 'Enter':
                        this.submit();
                        break;
                }
                
            },
            scrollResultIntoView() {
                let id = this.getResultId(this.highlightedResult);
                if (id) {
                    document.getElementById(id).scrollIntoView({
                        block: "nearest",
                        inline: "nearest"
                    });
                }
                
            },
            async loadSettings() {
                this.settings = await SpeedkeySettings.GetSettings();
            }
        },
        watch: {
            searchValue(val, prev) {
                if (val !== prev) {
                    this.filter();
                }
            }
        },
        async mounted() {
            await this.loadSettings();

            await this.filter();

            Vue.nextTick(() => {
                this.$refs.input.focus();
            });

            browser.storage.onChanged.addListener(() => this.loadSettings());
        }
    }).$mount(`#speedkey-launcher-container`);
})();