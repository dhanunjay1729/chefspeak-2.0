var WebUtils = (function (exports) {
  'use strict';

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }
    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }
  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }
        _next(undefined);
      });
    };
  }

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  var _typeof_1 = createCommonjsModule(function (module) {
  function _typeof(obj) {
    "@babel/helpers - typeof";

    return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(obj);
  }
  module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
  });

  var regeneratorRuntime$1 = createCommonjsModule(function (module) {
  var _typeof = _typeof_1["default"];
  function _regeneratorRuntime() {
    module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
      return exports;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports;
    var exports = {},
      Op = Object.prototype,
      hasOwn = Op.hasOwnProperty,
      defineProperty = Object.defineProperty || function (obj, key, desc) {
        obj[key] = desc.value;
      },
      $Symbol = "function" == typeof Symbol ? Symbol : {},
      iteratorSymbol = $Symbol.iterator || "@@iterator",
      asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator",
      toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
    function define(obj, key, value) {
      return Object.defineProperty(obj, key, {
        value: value,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), obj[key];
    }
    try {
      define({}, "");
    } catch (err) {
      define = function define(obj, key, value) {
        return obj[key] = value;
      };
    }
    function wrap(innerFn, outerFn, self, tryLocsList) {
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator,
        generator = Object.create(protoGenerator.prototype),
        context = new Context(tryLocsList || []);
      return defineProperty(generator, "_invoke", {
        value: makeInvokeMethod(innerFn, self, context)
      }), generator;
    }
    function tryCatch(fn, obj, arg) {
      try {
        return {
          type: "normal",
          arg: fn.call(obj, arg)
        };
      } catch (err) {
        return {
          type: "throw",
          arg: err
        };
      }
    }
    exports.wrap = wrap;
    var ContinueSentinel = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var IteratorPrototype = {};
    define(IteratorPrototype, iteratorSymbol, function () {
      return this;
    });
    var getProto = Object.getPrototypeOf,
      NativeIteratorPrototype = getProto && getProto(getProto(values([])));
    NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype);
    var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function (method) {
        define(prototype, method, function (arg) {
          return this._invoke(method, arg);
        });
      });
    }
    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);
        if ("throw" !== record.type) {
          var result = record.arg,
            value = result.value;
          return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          }) : PromiseImpl.resolve(value).then(function (unwrapped) {
            result.value = unwrapped, resolve(result);
          }, function (error) {
            return invoke("throw", error, resolve, reject);
          });
        }
        reject(record.arg);
      }
      var previousPromise;
      defineProperty(this, "_invoke", {
        value: function value(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new PromiseImpl(function (resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }
          return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(innerFn, self, context) {
      var state = "suspendedStart";
      return function (method, arg) {
        if ("executing" === state) throw new Error("Generator is already running");
        if ("completed" === state) {
          if ("throw" === method) throw arg;
          return doneResult();
        }
        for (context.method = method, context.arg = arg;;) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }
          if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) {
            if ("suspendedStart" === state) throw state = "completed", context.arg;
            context.dispatchException(context.arg);
          } else "return" === context.method && context.abrupt("return", context.arg);
          state = "executing";
          var record = tryCatch(innerFn, self, context);
          if ("normal" === record.type) {
            if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue;
            return {
              value: record.arg,
              done: context.done
            };
          }
          "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg);
        }
      };
    }
    function maybeInvokeDelegate(delegate, context) {
      var methodName = context.method,
        method = delegate.iterator[methodName];
      if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel;
      var record = tryCatch(method, delegate.iterator, context.arg);
      if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel;
      var info = record.arg;
      return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel);
    }
    function pushTryEntry(locs) {
      var entry = {
        tryLoc: locs[0]
      };
      1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry);
    }
    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal", delete record.arg, entry.completion = record;
    }
    function Context(tryLocsList) {
      this.tryEntries = [{
        tryLoc: "root"
      }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) return iteratorMethod.call(iterable);
        if ("function" == typeof iterable.next) return iterable;
        if (!isNaN(iterable.length)) {
          var i = -1,
            next = function next() {
              for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next;
              return next.value = undefined, next.done = !0, next;
            };
          return next.next = next;
        }
      }
      return {
        next: doneResult
      };
    }
    function doneResult() {
      return {
        value: undefined,
        done: !0
      };
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), defineProperty(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) {
      var ctor = "function" == typeof genFun && genFun.constructor;
      return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name));
    }, exports.mark = function (genFun) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun;
    }, exports.awrap = function (arg) {
      return {
        __await: arg
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
      return this;
    }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      void 0 === PromiseImpl && (PromiseImpl = Promise);
      var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
      return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) {
        return result.done ? result.value : iter.next();
      });
    }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () {
      return this;
    }), define(Gp, "toString", function () {
      return "[object Generator]";
    }), exports.keys = function (val) {
      var object = Object(val),
        keys = [];
      for (var key in object) keys.push(key);
      return keys.reverse(), function next() {
        for (; keys.length;) {
          var key = keys.pop();
          if (key in object) return next.value = key, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, exports.values = values, Context.prototype = {
      constructor: Context,
      reset: function reset(skipTempReset) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined);
      },
      stop: function stop() {
        this.done = !0;
        var rootRecord = this.tryEntries[0].completion;
        if ("throw" === rootRecord.type) throw rootRecord.arg;
        return this.rval;
      },
      dispatchException: function dispatchException(exception) {
        if (this.done) throw exception;
        var context = this;
        function handle(loc, caught) {
          return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught;
        }
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i],
            record = entry.completion;
          if ("root" === entry.tryLoc) return handle("end");
          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc"),
              hasFinally = hasOwn.call(entry, "finallyLoc");
            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
              if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
            } else {
              if (!hasFinally) throw new Error("try statement without catch or finally");
              if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
            }
          }
        }
      },
      abrupt: function abrupt(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }
        finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null);
        var record = finallyEntry ? finallyEntry.completion : {};
        return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record);
      },
      complete: function complete(record, afterLoc) {
        if ("throw" === record.type) throw record.arg;
        return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel;
      },
      finish: function finish(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel;
        }
      },
      "catch": function _catch(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if ("throw" === record.type) {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function delegateYield(iterable, resultName, nextLoc) {
        return this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        }, "next" === this.method && (this.arg = undefined), ContinueSentinel;
      }
    }, exports;
  }
  module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;
  });

  // TODO(Babel 8): Remove this file.

  var runtime = regeneratorRuntime$1();
  var regenerator = runtime;

  // Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
  try {
    regeneratorRuntime = runtime;
  } catch (accidentalStrictMode) {
    if (typeof globalThis === "object") {
      globalThis.regeneratorRuntime = runtime;
    } else {
      Function("r", "regeneratorRuntime = r")(runtime);
    }
  }

  const t=new WeakMap;function e(t,e){return new Proxy(t,{get:(t,r)=>e(t[r])})}class r{constructor(){this.value=void 0,this.exports=null;}getState(){return this.exports.asyncify_get_state()}assertNoneState(){let t=this.getState();if(0!==t)throw new Error(`Invalid async state ${t}, expected 0.`)}wrapImportFn(t){return (...e)=>{if(2===this.getState())return this.exports.asyncify_stop_rewind(),this.value;this.assertNoneState();let r=t(...e);if(!(s=r)||"object"!=typeof s&&"function"!=typeof s||"function"!=typeof s.then)return r;var s;this.exports.asyncify_start_unwind(16),this.value=r;}}wrapModuleImports(t){return e(t,t=>"function"==typeof t?this.wrapImportFn(t):t)}wrapImports(t){if(void 0!==t)return e(t,(t=Object.create(null))=>this.wrapModuleImports(t))}wrapExportFn(e){let r=t.get(e);return void 0!==r||(r=async(...t)=>{this.assertNoneState();let r=e(...t);for(;1===this.getState();)this.exports.asyncify_stop_unwind(),this.value=await this.value,this.assertNoneState(),this.exports.asyncify_start_rewind(16),r=e();return this.assertNoneState(),r},t.set(e,r)),r}wrapExports(e){let r=Object.create(null);for(let t in e){let s=e[t];"function"!=typeof s||t.startsWith("asyncify_")||(s=this.wrapExportFn(s)),Object.defineProperty(r,t,{enumerable:!0,value:s});}return t.set(e,r),r}init(t,e){const{exports:r}=t,n=r.memory||e.env&&e.env.memory;new Int32Array(n.buffer,16).set([24,1024]),this.exports=this.wrapExports(r),Object.setPrototypeOf(t,s.prototype);}}class s extends WebAssembly.Instance{constructor(t,e){let s=new r;super(t,s.wrapImports(e)),s.init(this,e);}get exports(){return t.get(super.exports)}}async function n(t,e){let s=new r,n=await WebAssembly.instantiate(t,s.wrapImports(e));return s.init(n instanceof WebAssembly.Instance?n:n.instance,e),n}async function a(t,e){let s=new r,n=await WebAssembly.instantiateStreaming(t,s.wrapImports(e));return s.init(n.instance,e),n}Object.defineProperty(s.prototype,"exports",{enumerable:!0});

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  function _toPrimitive(input, hint) {
    if (_typeof(input) !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (_typeof(res) !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }

  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return _typeof(key) === "symbol" ? key : String(key);
  }

  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return _assertThisInitialized(self);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
  function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
  /*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
  */
  /**
   * BasePvFile Class
   * This class mocks the file system using in-memory storage.
   */
  var PvFile = /*#__PURE__*/function () {
    function PvFile() {
      _classCallCheck(this, PvFile);
      _defineProperty(this, "_path", void 0);
      _defineProperty(this, "_meta", void 0);
    }
    _createClass(PvFile, [{
      key: "meta",
      get:
      /**
       * Getter for file's meta information.
       */
      function get() {
        if (this._meta === undefined) {
          return undefined;
        }
        return _objectSpread$1({
          version: 0
        }, this._meta);
      }
      /**
       * Get the file pointer from the _filePtrs map.
       * @param ptr The pointer to BasePvFile instance to get from the map.
       * @returns BasePvFile returns the current file instance related to ptr.
       */
    }], [{
      key: "getPtr",
      value: function getPtr(ptr) {
        return PvFile._filePtrs.get(ptr);
      }
      /**
       * Saves the BasePvFile instance to the map with an associated ptr.
       * @param ptr The file pointer to save as the key.
       * @param instance The BasePvFile instance to save as the value.
       */
    }, {
      key: "setPtr",
      value: function setPtr(ptr, instance) {
        PvFile._filePtrs.set(ptr, instance);
      }
      /**
       * Removes the ptr from the _filePtrs map.
       * @param ptr The file pointer to remove.
       */
    }, {
      key: "removePtr",
      value: function removePtr(ptr) {
        PvFile._filePtrs["delete"](ptr);
      }
    }]);
    return PvFile;
  }();
  _defineProperty(PvFile, "_filePtrs", new Map());

  function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
  function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
  /**
   * Indexed DB configurations
   */
  var DB_NAME = 'pv_db';
  var PV_FILE_STORE = 'pv_file';
  var DB_VERSION = 3;
  /**
   * Helper to get IndexedDB.
   */
  function getDB() {
    return new Promise(function (resolve, reject) {
      var request = self.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = function () {
        reject(request.error);
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onupgradeneeded = function () {
        if (!request.result.objectStoreNames.contains(PV_FILE_STORE)) {
          request.result.createObjectStore(PV_FILE_STORE);
        }
      };
    });
  }
  /**
   * PvFile Class
   * This class mocks the file system using IndexedDB.
   * IndexedDB is REQUIRED.
   */
  var PvFileIDB = /*#__PURE__*/function (_PvFile) {
    _inherits(PvFileIDB, _PvFile);
    var _super = _createSuper$1(PvFileIDB);
    /**
     * Constructor of PvFile instance.
     * @param path The path of a file.
     * @param meta The metadata of the file.
     * @param db The db instance currently related to the opened file.
     * @param mode The mode - either readonly or readwrite.
     */
    function PvFileIDB(path, meta, db, mode) {
      var _this;
      _classCallCheck(this, PvFileIDB);
      _this = _super.call(this);
      _defineProperty(_assertThisInitialized(_this), "_pageSize", 65536);
      _defineProperty(_assertThisInitialized(_this), "_db", void 0);
      _defineProperty(_assertThisInitialized(_this), "_mode", void 0);
      _defineProperty(_assertThisInitialized(_this), "_pagePtr", 0);
      _defineProperty(_assertThisInitialized(_this), "_pageOffset", 0);
      _this._path = path;
      _this._meta = meta;
      _this._db = db;
      _this._mode = mode;
      return _this;
    }
    /**
     * Opens a file and return an instance of PvFile. A file can be opened in readonly or readwrite mode
     * which follows IndexedDB standard of reading and writing values to the db.
     * The file is stored as an Uint8Array separated by pages.
     * NOTE: The key exactly matching the path expects a value of type PvFileMeta.
     * @param path The path of the file to open stored in IndexedDB.
     * @param mode A string, if it contains 'r' in the string, it will open the file in readonly mode, else it
     * will open in readwrite mode.
     * @returns Promise<PvFile> An instance of PvFile.
     * @throws Error if IndexedDB is not supported.
     */
    _createClass(PvFileIDB, [{
      key: "close",
      value:
      /**
       * Closes the db connection. Any other instance function call will not work once
       * the db is closed.
       */
      function () {
        var _close = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
          return regenerator.wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                this._db.close();
              case 1:
              case "end":
                return _context.stop();
            }
          }, _callee, this);
        }));
        function close() {
          return _close.apply(this, arguments);
        }
        return close;
      }()
      /**
       * Reads a total of 'count' elements, each with a size of 'size' bytes from the current position in the stream.
       * Moves the stream by the amount of elements read.
       * If the last few bytes is smaller than 'size' it will not read (similar to fread) the bytes.
       * @param size The element size.
       * @param count The number of elements to read.
       * @returns Promise<Uint8Array> A Uint8Array with the elements copied to it.
       * @throws Error if file doesn't exist or if EOF.
       */
    }, {
      key: "read",
      value: function () {
        var _read = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(size, count) {
          var _this2 = this;
          return regenerator.wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", new Promise(function (resolve, reject) {
                  if (!_this2.exists()) {
                    reject(new Error("'".concat(_this2._path, "' doesn't exist.")));
                    return;
                  }
                  if (_this2._isEOF) {
                    var err = new Error("EOF");
                    err.name = "EndOfFile";
                    reject(err);
                    return;
                  }
                  var copied = 0;
                  var maxToCopy = Math.min(size * count, _this2._meta.size);
                  var totalElems = maxToCopy - maxToCopy % size;
                  var buffer = new Uint8Array(totalElems);
                  var keyRange = IDBKeyRange.bound("".concat(_this2._path, "-").concat(PvFileIDB.createPage(_this2._pagePtr)), "".concat(_this2._path, "-").concat(PvFileIDB.createPage(_this2._meta.numPages)));
                  var store = _this2._store;
                  var req = store.openCursor(keyRange);
                  req.onsuccess = function () {
                    var cursor = req.result;
                    if (!cursor || _this2._isEOF) {
                      return;
                    }
                    var toCopy = Math.min(totalElems - copied, cursor.value.length - _this2._pageOffset);
                    buffer.set(cursor.value.slice(_this2._pageOffset, _this2._pageOffset + toCopy), copied);
                    copied += toCopy;
                    _this2._pageOffset += toCopy;
                    if (_this2._pageOffset === _this2._pageSize) {
                      _this2._pagePtr += 1;
                      _this2._pageOffset = 0;
                    }
                    if (copied < totalElems) {
                      cursor["continue"]();
                    }
                  };
                  store.transaction.onerror = function () {
                    reject(store.transaction.error);
                  };
                  store.transaction.oncomplete = function () {
                    resolve(buffer.slice(0, copied));
                  };
                }));
              case 1:
              case "end":
                return _context2.stop();
            }
          }, _callee2);
        }));
        function read(_x, _x2) {
          return _read.apply(this, arguments);
        }
        return read;
      }()
      /**
       * Writes an Uint8Array to IndexedDB seperated by pages.
       * @param content The bytes to save.
       * @param version Version of the file.
       */
    }, {
      key: "write",
      value: function () {
        var _write = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(content) {
          var _this3 = this;
          var version,
            _args4 = arguments;
          return regenerator.wrap(function _callee4$(_context4) {
            while (1) switch (_context4.prev = _context4.next) {
              case 0:
                version = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : 1;
                return _context4.abrupt("return", new Promise( /*#__PURE__*/function () {
                  var _ref = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(resolve, reject) {
                    var store, getCurrentPage, last, newContent, newSize, newMeta, pages, i, keyRange;
                    return regenerator.wrap(function _callee3$(_context3) {
                      while (1) switch (_context3.prev = _context3.next) {
                        case 0:
                          if (!(_this3._mode === "readonly")) {
                            _context3.next = 3;
                            break;
                          }
                          reject(new Error("Instance is readonly mode only."));
                          return _context3.abrupt("return");
                        case 3:
                          if (!(typeof version !== "number" && version <= 0)) {
                            _context3.next = 6;
                            break;
                          }
                          reject(new Error("Version should be a positive number"));
                          return _context3.abrupt("return");
                        case 6:
                          store = _this3._store;
                          getCurrentPage = function getCurrentPage() {
                            return new Promise(function (res) {
                              var req = store.get("".concat(_this3._path, "-").concat(PvFileIDB.createPage(_this3._pagePtr)));
                              req.onsuccess = function () {
                                if (req.result !== undefined) {
                                  res(req.result.slice(0, _this3._pageOffset));
                                } else {
                                  res(new Uint8Array(0));
                                }
                              };
                            });
                          };
                          _context3.next = 10;
                          return getCurrentPage();
                        case 10:
                          last = _context3.sent;
                          newContent = new Uint8Array(last.length + content.length);
                          newContent.set(last);
                          newContent.set(content, last.length);
                          newSize = _this3._pagePtr * _this3._pageSize + newContent.length;
                          newMeta = {
                            size: newSize,
                            numPages: Math.ceil(newSize / _this3._pageSize),
                            version: version
                          };
                          store.put(newMeta, _this3._path);
                          pages = Math.ceil(newContent.length / _this3._pageSize);
                          for (i = 0; i < pages; i++) {
                            store.put(newContent.slice(i * _this3._pageSize, (i + 1) * _this3._pageSize), "".concat(_this3._path, "-").concat(PvFileIDB.createPage(_this3._pagePtr + i)));
                          }
                          if (_this3.exists() && newMeta.numPages < _this3._meta.numPages) {
                            keyRange = IDBKeyRange.bound("".concat(_this3._path, "-").concat(PvFileIDB.createPage(newMeta.numPages)), "".concat(_this3._path, "-").concat(PvFileIDB.createPage(_this3._meta.numPages)), true);
                            store["delete"](keyRange);
                          }
                          store.transaction.onerror = function () {
                            reject(store.transaction.error);
                          };
                          store.transaction.oncomplete = function () {
                            _this3._meta = newMeta;
                            _this3.seek(0, 2);
                            resolve();
                          };
                        case 22:
                        case "end":
                          return _context3.stop();
                      }
                    }, _callee3);
                  }));
                  return function (_x4, _x5) {
                    return _ref.apply(this, arguments);
                  };
                }()));
              case 2:
              case "end":
                return _context4.stop();
            }
          }, _callee4);
        }));
        function write(_x3) {
          return _write.apply(this, arguments);
        }
        return write;
      }()
      /**
       * Moves the current position in the stream by 'offset' elements at 'whence' position.
       * @param offset The number of bytes to move.
       * @param whence One of:
       *  - 0: moves position from beginning of file.
       *  - 1: moves position from current position in the stream.
       *  - 2: moves position from the last element of the file.
       * @throws Error if file doesn't exist or if EOF.
       */
    }, {
      key: "seek",
      value: function seek(offset, whence) {
        if (!this.exists() && this._mode === "readonly") {
          throw new Error("'".concat(this._path, "' doesn't exist."));
        }
        if (offset < 0) {
          var err = new Error("EOF");
          err.name = "EndOfFile";
          throw err;
        }
        var newOffset;
        if (whence === 0) {
          newOffset = Math.min(offset, this._meta.size);
        } else if (whence === 1) {
          var currentOffset = this._pageSize * this._pagePtr + this._pageOffset;
          newOffset = Math.min(currentOffset + offset, this._meta.size);
        } else if (whence === 2) {
          newOffset = Math.min(this._meta.size + offset, this._meta.size);
        } else {
          throw new Error("Invalid operation: ".concat(whence, "."));
        }
        this._pageOffset = newOffset % this._pageSize;
        this._pagePtr = Math.floor(newOffset / this._pageSize);
      }
      /**
       * Returns the number of bytes from the beginning of the file.
       */
    }, {
      key: "tell",
      value: function tell() {
        if (!this.exists()) {
          return -1;
        }
        return this._pagePtr * this._pageSize + this._pageOffset;
      }
      /**
       * Removes a file and any related pages given the path.
       */
    }, {
      key: "remove",
      value: function () {
        var _remove = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee6() {
          var _this4 = this;
          return regenerator.wrap(function _callee6$(_context6) {
            while (1) switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt("return", new Promise( /*#__PURE__*/function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee5(resolve, reject) {
                    var numPages, keyRange, store, req;
                    return regenerator.wrap(function _callee5$(_context5) {
                      while (1) switch (_context5.prev = _context5.next) {
                        case 0:
                          numPages = _this4._meta.numPages;
                          keyRange = IDBKeyRange.bound(_this4._path, "".concat(_this4._path, "-").concat(PvFileIDB.createPage(numPages)));
                          store = _this4._store;
                          req = store["delete"](keyRange);
                          req.onerror = function () {
                            reject(req.error);
                          };
                          req.onsuccess = function () {
                            _this4._meta = undefined;
                            _this4._pageOffset = 0;
                            _this4._pagePtr = 0;
                            resolve();
                          };
                        case 6:
                        case "end":
                          return _context5.stop();
                      }
                    }, _callee5);
                  }));
                  return function (_x6, _x7) {
                    return _ref2.apply(this, arguments);
                  };
                }()));
              case 1:
              case "end":
                return _context6.stop();
            }
          }, _callee6);
        }));
        function remove() {
          return _remove.apply(this, arguments);
        }
        return remove;
      }()
      /**
       * Checks if the following path exists.
       */
    }, {
      key: "exists",
      value: function exists() {
        return this._meta !== undefined;
      }
      /**
       * Checks if the current stream is EOF.
       */
    }, {
      key: "_isEOF",
      get: function get() {
        return this._pagePtr >= this._meta.numPages - 1 && this._pageOffset >= this._meta.size % this._pageSize;
      }
      /**
       * Creates an index which as a key to save page data to IndexedDB.
       * This formats the file into 0000, 0001, 0002 ...
       * @param page The page number to format.
       */
    }, {
      key: "_store",
      get:
      /**
       * Gets a objectStore instance from the PvFile instance.
       */
      function get() {
        return this._db.transaction(PV_FILE_STORE, this._mode).objectStore(PV_FILE_STORE);
      }
    }], [{
      key: "open",
      value: function open(path, mode) {
        if (!self.indexedDB) {
          var error = new Error("IndexedDB is not supported");
          error.name = "IndexedDBNotSupported";
          throw error;
        }
        return new Promise( /*#__PURE__*/function () {
          var _ref3 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee7(resolve, reject) {
            var db, req, _error2;
            return regenerator.wrap(function _callee7$(_context7) {
              while (1) switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.prev = 0;
                  _context7.next = 3;
                  return getDB();
                case 3:
                  db = _context7.sent;
                  req = db.transaction(PV_FILE_STORE, "readwrite").objectStore(PV_FILE_STORE).get(path);
                  req.onerror = function () {
                    reject(req.error);
                  };
                  req.onsuccess = function () {
                    var meta = req.result;
                    var dbMode = mode.includes('r') ? "readonly" : "readwrite";
                    if (meta === undefined && dbMode === "readonly") {
                      var _error = new Error("'".concat(path, "' doesn't exist."));
                      _error.name = "FileNotExists";
                      reject(_error);
                      return;
                    }
                    var fileIDB = new PvFileIDB(path, meta, db, dbMode);
                    if (mode.includes('a')) {
                      fileIDB.seek(0, 2);
                    }
                    resolve(fileIDB);
                  };
                  _context7.next = 12;
                  break;
                case 9:
                  _context7.prev = 9;
                  _context7.t0 = _context7["catch"](0);
                  if (_context7.t0.name === "InvalidStateError") {
                    _error2 = new Error("IndexedDB is not supported");
                    _error2.name = "IndexedDBNotSupported";
                    reject(_error2);
                  } else {
                    reject(_context7.t0);
                  }
                case 12:
                case "end":
                  return _context7.stop();
              }
            }, _callee7, null, [[0, 9]]);
          }));
          return function (_x8, _x9) {
            return _ref3.apply(this, arguments);
          };
        }());
      }
    }, {
      key: "createPage",
      value: function createPage(page) {
        return ("000" + page).slice(-4);
      }
    }]);
    return PvFileIDB;
  }(PvFile);

  function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
  function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
  /**
   * PvFileMem Class
   * This class mocks the file system using in-memory storage.
   */
  var PvFileMem = /*#__PURE__*/function (_PvFile) {
    _inherits(PvFileMem, _PvFile);
    var _super = _createSuper(PvFileMem);
    function PvFileMem(path, meta, db, mode) {
      var _this;
      _classCallCheck(this, PvFileMem);
      _this = _super.call(this);
      _defineProperty(_assertThisInitialized(_this), "_pos", 0);
      _defineProperty(_assertThisInitialized(_this), "_mode", void 0);
      _this._path = path;
      _this._meta = meta;
      _this._mode = mode;
      return _this;
    }
    _createClass(PvFileMem, [{
      key: "close",
      value: function close() {
        return;
      }
    }, {
      key: "read",
      value: function read(size, count) {
        if (!this.exists()) {
          throw new Error("'".concat(this._path, "' doesn't exist."));
        }
        if (this._isEOF) {
          var err = new Error("EOF");
          err.name = "EndOfFile";
          throw err;
        }
        var toCopy = Math.min(size * count, this._file.length - this._pos);
        var totalElems = toCopy - toCopy % size;
        var buffer = new Uint8Array(totalElems);
        buffer.set(this._file.slice(this._pos, this._pos + totalElems), 0);
        this._pos += totalElems;
        return buffer;
      }
    }, {
      key: "write",
      value: function write(content) {
        var newFile = new Uint8Array(this._pos + content.length);
        if (this._file !== undefined) {
          newFile.set(this._file.slice(0, this._pos));
          newFile.set(content, this._pos);
        } else {
          newFile.set(content);
        }
        this._file = newFile;
        this._pos += content.length;
      }
    }, {
      key: "seek",
      value: function seek(offset, whence) {
        if (!this.exists() && this._mode === "readonly") {
          throw new Error("'".concat(this._path, "' doesn't exist."));
        }
        if (offset < 0) {
          var err = new Error("EOF");
          err.name = "EndOfFile";
          throw err;
        }
        var newOffset;
        if (whence === 0) {
          newOffset = Math.min(offset, this._file.length);
        } else if (whence === 1) {
          newOffset = Math.min(this._pos + offset, this._file.length);
        } else if (whence === 2) {
          newOffset = Math.min(this._file.length + offset, this._file.length);
        } else {
          throw new Error("Invalid operation: ".concat(whence, "."));
        }
        this._pos = newOffset;
      }
    }, {
      key: "tell",
      value: function tell() {
        if (!this.exists()) {
          return -1;
        }
        return this._pos;
      }
    }, {
      key: "remove",
      value: function () {
        var _remove = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
          return regenerator.wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                PvFileMem._memFiles["delete"](this._path);
                this._file = undefined;
                this._pos = 0;
              case 3:
              case "end":
                return _context.stop();
            }
          }, _callee, this);
        }));
        function remove() {
          return _remove.apply(this, arguments);
        }
        return remove;
      }()
    }, {
      key: "exists",
      value: function exists() {
        return this._file !== undefined;
      }
    }, {
      key: "_isEOF",
      get: function get() {
        return this._pos >= this._file.length;
      }
    }, {
      key: "_file",
      get: function get() {
        return PvFileMem._memFiles.get(this._path);
      },
      set: function set(content) {
        PvFileMem._memFiles.set(this._path, content);
      }
    }], [{
      key: "open",
      value: function open(path, mode) {
        var file = PvFileMem._memFiles.get(path);
        var dbMode = mode.includes('r') ? "readonly" : "readwrite";
        if (file === undefined && dbMode === "readonly") {
          var error = new Error("'".concat(path, "' doesn't exist."));
          error.name = "FileNotExists";
          throw error;
        }
        var fileMem = new PvFileMem(path, undefined, undefined, dbMode);
        if (mode.includes('a')) {
          fileMem.seek(0, 2);
        }
        return fileMem;
      }
    }]);
    return PvFileMem;
  }(PvFile);
  _defineProperty(PvFileMem, "_memFiles", new Map());

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
  function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }
  function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
  /**
   * Convert a null terminated phrase stored inside an array buffer to a string
   *
   * @param arrayBuffer input array buffer
   * @param indexStart the index at which the phrase is stored
   * @return retrieved string
   */
  function arrayBufferToStringAtIndex(arrayBuffer, indexStart) {
    var indexEnd = indexStart;
    while (arrayBuffer[indexEnd] !== 0) {
      indexEnd++;
    }
    var utf8decoder = new TextDecoder('utf-8');
    return utf8decoder.decode(arrayBuffer.subarray(indexStart, indexEnd));
  }
  /**
   * Decode a base64 string and stored it in a Uint8Array array
   *
   * @param base64String input base64 string
   * @return decoded array
   */
  function base64ToUint8Array(base64String) {
    var base64StringDecoded = atob(base64String);
    var binaryArray = new Uint8Array(base64StringDecoded.length);
    for (var i = 0; i < base64StringDecoded.length; i++) {
      binaryArray[i] = base64StringDecoded.charCodeAt(i);
    }
    return binaryArray;
  }
  /**
   * Encode an ArrayBuffer array to base64 string
   *
   * @param arrayBuffer input array
   * @param size size of the phrase to be encoded
   * @param index the index at which the phrase is stored
   * @return base64 string
   */
  function arrayBufferToBase64AtIndex(arrayBuffer, size, index) {
    var binary = '';
    for (var i = 0; i < size; i++) {
      // @ts-ignore
      binary += String.fromCharCode(arrayBuffer[index + i]);
    }
    return btoa(binary);
  }
  /**
   * Convert a string header to JS object
   *
   * @param stringHeader input string in json format
   * @return retrieved object
   */
  // eslint-disable-next-line
  function stringHeaderToObject(stringHeader) {
    var objectHeader = {};
    var _iterator = _createForOfIteratorHelper(stringHeader.split('\r\n')),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var property = _step.value;
        var keyValuePair = property.split(': ');
        if (keyValuePair[0] !== '') {
          // @ts-ignore
          objectHeader[keyValuePair[0]] = keyValuePair[1];
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return objectHeader;
  }
  /**
   * A wrapper to fetch that also supports timeout
   *
   * @param uri the URL of the resource
   * @param options other options related to fetch
   * @param time timeout value
   * @return received response
   */
  function fetchWithTimeout(_x) {
    return _fetchWithTimeout.apply(this, arguments);
  }
  /**
   * Checking whether the given AccessKey is valid
   *
   * @return true if the AccessKey is valid, false if not
   */
  function _fetchWithTimeout() {
    _fetchWithTimeout = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(uri) {
      var options,
        time,
        controller,
        config,
        timeout,
        response,
        _args = arguments;
      return regenerator.wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            time = _args.length > 2 && _args[2] !== undefined ? _args[2] : 5000;
            controller = new AbortController();
            config = _objectSpread(_objectSpread({}, options), {}, {
              signal: controller.signal
            });
            timeout = setTimeout(function () {
              controller.abort();
            }, time);
            _context.next = 7;
            return fetch(uri, config);
          case 7:
            response = _context.sent;
            clearTimeout(timeout);
            return _context.abrupt("return", response);
          case 10:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return _fetchWithTimeout.apply(this, arguments);
  }
  function isAccessKeyValid(accessKey) {
    if (typeof accessKey !== 'string') {
      return false;
    }
    var accessKeyCleaned = accessKey.trim();
    if (accessKeyCleaned === '') {
      return false;
    }
    try {
      return btoa(atob(accessKeyCleaned)) === accessKeyCleaned;
    } catch (err) {
      return false;
    }
  }
  /**
   * Opens the file given the path and mode.
   * @returns PvFile instance.
   */
  function open(_x2, _x3) {
    return _open.apply(this, arguments);
  }
  /**
   * PvFile helper.
   * Write modelBase64 to modelPath depending on options forceWrite and version.
   */
  function _open() {
    _open = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(path, mode) {
      var error;
      return regenerator.wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return PvFileIDB.open(path, mode);
          case 3:
            return _context2.abrupt("return", _context2.sent);
          case 6:
            _context2.prev = 6;
            _context2.t0 = _context2["catch"](0);
            if (_context2.t0.name === 'IndexedDBNotSupported') {
              // eslint-disable-next-line no-console
              console.warn('IndexedDB is not supported. Fallback to in-memory storage.');
            } else if (_context2.t0.name !== 'FileNotExists') {
              // eslint-disable-next-line no-console
              console.warn("Unable to access IndexedDB (".concat(_context2.t0.toString(), "). Fallback to in-memory storage."));
            }
            if (!(
            // @ts-ignore
            typeof WorkerGlobalScope !== 'undefined' &&
            // @ts-ignore
            self instanceof WorkerGlobalScope)) {
              _context2.next = 16;
              break;
            }
            if (!(_context2.t0.name === 'FileNotExists')) {
              _context2.next = 12;
              break;
            }
            throw _context2.t0;
          case 12:
            // eslint-disable-next-line no-console
            console.error('In-memory storage cannot be used inside a worker.');
            error = new Error("Failed to start PvFile: ".concat(_context2.t0.toString()));
            error.name = 'PvFileNotSupported';
            throw error;
          case 16:
            return _context2.abrupt("return", PvFileMem.open(path, mode));
          case 17:
          case "end":
            return _context2.stop();
        }
      }, _callee2, null, [[0, 6]]);
    }));
    return _open.apply(this, arguments);
  }
  function fromBase64(_x4, _x5, _x6, _x7) {
    return _fromBase.apply(this, arguments);
  }
  function _fromBase() {
    _fromBase = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(modelPath, modelBase64, forceWrite, version) {
      var pvFile;
      return regenerator.wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return open(modelPath, 'w');
          case 2:
            pvFile = _context3.sent;
            if (!(forceWrite || pvFile.meta === undefined || version > pvFile.meta.version)) {
              _context3.next = 6;
              break;
            }
            _context3.next = 6;
            return pvFile.write(base64ToUint8Array(modelBase64), version);
          case 6:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    return _fromBase.apply(this, arguments);
  }
  var BACKOFF_CAP_MILLISECONDS = 5000;
  var BACKOFF_START_MILLISECONDS = 2;
  /**
   * PvFile helper.
   * Write publicPath's model to modelPath depending on options forceWrite and version.
   */
  function fromPublicDirectory(_x8, _x9, _x10, _x11, _x12) {
    return _fromPublicDirectory.apply(this, arguments);
  }
  /**
   * Takes a Picovoice model file and either decodes it from base64 or fetches
   * it from the public directory. Saves the result to storage on version increase or
   * if forceWrite is enabled.
   */
  function _fromPublicDirectory() {
    _fromPublicDirectory = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(modelPath, publicPath, forceWrite, version, numFetchReties) {
      var pvFile, waitTimeMilliseconds, delay, numAttemptsLeft, error, response, data, responseText;
      return regenerator.wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return open(modelPath, 'w');
          case 2:
            pvFile = _context4.sent;
            if (!(forceWrite || pvFile.meta === undefined || version > pvFile.meta.version)) {
              _context4.next = 43;
              break;
            }
            if (!(numFetchReties < 0)) {
              _context4.next = 6;
              break;
            }
            throw Error('numFetchRetries must be a positive number');
          case 6:
            waitTimeMilliseconds = BACKOFF_START_MILLISECONDS;
            delay = function delay(delayMilliseconds) {
              return new Promise(function (resolve) {
                setTimeout(resolve, delayMilliseconds);
              });
            };
            numAttemptsLeft = numFetchReties + 1;
            error = null;
          case 10:
            if (!(numAttemptsLeft > 0)) {
              _context4.next = 38;
              break;
            }
            error = null;
            _context4.prev = 12;
            _context4.next = 15;
            return fetch(publicPath, {
              cache: 'no-cache'
            });
          case 15:
            response = _context4.sent;
            if (!response.ok) {
              _context4.next = 23;
              break;
            }
            _context4.next = 19;
            return response.arrayBuffer();
          case 19:
            data = _context4.sent;
            _context4.next = 22;
            return pvFile.write(new Uint8Array(data), version);
          case 22:
            return _context4.abrupt("return");
          case 23:
            _context4.next = 25;
            return response.text();
          case 25:
            responseText = _context4.sent;
            error = new Error("Error response returned while fetching model from '".concat(publicPath, "': ").concat(responseText));
            _context4.next = 32;
            break;
          case 29:
            _context4.prev = 29;
            _context4.t0 = _context4["catch"](12);
            error = new Error("Failed to fetch model from '".concat(publicPath, "': ").concat(_context4.t0.message));
          case 32:
            numAttemptsLeft--;
            _context4.next = 35;
            return delay(waitTimeMilliseconds);
          case 35:
            waitTimeMilliseconds = Math.min(BACKOFF_CAP_MILLISECONDS, waitTimeMilliseconds * BACKOFF_START_MILLISECONDS);
            _context4.next = 10;
            break;
          case 38:
            if (!(error !== null)) {
              _context4.next = 42;
              break;
            }
            throw error;
          case 42:
            throw new Error("Unexpected error encountered while fetching model from '".concat(publicPath, "'"));
          case 43:
          case "end":
            return _context4.stop();
        }
      }, _callee4, null, [[12, 29]]);
    }));
    return _fromPublicDirectory.apply(this, arguments);
  }
  function loadModel(_x13) {
    return _loadModel.apply(this, arguments);
  }
  function _loadModel() {
    _loadModel = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee5(model) {
      var base64, publicPath, customWritePath, _model$forceWrite, forceWrite, _model$version, version, _model$numFetchRetrie, numFetchRetries;
      return regenerator.wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            if (!(model === undefined || model === null)) {
              _context5.next = 2;
              break;
            }
            throw new Error('The model is undefined / empty');
          case 2:
            base64 = model.base64, publicPath = model.publicPath, customWritePath = model.customWritePath, _model$forceWrite = model.forceWrite, forceWrite = _model$forceWrite === void 0 ? false : _model$forceWrite, _model$version = model.version, version = _model$version === void 0 ? 1 : _model$version, _model$numFetchRetrie = model.numFetchRetries, numFetchRetries = _model$numFetchRetrie === void 0 ? 0 : _model$numFetchRetrie;
            if (!(customWritePath === undefined || customWritePath === null)) {
              _context5.next = 5;
              break;
            }
            throw new Error('The customWritePath of the provided model is undefined / empty');
          case 5:
            if (!(base64 !== undefined && base64 !== null)) {
              _context5.next = 10;
              break;
            }
            _context5.next = 8;
            return fromBase64(customWritePath, base64, forceWrite, version);
          case 8:
            _context5.next = 16;
            break;
          case 10:
            if (!(publicPath !== undefined && publicPath !== null)) {
              _context5.next = 15;
              break;
            }
            _context5.next = 13;
            return fromPublicDirectory(customWritePath, publicPath, forceWrite, version, numFetchRetries);
          case 13:
            _context5.next = 16;
            break;
          case 15:
            throw new Error("The provided model doesn't contain a valid publicPath or base64 value");
          case 16:
            return _context5.abrupt("return", customWritePath);
          case 17:
          case "end":
            return _context5.stop();
        }
      }, _callee5);
    }));
    return _loadModel.apply(this, arguments);
  }

  /*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
  */
  /* eslint camelcase: 0, arrow-body-style: 0, @typescript-eslint/no-unused-vars: 0, @typescript-eslint/explicit-module-boundary-types: 0 */
  var wasiSnapshotPreview1Emulator = {
    args_get: function args_get(input) {
      return 0;
    },
    args_sizes_get: function args_sizes_get(input) {
      return 0;
    },
    environ_get: function environ_get(input) {
      return 0;
    },
    environ_sizes_get: function environ_sizes_get(input) {
      return 0;
    },
    clock_res_get: function clock_res_get(input) {
      return 0;
    },
    clock_time_get: function clock_time_get(input) {
      return 0;
    },
    fd_advise: function fd_advise(input) {
      return 0;
    },
    fd_allocate: function fd_allocate(input) {
      return 0;
    },
    fd_close: function fd_close(input) {
      return 0;
    },
    fd_datasync: function fd_datasync(input) {
      return 0;
    },
    fd_fdstat_get: function fd_fdstat_get(input) {
      return 0;
    },
    fd_fdstat_set_flags: function fd_fdstat_set_flags(input) {
      return 0;
    },
    fd_fdstat_set_rights: function fd_fdstat_set_rights(input) {
      return 0;
    },
    fd_filestat_get: function fd_filestat_get(input) {
      return 0;
    },
    fd_filestat_set_size: function fd_filestat_set_size(input) {
      return 0;
    },
    fd_filestat_set_times: function fd_filestat_set_times(input) {
      return 0;
    },
    fd_pread: function fd_pread(input) {
      return 0;
    },
    fd_prestat_get: function fd_prestat_get(input) {
      return 0;
    },
    fd_prestat_dir_name: function fd_prestat_dir_name(input) {
      return 0;
    },
    fd_pwrite: function fd_pwrite(input) {
      return 0;
    },
    fd_read: function fd_read(input) {
      return 0;
    },
    fd_readdir: function fd_readdir(input) {
      return 0;
    },
    fd_renumber: function fd_renumber(input) {
      return 0;
    },
    fd_seek: function fd_seek(input) {
      return 0;
    },
    fd_sync: function fd_sync(input) {
      return 0;
    },
    fd_tell: function fd_tell(input) {
      return 0;
    },
    fd_write: function fd_write(input) {
      return 0;
    },
    path_create_directory: function path_create_directory(input) {
      return 0;
    },
    path_filestat_get: function path_filestat_get(input) {
      return 0;
    },
    path_filestat_set_times: function path_filestat_set_times(input) {
      return 0;
    },
    path_link: function path_link(input) {
      return 0;
    },
    path_open: function path_open(input) {
      return 0;
    },
    path_readlink: function path_readlink(input) {
      return 0;
    },
    path_remove_directory: function path_remove_directory(input) {
      return 0;
    },
    path_rename: function path_rename(input) {
      return 0;
    },
    path_symlink: function path_symlink(input) {
      return 0;
    },
    path_unlink_file: function path_unlink_file(input) {
      return 0;
    },
    poll_oneoff: function poll_oneoff(input) {
      return 0;
    },
    proc_exit: function proc_exit(input) {
      return 0;
    },
    proc_raise: function proc_raise(input) {
      return 0;
    },
    sched_yield: function sched_yield(input) {
      return 0;
    },
    random_get: function random_get(input) {
      return 0;
    },
    sock_recv: function sock_recv(input) {
      return 0;
    },
    sock_send: function sock_send(input) {
      return 0;
    },
    sock_shutdown: function sock_shutdown(input) {
      return 0;
    }
  };

  /**
   * Imports and Exports functions required for WASM.
   *
   * @param memory Initialized WebAssembly memory object.
   * @param wasm The wasm file in base64 string or stream to public path (i.e. fetch("file.wasm")) to initialize.
   * @param pvError The PvError object to store error details.
   * @returns An object containing the exported functions from WASM.
   */
  function buildWasm(_x, _x2, _x3) {
    return _buildWasm.apply(this, arguments);
  }
  function _buildWasm() {
    _buildWasm = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee9(memory, wasm, pvError) {
      var memoryBufferUint8, memoryBufferInt32, pvConsoleLogWasm, pvAssertWasm, pvTimeWasm, pvHttpsRequestWasm, pvGetBrowserInfo, pvGetOriginInfo, pvFileOpenWasm, pvFileCloseWasm, pvFileReadWasm, pvFileWriteWasm, pvFileSeekWasm, pvFileTellWasm, pvFileRemoveWasm, importObject, instance, response, data, wasmCodeArray, aligned_alloc;
      return regenerator.wrap(function _callee9$(_context9) {
        while (1) switch (_context9.prev = _context9.next) {
          case 0:
            memoryBufferUint8 = new Uint8Array(memory.buffer);
            memoryBufferInt32 = new Int32Array(memory.buffer);
            pvConsoleLogWasm = function pvConsoleLogWasm(index) {
              // eslint-disable-next-line no-console
              console.log(arrayBufferToStringAtIndex(memoryBufferUint8, index));
            };
            pvAssertWasm = function pvAssertWasm(expr, line, fileNameAddress) {
              if (expr === 0) {
                var fileName = arrayBufferToStringAtIndex(memoryBufferUint8, fileNameAddress);
                throw new Error("assertion failed at line ".concat(line, " in \"").concat(fileName, "\""));
              }
            };
            pvTimeWasm = function pvTimeWasm() {
              return Date.now() / 1000;
            };
            pvHttpsRequestWasm = /*#__PURE__*/function () {
              var _ref = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(httpMethodAddress, serverNameAddress, endpointAddress, headerAddress, bodyAddress, timeoutMs, responseAddressAddress, responseSizeAddress, responseCodeAddress) {
                var httpMethod, serverName, endpoint, header, body, headerObject, response, responseText, statusCode, responseAddress, i;
                return regenerator.wrap(function _callee$(_context) {
                  while (1) switch (_context.prev = _context.next) {
                    case 0:
                      httpMethod = arrayBufferToStringAtIndex(memoryBufferUint8, httpMethodAddress);
                      serverName = arrayBufferToStringAtIndex(memoryBufferUint8, serverNameAddress);
                      endpoint = arrayBufferToStringAtIndex(memoryBufferUint8, endpointAddress);
                      header = arrayBufferToStringAtIndex(memoryBufferUint8, headerAddress);
                      body = arrayBufferToStringAtIndex(memoryBufferUint8, bodyAddress);
                      headerObject = stringHeaderToObject(header);
                      _context.prev = 6;
                      _context.next = 9;
                      return fetchWithTimeout('https://' + serverName + endpoint, {
                        method: httpMethod,
                        headers: headerObject,
                        body: body
                      }, timeoutMs);
                    case 9:
                      response = _context.sent;
                      statusCode = response.status;
                      _context.next = 17;
                      break;
                    case 13:
                      _context.prev = 13;
                      _context.t0 = _context["catch"](6);
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvHttpsRequestWasm', "Failed to fetch: ".concat(_context.t0));
                      return _context.abrupt("return");
                    case 17:
                      _context.prev = 17;
                      _context.next = 20;
                      return response.text();
                    case 20:
                      responseText = _context.sent;
                      _context.next = 27;
                      break;
                    case 23:
                      _context.prev = 23;
                      _context.t1 = _context["catch"](17);
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvHttpsRequestWasm', "Failed to get response text: ".concat(_context.t1));
                      return _context.abrupt("return");
                    case 27:
                      _context.next = 29;
                      return aligned_alloc(Int8Array.BYTES_PER_ELEMENT, (responseText.length + 1) * Int8Array.BYTES_PER_ELEMENT);
                    case 29:
                      responseAddress = _context.sent;
                      if (!(responseAddress === 0)) {
                        _context.next = 34;
                        break;
                      }
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvMallocError', "pvHttpsRequestWasm: cannot allocate memory for response");
                      memoryBufferInt32[responseAddressAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
                      return _context.abrupt("return");
                    case 34:
                      memoryBufferInt32[responseSizeAddress / Int32Array.BYTES_PER_ELEMENT] = responseText.length + 1;
                      memoryBufferInt32[responseAddressAddress / Int32Array.BYTES_PER_ELEMENT] = responseAddress;
                      for (i = 0; i < responseText.length; i++) {
                        memoryBufferUint8[responseAddress + i] = responseText.charCodeAt(i);
                      }
                      memoryBufferUint8[responseAddress + responseText.length] = 0;
                      memoryBufferInt32[responseCodeAddress / Int32Array.BYTES_PER_ELEMENT] = statusCode;
                    case 39:
                    case "end":
                      return _context.stop();
                  }
                }, _callee, null, [[6, 13], [17, 23]]);
              }));
              return function pvHttpsRequestWasm(_x4, _x5, _x6, _x7, _x8, _x9, _x10, _x11, _x12) {
                return _ref.apply(this, arguments);
              };
            }();
            pvGetBrowserInfo = /*#__PURE__*/function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(browserInfoAddressAddress) {
                var userAgent, browserInfoAddress, i;
                return regenerator.wrap(function _callee2$(_context2) {
                  while (1) switch (_context2.prev = _context2.next) {
                    case 0:
                      userAgent = navigator.userAgent !== undefined ? navigator.userAgent : 'unknown'; // eslint-disable-next-line
                      _context2.next = 3;
                      return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, (userAgent.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
                    case 3:
                      browserInfoAddress = _context2.sent;
                      if (!(browserInfoAddress === 0)) {
                        _context2.next = 8;
                        break;
                      }
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvMallocError', "pvGetBrowserInfo: cannot allocate memory for browser info");
                      memoryBufferInt32[browserInfoAddressAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
                      return _context2.abrupt("return");
                    case 8:
                      memoryBufferInt32[browserInfoAddressAddress / Int32Array.BYTES_PER_ELEMENT] = browserInfoAddress;
                      for (i = 0; i < userAgent.length; i++) {
                        memoryBufferUint8[browserInfoAddress + i] = userAgent.charCodeAt(i);
                      }
                      memoryBufferUint8[browserInfoAddress + userAgent.length] = 0;
                    case 11:
                    case "end":
                      return _context2.stop();
                  }
                }, _callee2);
              }));
              return function pvGetBrowserInfo(_x13) {
                return _ref2.apply(this, arguments);
              };
            }();
            pvGetOriginInfo = /*#__PURE__*/function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(originInfoAddressAddress) {
                var _self$origin;
                var origin, hostname, originInfoAddress, i;
                return regenerator.wrap(function _callee3$(_context3) {
                  while (1) switch (_context3.prev = _context3.next) {
                    case 0:
                      origin = (_self$origin = self.origin) !== null && _self$origin !== void 0 ? _self$origin : self.location.origin;
                      hostname = new URL(origin).hostname; // eslint-disable-next-line
                      _context3.next = 4;
                      return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, (hostname.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
                    case 4:
                      originInfoAddress = _context3.sent;
                      if (!(originInfoAddress === 0)) {
                        _context3.next = 9;
                        break;
                      }
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvMallocError', "pvGetOriginInfo: cannot allocate memory for origin info");
                      memoryBufferInt32[originInfoAddressAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
                      return _context3.abrupt("return");
                    case 9:
                      memoryBufferInt32[originInfoAddressAddress / Int32Array.BYTES_PER_ELEMENT] = originInfoAddress;
                      for (i = 0; i < hostname.length; i++) {
                        memoryBufferUint8[originInfoAddress + i] = hostname.charCodeAt(i);
                      }
                      memoryBufferUint8[originInfoAddress + hostname.length] = 0;
                    case 12:
                    case "end":
                      return _context3.stop();
                  }
                }, _callee3);
              }));
              return function pvGetOriginInfo(_x14) {
                return _ref3.apply(this, arguments);
              };
            }();
            pvFileOpenWasm = /*#__PURE__*/function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(fileAddress, pathAddress, modeAddress, statusAddress) {
                var path, mode, file;
                return regenerator.wrap(function _callee4$(_context4) {
                  while (1) switch (_context4.prev = _context4.next) {
                    case 0:
                      path = arrayBufferToStringAtIndex(memoryBufferUint8, pathAddress);
                      mode = arrayBufferToStringAtIndex(memoryBufferUint8, modeAddress);
                      _context4.prev = 2;
                      _context4.next = 5;
                      return open(path, mode);
                    case 5:
                      file = _context4.sent;
                      PvFile.setPtr(fileAddress, file);
                      memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
                      _context4.next = 14;
                      break;
                    case 10:
                      _context4.prev = 10;
                      _context4.t0 = _context4["catch"](2);
                      if (_context4.t0.name !== "FileNotExists") {
                        pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileOpenWasm', _context4.t0);
                      }
                      memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = -1;
                    case 14:
                    case "end":
                      return _context4.stop();
                  }
                }, _callee4, null, [[2, 10]]);
              }));
              return function pvFileOpenWasm(_x15, _x16, _x17, _x18) {
                return _ref4.apply(this, arguments);
              };
            }();
            pvFileCloseWasm = /*#__PURE__*/function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee5(fileAddress, statusAddress) {
                var file;
                return regenerator.wrap(function _callee5$(_context5) {
                  while (1) switch (_context5.prev = _context5.next) {
                    case 0:
                      _context5.prev = 0;
                      _context5.next = 3;
                      return PvFile.getPtr(fileAddress);
                    case 3:
                      file = _context5.sent;
                      _context5.next = 6;
                      return file.close();
                    case 6:
                      memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
                      _context5.next = 13;
                      break;
                    case 9:
                      _context5.prev = 9;
                      _context5.t0 = _context5["catch"](0);
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileCloseWasm', _context5.t0);
                      memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = -1;
                    case 13:
                    case "end":
                      return _context5.stop();
                  }
                }, _callee5, null, [[0, 9]]);
              }));
              return function pvFileCloseWasm(_x19, _x20) {
                return _ref5.apply(this, arguments);
              };
            }();
            pvFileReadWasm = /*#__PURE__*/function () {
              var _ref6 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee6(fileAddress, contentAddress, size, count, numReadAddress) {
                var file, content;
                return regenerator.wrap(function _callee6$(_context6) {
                  while (1) switch (_context6.prev = _context6.next) {
                    case 0:
                      _context6.prev = 0;
                      _context6.next = 3;
                      return PvFile.getPtr(fileAddress);
                    case 3:
                      file = _context6.sent;
                      _context6.next = 6;
                      return file.read(size, count);
                    case 6:
                      content = _context6.sent;
                      memoryBufferUint8.set(content, contentAddress);
                      memoryBufferInt32[numReadAddress / Int32Array.BYTES_PER_ELEMENT] = content.length / size;
                      _context6.next = 15;
                      break;
                    case 11:
                      _context6.prev = 11;
                      _context6.t0 = _context6["catch"](0);
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileReadWasm', _context6.t0);
                      memoryBufferInt32[numReadAddress / Int32Array.BYTES_PER_ELEMENT] = -1;
                    case 15:
                    case "end":
                      return _context6.stop();
                  }
                }, _callee6, null, [[0, 11]]);
              }));
              return function pvFileReadWasm(_x21, _x22, _x23, _x24, _x25) {
                return _ref6.apply(this, arguments);
              };
            }();
            pvFileWriteWasm = /*#__PURE__*/function () {
              var _ref7 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee7(fileAddress, contentAddress, size, count, numWriteAddress) {
                var file, content;
                return regenerator.wrap(function _callee7$(_context7) {
                  while (1) switch (_context7.prev = _context7.next) {
                    case 0:
                      _context7.prev = 0;
                      _context7.next = 3;
                      return PvFile.getPtr(fileAddress);
                    case 3:
                      file = _context7.sent;
                      content = new Uint8Array(size * count);
                      content.set(memoryBufferUint8.slice(contentAddress, contentAddress + size * count), 0);
                      _context7.next = 8;
                      return file.write(content);
                    case 8:
                      memoryBufferInt32[numWriteAddress / Int32Array.BYTES_PER_ELEMENT] = content.length / size;
                      _context7.next = 15;
                      break;
                    case 11:
                      _context7.prev = 11;
                      _context7.t0 = _context7["catch"](0);
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileWriteWasm', _context7.t0);
                      memoryBufferInt32[numWriteAddress / Int32Array.BYTES_PER_ELEMENT] = 1;
                    case 15:
                    case "end":
                      return _context7.stop();
                  }
                }, _callee7, null, [[0, 11]]);
              }));
              return function pvFileWriteWasm(_x26, _x27, _x28, _x29, _x30) {
                return _ref7.apply(this, arguments);
              };
            }();
            pvFileSeekWasm = function pvFileSeekWasm(fileAddress, offset, whence, statusAddress) {
              try {
                var file = PvFile.getPtr(fileAddress);
                file.seek(offset, whence);
                memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
              } catch (e) {
                pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileSeekWasm', e);
                memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = -1;
              }
            };
            pvFileTellWasm = function pvFileTellWasm(fileAddress, offsetAddress) {
              try {
                var file = PvFile.getPtr(fileAddress);
                memoryBufferInt32[offsetAddress / Int32Array.BYTES_PER_ELEMENT] = file.tell();
              } catch (e) {
                pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileTellWasm', e);
                memoryBufferInt32[offsetAddress / Int32Array.BYTES_PER_ELEMENT] = -1;
              }
            };
            pvFileRemoveWasm = /*#__PURE__*/function () {
              var _ref8 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee8(pathAddress, statusAddress) {
                var path, file;
                return regenerator.wrap(function _callee8$(_context8) {
                  while (1) switch (_context8.prev = _context8.next) {
                    case 0:
                      path = arrayBufferToStringAtIndex(memoryBufferUint8, pathAddress);
                      _context8.prev = 1;
                      _context8.next = 4;
                      return open(path, "w");
                    case 4:
                      file = _context8.sent;
                      _context8.next = 7;
                      return file.remove();
                    case 7:
                      memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = 0;
                      _context8.next = 14;
                      break;
                    case 10:
                      _context8.prev = 10;
                      _context8.t0 = _context8["catch"](1);
                      pvError === null || pvError === void 0 ? void 0 : pvError.addError('pvFileRemoveWasm', _context8.t0);
                      memoryBufferInt32[statusAddress / Int32Array.BYTES_PER_ELEMENT] = -1;
                    case 14:
                    case "end":
                      return _context8.stop();
                  }
                }, _callee8, null, [[1, 10]]);
              }));
              return function pvFileRemoveWasm(_x31, _x32) {
                return _ref8.apply(this, arguments);
              };
            }();
            importObject = {
              // eslint-disable-next-line camelcase
              wasi_snapshot_preview1: wasiSnapshotPreview1Emulator,
              env: {
                memory: memory,
                pv_console_log_wasm: pvConsoleLogWasm,
                pv_assert_wasm: pvAssertWasm,
                pv_time_wasm: pvTimeWasm,
                pv_https_request_wasm: pvHttpsRequestWasm,
                pv_get_browser_info: pvGetBrowserInfo,
                pv_get_origin_info: pvGetOriginInfo,
                pv_file_open_wasm: pvFileOpenWasm,
                pv_file_close_wasm: pvFileCloseWasm,
                pv_file_read_wasm: pvFileReadWasm,
                pv_file_write_wasm: pvFileWriteWasm,
                pv_file_seek_wasm: pvFileSeekWasm,
                pv_file_tell_wasm: pvFileTellWasm,
                pv_file_remove_wasm: pvFileRemoveWasm
              }
            };
            if (!(wasm instanceof Promise)) {
              _context9.next = 34;
              break;
            }
            if (!a) {
              _context9.next = 23;
              break;
            }
            _context9.next = 20;
            return a(wasm, importObject);
          case 20:
            instance = _context9.sent.instance;
            _context9.next = 32;
            break;
          case 23:
            _context9.next = 25;
            return wasm;
          case 25:
            response = _context9.sent;
            _context9.next = 28;
            return response.arrayBuffer();
          case 28:
            data = _context9.sent;
            _context9.next = 31;
            return n(new Uint8Array(data), importObject);
          case 31:
            instance = _context9.sent.instance;
          case 32:
            _context9.next = 38;
            break;
          case 34:
            wasmCodeArray = base64ToUint8Array(wasm);
            _context9.next = 37;
            return n(wasmCodeArray, importObject);
          case 37:
            instance = _context9.sent.instance;
          case 38:
            aligned_alloc = instance.exports.aligned_alloc;
            return _context9.abrupt("return", instance.exports);
          case 40:
          case "end":
            return _context9.stop();
        }
      }, _callee9);
    }));
    return _buildWasm.apply(this, arguments);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  /*
    Copyright 2023 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
  */
  var PvError = /*#__PURE__*/function () {
    function PvError() {
      _classCallCheck(this, PvError);
      _defineProperty(this, "_maxNumErrors", 10);
      _defineProperty(this, "_errors", []);
      _defineProperty(this, "_lastError", void 0);
    }
    _createClass(PvError, [{
      key: "addError",
      value:
      /**
       * Store an error with a key and message.
       */
      function addError(key, error) {
        this._lastError = error instanceof Error ? error : new Error(error);
        if (this._errors.length >= this._maxNumErrors) {
          this._errors.shift();
        }
        if (error instanceof Error) {
          this._errors.push({
            key: key,
            message: error.toString()
          });
        } else {
          this._errors.push({
            key: key,
            message: JSON.stringify(error)
          });
        }
      }
      /**
       * Get all recent error messages. Cleans up error list.
       */
    }, {
      key: "getErrors",
      value: function getErrors() {
        var errors = _toConsumableArray(this._errors);
        this._errors = [];
        return errors;
      }
      /**
       * Get errors formatted into a string.
       */
    }, {
      key: "getErrorString",
      value: function getErrorString() {
        return this.getErrors().map(function (_ref) {
          var key = _ref.key,
            message = _ref.message;
          return "'".concat(key, "' failed with: ").concat(message, ".");
        }).join('\n');
      }
      /**
       * Returns the last error message added to the object.
       */
    }, {
      key: "getLastError",
      value: function getLastError() {
        return this._lastError;
      }
      /**
       * Sets the maximum number of errors it can store.
       */
    }, {
      key: "setMaxErrorNum",
      value: function setMaxErrorNum(num) {
        this._maxNumErrors = num;
      }
    }]);
    return PvError;
  }();

  /*
    Copyright 2022-2023 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
  */
  var dbConfig = {
    DB_NAME: DB_NAME,
    DB_VERSION: DB_VERSION,
    PV_FILE_STORE: PV_FILE_STORE
  };

  exports.PvError = PvError;
  exports.PvFile = PvFile;
  exports.PvFileIDB = PvFileIDB;
  exports.PvFileMem = PvFileMem;
  exports.arrayBufferToBase64AtIndex = arrayBufferToBase64AtIndex;
  exports.arrayBufferToStringAtIndex = arrayBufferToStringAtIndex;
  exports.base64ToUint8Array = base64ToUint8Array;
  exports.buildWasm = buildWasm;
  exports.dbConfig = dbConfig;
  exports.fetchWithTimeout = fetchWithTimeout;
  exports.fromBase64 = fromBase64;
  exports.fromPublicDirectory = fromPublicDirectory;
  exports.getDB = getDB;
  exports.isAccessKeyValid = isAccessKeyValid;
  exports.loadModel = loadModel;
  exports.open = open;
  exports.stringHeaderToObject = stringHeaderToObject;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
