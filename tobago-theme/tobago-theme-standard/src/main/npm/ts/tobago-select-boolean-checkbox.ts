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

import {Listener, Phase} from "./tobago-listener";
import {DomUtils} from "./tobago-utils";

class SelectBooleanCheckbox {

  static init = function (element: HTMLElement) {
    for (const checkbox of DomUtils.selfOrQuerySelectorAll(element, ".tobago-selectBooleanCheckbox input[readonly]")) {
      checkbox.addEventListener("click", (event: Event) => {
        // in the "readonly" case, prevent the default, which is changing the "checked" state
        event.preventDefault();
      });
    }
  };
}

Listener.register(SelectBooleanCheckbox.init, Phase.DOCUMENT_READY);
Listener.register(SelectBooleanCheckbox.init, Phase.AFTER_UPDATE);