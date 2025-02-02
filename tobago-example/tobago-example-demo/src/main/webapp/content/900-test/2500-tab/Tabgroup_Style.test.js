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

import {querySelectorFn} from "/script/tobago-test.js";
import {JasmineTestTool} from "/tobago/test/tobago-test-tool.js";

it("test numbers of tab-group-index", function (done) {
  let tab1Fn = querySelectorFn("#page\\:mainForm\\:tabOne");
  let tab2Fn = querySelectorFn("#page\\:mainForm\\:tabTwo");
  let tab3Fn = querySelectorFn("#page\\:mainForm\\:tabThree");
  let tab4Fn = querySelectorFn("#page\\:mainForm\\:tabFour");
  let tab5Fn = querySelectorFn("#page\\:mainForm\\:tabFive");
  let tabContent1Fn = querySelectorFn("#page\\:mainForm\\:tabOne\\:\\:content");
  let tabContent2Fn = querySelectorFn("#page\\:mainForm\\:tabTwo\\:\\:content");
  let tabContent3Fn = querySelectorFn("#page\\:mainForm\\:tabThree\\:\\:content");
  let tabContent4Fn = querySelectorFn("#page\\:mainForm\\:tabFour\\:\\:content");
  let tabContent5Fn = querySelectorFn("#page\\:mainForm\\:tabFive\\:\\:content");

  let test = new JasmineTestTool(done);
  test.do(() => expect(tab1Fn().index).toBe(0));
  test.do(() => expect(tab2Fn().index).toBe(1));
  test.do(() => expect(tab3Fn()).toBe(null, "Tab three is not rendered"));
  test.do(() => expect(tab4Fn().index).toBe(3));
  test.do(() => expect(tab5Fn().index).toBe(4));
  test.do(() => expect(tabContent1Fn().dataset["index"]).toBe("0"));
  test.do(() => expect(tabContent2Fn().dataset["index"]).toBe("1"));
  test.do(() => expect(tabContent3Fn()).toBe(null, "Tab three content is not rendered"));
  test.do(() => expect(tabContent4Fn()).toBe(null, "Tab four content is not rendered (disabled)"));
  test.do(() => expect(tabContent5Fn().dataset["index"]).toBe("4"));
  test.do(() => expect(tab1Fn().querySelector(".nav-link").classList.contains("active")).toBe(true));
  test.do(() => expect(tab2Fn().querySelector(".nav-link").classList.contains("active")).not.toBe(true));
  test.do(() => expect(tab4Fn().querySelector(".nav-link").classList.contains("active")).not.toBe(true));
  test.do(() => expect(tab5Fn().querySelector(".nav-link").classList.contains("active")).not.toBe(true));
  test.do(() => expect(tabContent1Fn().classList.contains("active")).toBe(true));
  test.do(() => expect(tabContent2Fn().classList.contains("active")).not.toBe(true));
  test.do(() => expect(tabContent4Fn()).toBe(null));
  test.do(() => expect(tabContent5Fn().classList.contains("active")).not.toBe("active"));
  test.start();
});
