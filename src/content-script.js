(function() {
    const SPEEDKEY_CONTAINER_ELEMENT_ID = "speedkey-launcher-container";

    let container = document.createElement("div");
    container.className = SPEEDKEY_CONTAINER_ELEMENT_ID;
    container.id = SPEEDKEY_CONTAINER_ELEMENT_ID;
    container.style.display = 'none';
    document.body.appendChild(container);

    new Vue({
        template: `
            <div v-show="visible" 
                class="speedkey-launcher-overlay"
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
                            :class="{ 'speedkey-match-list-member': true, 'highlighted': highlightedResult === index }">
                            {{ result.display }}
                        </div>
                    </div>
                </div>
            </div>`,
        data: {
            searchValue: null,
            visible: false,
            highlightedResult: 0,
            results: []
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

                if (!selected || selected.value === 'search') {
                    if (this.searchValue) {
                        browser.runtime.sendMessage({
                            action: SPEEDKEY.ACTIONS.SEARCH,
                            payload: this.searchValue
                        });
                    }
                } else {
                    browser.runtime.sendMessage({
                        action: SPEEDKEY.ACTIONS.NAVIGATE,
                        payload: selected.value
                    });
                }

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
            onEnter() {
                this.submit();
            },
            onEscape() {
                this.hide();
            },
            onDown() {
                if (this.highlightedResult < this.numResults - 1) this.highlightedResult++
            },
            onUp() {
                if (this.highlightedResult > 0) this.highlightedResult--
            },
            onPageDown() {
                this.highlightedResult = this.numResults > 0 ? this.numResults - 1 : 0;
            },
            onPageUp() {
                this.highlightedResult = 0;
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
        mounted() {
            browser.runtime.onMessage.addListener((message) => {
                switch (message.action) {
                    case SPEEDKEY.ACTIONS.OPEN:
                        this.show();
                        break;
                }
            });
        }
    }).$mount(`#${SPEEDKEY_CONTAINER_ELEMENT_ID}`);
})();