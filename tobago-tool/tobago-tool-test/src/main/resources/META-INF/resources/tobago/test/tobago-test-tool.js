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

function TobagoTestTool(assert) {
  this.assert = assert;
  this.steps = [];
}

TobagoTestTool.stepType = {
  ACTION: 1,
  WAIT_RESPONSE: 2,
  WAIT_MS: 3,
  ASSERTS: 4
};

TobagoTestTool.msie = navigator.userAgent.indexOf("MSIE") > -1 || navigator.userAgent.indexOf("Trident") > -1;

TobagoTestTool.COLUMN_START = TobagoTestTool.msie ? "-ms-grid-column" : "grid-column-start";
TobagoTestTool.COLUMN_END = TobagoTestTool.msie ? "-ms-grid-column-span" : "grid-column-end";
TobagoTestTool.ROW_START = TobagoTestTool.msie ? "-ms-grid-row" : "grid-row-start";
TobagoTestTool.ROW_END = TobagoTestTool.msie ? "-ms-grid-row-span" : "grid-row-end";

TobagoTestTool.checkGridCss = function (assert, $element, columnStart, columnEnd, rowStart, rowEnd) {

  columnEnd = TobagoTestTool.convertGridCss(columnEnd);
  rowEnd = TobagoTestTool.convertGridCss(rowEnd);

  assert.equal($element.css(TobagoTestTool.COLUMN_START), columnStart);
  assert.equal($element.css(TobagoTestTool.COLUMN_END), columnEnd);
  assert.equal($element.css(TobagoTestTool.ROW_START), rowStart);
  assert.equal($element.css(TobagoTestTool.ROW_END), rowEnd);
};

TobagoTestTool.convertGridCss = function (end) {
  if (TobagoTestTool.msie) {
    switch (end) {
      case "auto":
        return "1";
      case "span 2":
        return "2";
      case "span 3":
        return "3";
      case "span 4":
        return "4";
      default:
        return end;
    }
  } else {
    return end;
  }
};

TobagoTestTool.prototype = {
  action: function (func) {
    this.steps.push({
      type: TobagoTestTool.stepType.ACTION,
      func: func
    });
  },
  waitForResponse: function () {
    this.steps.push({
      type: TobagoTestTool.stepType.WAIT_RESPONSE
    });
  },
  waitMs: function (ms) {
    this.steps.push({
      type: TobagoTestTool.stepType.WAIT_MS,
      ms: ms ? ms : 0
    });
  },
  asserts: function (numOfAssertions, func) {
    this.steps.push({
      type: TobagoTestTool.stepType.ASSERTS,
      numOfAssertions: numOfAssertions ? numOfAssertions : 0,
      func: func
    });
  },
  startTest: function () {
    const steps = this.steps.slice(0);
    const cycleTiming = 50;
    let currentStep = 0;
    let testStepTimeout;

    function getAssertExpect() {
      var expect = 0;
      steps.forEach(function (step) {
        if (step.type === TobagoTestTool.stepType.ASSERTS) {
          expect += step.numOfAssertions;
        }
      });
      return expect;
    }

    function getAssertAsync() {
      var async = 0;
      steps.forEach(function (step) {
        if (step.type === TobagoTestTool.stepType.ASSERTS) {
          async++;
        }
      });
      return async;
    }

    this.assert.expect(getAssertExpect());
    const done = this.assert.async(getAssertAsync());
    const assert = this.assert;

    function resetTestStepTimeout(additionalMs) {
      const timeout = additionalMs ? 20000 + additionalMs : 20000;
      testStepTimeout = Date.now() + timeout;
    }

    let waitForResponse = false;
    let ajaxRequestDetected = false;
    let ajaxRequestDone = false;
    let fullPageReloadDetected = false;
    let fullPageReloadDone = false;

    function registerAjaxReadyStateListener() {
      let oldXHR = document.getElementById("page:testframe").contentWindow.XMLHttpRequest;

      function newXHR() {
        let realXHR = new oldXHR();
        realXHR.addEventListener("readystatechange", function () {
          if (realXHR.readyState !== XMLHttpRequest.UNSENT && realXHR.readyState !== XMLHttpRequest.DONE) {
            ajaxRequestDetected = true;
          } else if (ajaxRequestDetected && realXHR.readyState === XMLHttpRequest.DONE) {
            ajaxRequestDone = true;
            waitForResponse = false;
          }
        }, false);
        return realXHR;
      }

      document.getElementById("page:testframe").contentWindow.XMLHttpRequest = newXHR;
    }

    function fullPageReloadPolling() {
      const testframe = document.getElementById("page:testframe");
      if (testframe === null
          || testframe.contentWindow.document.readyState !== "complete"
          || testframe.contentWindow.document.querySelector("html") === null) {
        fullPageReloadDetected = true;
      } else if (fullPageReloadDetected) {
        fullPageReloadDone = true;
        waitForResponse = false;
      }

      if (!fullPageReloadDone && !ajaxRequestDone) {
        setTimeout(fullPageReloadPolling, cycleTiming);
      }
    }

    function cycle() {
      if (currentStep >= steps.length) {
        // we are done here
      } else if (Date.now() >= testStepTimeout) {
        assert.ok(false, "Timeout!");
        if (steps[currentStep].stepType === TobagoTestTool.stepType.ASSERTS) {
          done();
        }
        currentStep++;
        cycle();
      } else if (waitForResponse) {
        // we need to wait more
        setTimeout(cycle, cycleTiming);
      } else if (steps[currentStep].type === TobagoTestTool.stepType.ACTION) {
        if (currentStep + 1 < steps.length && steps[currentStep + 1].type === TobagoTestTool.stepType.WAIT_RESPONSE) {
          // register listener for ajax before action is executed, otherwise the ajax listener is registered too late
          registerAjaxReadyStateListener();
          steps[currentStep].func();
          currentStep++;
          cycle();
        } else {
          steps[currentStep].func();
          currentStep++;
          resetTestStepTimeout();
          setTimeout(cycle, cycleTiming);
        }
      } else if (steps[currentStep].type === TobagoTestTool.stepType.WAIT_RESPONSE) {
        waitForResponse = true;
        ajaxRequestDetected = false;
        ajaxRequestDone = false;
        fullPageReloadDetected = false;
        fullPageReloadDone = false;
        registerAjaxReadyStateListener();
        fullPageReloadPolling();

        currentStep++;
        resetTestStepTimeout();
        setTimeout(cycle, cycleTiming);
      } else if (steps[currentStep].type === TobagoTestTool.stepType.WAIT_MS) {
        const ms = steps[currentStep].ms;

        currentStep++;
        resetTestStepTimeout(ms);
        setTimeout(cycle, ms);
      } else if (steps[currentStep].type === TobagoTestTool.stepType.ASSERTS) {
        steps[currentStep].func();
        currentStep++;
        done();
        resetTestStepTimeout();
        setTimeout(cycle, cycleTiming);
      }
    }

    resetTestStepTimeout();
    cycle();
  }
};

export {TobagoTestTool};