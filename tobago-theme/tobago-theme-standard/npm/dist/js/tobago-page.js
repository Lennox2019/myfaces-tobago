/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { DomUtils } from "./tobago-utils";
import { Jsf } from "./tobago-jsf";
import { CommandHelper } from "./tobago-command";
import { Overlay } from "./tobago-overlay";
import { Listener } from "./tobago-listener";
export class Page extends HTMLElement {
    constructor() {
        super();
    }
    /**
     * The Tobago root element
     */
    static page(element) {
        const rootNode = element.getRootNode();
        const pages = rootNode.querySelectorAll("tobago-page");
        if (pages.length > 0) {
            if (pages.length >= 2) {
                console.warn("Found more than one tobago-page element!");
            }
            return pages.item(0);
        }
        console.warn("Found no tobago page!");
        return null;
    }
    connectedCallback() {
        Jsf.registerAjaxListener();
        this.querySelector("form").addEventListener("submit", CommandHelper.onSubmit);
        window.addEventListener("unload", this.onUnload.bind(this));
        this.addEventListener("keypress", function (event) {
            let code = event.which; // XXX deprecated
            if (code === 0) {
                code = event.keyCode;
            }
            if (code === 13) {
                let target = event.target;
                if (target.tagName === "A" || target.tagName === "BUTTON") {
                    return;
                }
                if (target.tagName === "TEXTAREA") {
                    if (!event.metaKey && !event.ctrlKey) {
                        return;
                    }
                }
                const name = target.getAttribute("name");
                let id = name ? name : target.id;
                while (id != null) {
                    const command = document.querySelector("[data-tobago-default='" + id + "']");
                    if (command) {
                        command.dispatchEvent(new MouseEvent("click"));
                        break;
                    }
                    id = DomUtils.getNamingContainerId(id);
                }
                return false;
            }
        });
        // todo remove this
        Listener.executeDocumentReady(document.documentElement);
    }
    onBeforeUnload() {
        if (this.transition) {
            new Overlay(this);
        }
        this.transition = this.oldTransition;
    }
    /**
     * Wrapper function to call application generated onunload function
     */
    onUnload() {
        console.info("on onload");
        if (CommandHelper.isSubmit) {
            if (this.transition) {
                new Overlay(this);
            }
            this.transition = this.oldTransition;
        }
        else {
            Listener.executeBeforeExit();
        }
    }
    get locale() {
        let locale = this.getAttribute("locale");
        if (!locale) {
            locale = document.documentElement.lang;
        }
        return locale;
    }
}
document.addEventListener("DOMContentLoaded", function (event) {
    window.customElements.define("tobago-page", Page);
});
// todo remove this
window.addEventListener("load", Listener.executeWindowLoad);
//# sourceMappingURL=tobago-page.js.map