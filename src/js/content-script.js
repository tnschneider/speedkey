(async function() {
    const SPEEDKEY_CONTAINER_ELEMENT_ID = "speedkey-launcher-container";

    let existingContainer = document.getElementById(SPEEDKEY_CONTAINER_ELEMENT_ID);
    if (existingContainer) existingContainer.parentElement.removeChild(existingContainer);

    let container = document.createElement("div");
    container.className = SPEEDKEY_CONTAINER_ELEMENT_ID;
    container.id = SPEEDKEY_CONTAINER_ELEMENT_ID;
    container.style.display = 'none';
    document.body.appendChild(container);

    const ASSET_URLS = {
        [SPEEDKEY.RESULT_TYPES.BOOKMARK]: browser.runtime.getURL("assets/icons/star.svg"),
        [SPEEDKEY.RESULT_TYPES.SEARCH]: browser.runtime.getURL("assets/icons/search.svg"),
        [SPEEDKEY.RESULT_TYPES.TOP_SITE]: browser.runtime.getURL("assets/icons/whatshot.svg"),
        [SPEEDKEY.RESULT_TYPES.GOTO]: browser.runtime.getURL("assets/icons/arrow_forward.svg"),
        [SPEEDKEY.RESULT_TYPES.OPEN_TAB]: browser.runtime.getURL("assets/icons/tab.svg"),
    }

    new Vue({
        template: `
            <div class="speedkey-launcher-container" id="speedkey-launcher-container">
            <transition name="fade">
            <div v-if="visible" 
                class="speedkey-launcher-overlay"
                :class="{ 'speedkey-launcher-overlay': true, 'dark-overlay': settings.darkOverlay }"
                @click.self="hide"
                @keyup.enter="onEnter"
                @keyup.escape="onEscape"
                @keyup.down="onDown"
                @keyup.up="onUp"
                @keyup.page-down="onPageDown"
                @keyup.page-up="onPageUp">
                <div class="speedkey-launcher-box">
                    <input ref="input"
                        placeholder="Search"
                        class="speedkey-launcher-input"
                        v-model="searchValue">
                    </input>
                    <div class="speedkey-match-list">
                        <div v-for="(result, index) in results"
                            @click="submit(index)"
                            :id="getResultId(index)"
                            :class="{ 'speedkey-match-list-member': true, 'highlighted': highlightedResult === index }">
                            <div>{{ result.display }}</div>
                            <img :src="getResultIconSrc(result)"></img>
                        </div>
                    </div>
                </div>
            </div>    
            </transition>
            </div>
            `,
        data: {
            searchValue: null,
            visible: false,
            highlightedResult: 0,
            results: [],
            settings: {}
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

                this.hide();
            },
            filter: _SPEEDKEY_debounce(function() {
                browser.runtime.sendMessage({
                    action: SPEEDKEY.ACTIONS.FILTER,
                    payload: this.searchValue
                }).then((res) => {
                    this.results = res.results;
                    this.highlightedResult = 0;
                });
            }, 100, false),
            show() {
                this.visible = true;
                Vue.nextTick(() => {
                    this.$refs.input.focus();
                });  
            },
            hide() {
                this.visible = false;
                this.searchValue = null;
                this.highlightedResult = 0;
            },
            getResultIconSrc(result) {
                return ASSET_URLS[result.resultType] || '';
            },
            getResultId(index) {
                return `result-${index}`;
            },
            onEnter() {
                this.submit();
            },
            onEscape() {
                this.hide();
            },
            onDown() {
                if (this.highlightedResult < this.numResults - 1) {
                    this.highlightedResult++;
                } else {
                    this.highlightedResult = 0;
                }
                this.scrollResultIntoView();
            },
            onUp() {
                if (this.highlightedResult > 0) {
                    this.highlightedResult--;
                } else {
                    this.highlightedResult = this.numResults > 0 ? this.numResults - 1 : 0;
                }
                this.scrollResultIntoView();
            },
            onPageDown() {
                this.highlightedResult = this.numResults > 0 ? this.numResults - 1 : 0;
                this.scrollResultIntoView();
            },
            onPageUp() {
                this.highlightedResult = 0;
                this.scrollResultIntoView();
            },
            scrollResultIntoView() {
                document.getElementById(this.getResultId(this.highlightedResult)).scrollIntoView({
                    block: "nearest",
                    inline: "nearest"
                })
            },
            async loadSettings() {
                this.settings = await SpeedkeySettings.GetSettings();
            }
        },
        watch: {
            searchValue(val, prev) {
                if (!val) {
                    this.results = [];
                } else if (val !== prev) {
                    this.filter();
                }
            }
        },
        async mounted() {
            await this.loadSettings();

            browser.storage.onChanged.addListener(() => this.loadSettings());
            
            browser.runtime.onMessage.addListener((message) => {
                switch (message.action) {
                    case SPEEDKEY.ACTIONS.TOGGLE:
                        if (this.visible) {
                            this.hide();
                        } else {
                            this.show();
                        }
                        break;
                }
            });
        }
    }).$mount(`#${SPEEDKEY_CONTAINER_ELEMENT_ID}`);
})();