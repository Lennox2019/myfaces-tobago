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

const sourceDir = "node_modules/jsf.js_next_gen/dist/window/";
const targetDir = "tobago-theme-standard/src/main/js/";
const jsFile = "jsf.js";
const mapFile = "jsf.js.map";

const fs = require('fs')

// copy and patch jsf.js
fs.readFile(sourceDir + jsFile, "utf8", function (e, data) {
  if (e) {
    console.error(e);
  } else {

    // This replace is, because the last line refers to a sourceMappingURL which is not available in Tobago.
    // In Safari, with open Development Console, we got an 404.xhtml request otherwise (not shown in network section).

    const result = data.replace(/\n\/\/# sourceMappingURL=jsf\.js\.map\.jsf\?ln=scripts/g, "");

    fs.writeFile(targetDir + jsFile, result, 'utf8', function (e) {
      if (e) {
        console.error(e);
      }
    });
  }
});

// copy jsf.js.map
fs.copyFile(sourceDir + mapFile, targetDir + mapFile, function (e) {
  if (e) {
    console.error(e);
  }
});
