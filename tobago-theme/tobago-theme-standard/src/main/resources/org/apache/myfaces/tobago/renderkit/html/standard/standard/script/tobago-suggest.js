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

Tobago.Suggest = {};

Tobago.Suggest.loadFromServer = function (input) {

  return function findMatches(query, syncResults, asyncResults) {

    var suggest = jQuery(Tobago.Utils.escapeClientId(input.data("tobago-suggest-for")));
    if (suggest.val() != query) {
      suggest.val(query);
      input.data("tobago-suggest-callback", asyncResults);
      var id = suggest.attr("id");
      console.info("query: '" + query + "'");
      Tobago.Updater.update(suggest, id, id, {});
    }
  };
};

Tobago.Suggest.init = function (elements) {

  var suggests = Tobago.Utils.selectWithJQuery(elements, ".tobago-suggest");

  suggests.each(function () {
    var suggest = jQuery(this);
    var input = jQuery(Tobago.Utils.escapeClientId(suggest.data("tobago-suggest-for")));
    input.data("tobago-suggest-for", suggest.attr("id"));

    var minChars = suggest.data("tobago-suggest-min-chars");
    var maxItems = suggest.data("tobago-suggest-max-items");

    var delay = suggest.data("tobago-suggest-delay"); // todo
    var update = suggest.data("tobago-suggest-update"); // todo
    var totalCount = suggest.data("tobago-suggest-total-count"); // todo

    var list = suggest.data("tobago-suggest-data");

    input.attr("autocomplete", "off");

    var asyncResults = input.data("tobago-suggest-callback");
    if (asyncResults) {
      console.info("data from server: '" + list + "'");
      asyncResults(list);
    } else {
      input.typeahead({
        minLength: minChars,
        hint: true,// todo
        highlight: true // todo
      }, {
        //name: 'test',// todo
        limit: maxItems,
        source: Tobago.Suggest.loadFromServer(input)
      });
    }
  });
};

Tobago.registerListener(Tobago.Suggest.init, Tobago.Phase.DOCUMENT_READY);
Tobago.registerListener(Tobago.Suggest.init, Tobago.Phase.AFTER_UPDATE);
