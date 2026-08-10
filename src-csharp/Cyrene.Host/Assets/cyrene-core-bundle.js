// 由 scripts/build-core-bundle.mjs 生成，请勿手改。
var CyreneCore = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target2, all) => {
    for (var name in all)
      __defProp(target2, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/dist/jszip.min.js
  var require_jszip_min = __commonJS({
    "../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/dist/jszip.min.js"(exports, module) {
      !(function(e) {
        if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
        else if ("function" == typeof define && define.amd) define([], e);
        else {
          ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).JSZip = e();
        }
      })(function() {
        return (function s(a, o, h) {
          function u(r, e2) {
            if (!o[r]) {
              if (!a[r]) {
                var t = "function" == typeof __require && __require;
                if (!e2 && t) return t(r, true);
                if (l) return l(r, true);
                var n = new Error("Cannot find module '" + r + "'");
                throw n.code = "MODULE_NOT_FOUND", n;
              }
              var i = o[r] = { exports: {} };
              a[r][0].call(i.exports, function(e3) {
                var t2 = a[r][1][e3];
                return u(t2 || e3);
              }, i, i.exports, s, a, o, h);
            }
            return o[r].exports;
          }
          for (var l = "function" == typeof __require && __require, e = 0; e < h.length; e++) u(h[e]);
          return u;
        })({ 1: [function(e, t, r) {
          "use strict";
          var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          r.encode = function(e2) {
            for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
            return h.join("");
          }, r.decode = function(e2) {
            var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
            if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
            var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
            if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
            for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
            return l;
          };
        }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
          "use strict";
          var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
          function o(e2, t2, r2, n2, i2) {
            this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
          }
          o.prototype = { getContentWorker: function() {
            var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
            return e2.on("end", function() {
              if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
            }), e2;
          }, getCompressedWorker: function() {
            return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
          } }, o.createWorkerFrom = function(e2, t2, r2) {
            return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
          }, t.exports = o;
        }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
          "use strict";
          var n = e("./stream/GenericWorker");
          r.STORE = { magic: "\0\0", compressWorker: function() {
            return new n("STORE compression");
          }, uncompressWorker: function() {
            return new n("STORE decompression");
          } }, r.DEFLATE = e("./flate");
        }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
          "use strict";
          var n = e("./utils");
          var o = (function() {
            for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
              e2 = r2;
              for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
              t2[r2] = e2;
            }
            return t2;
          })();
          t.exports = function(e2, t2) {
            return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? (function(e3, t3, r2, n2) {
              var i = o, s = n2 + r2;
              e3 ^= -1;
              for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
              return -1 ^ e3;
            })(0 | t2, e2, e2.length, 0) : (function(e3, t3, r2, n2) {
              var i = o, s = n2 + r2;
              e3 ^= -1;
              for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
              return -1 ^ e3;
            })(0 | t2, e2, e2.length, 0) : 0;
          };
        }, { "./utils": 32 }], 5: [function(e, t, r) {
          "use strict";
          r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
        }, {}], 6: [function(e, t, r) {
          "use strict";
          var n = null;
          n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
        }, { lie: 37 }], 7: [function(e, t, r) {
          "use strict";
          var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
          function h(e2, t2) {
            a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
          }
          r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
            this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
          }, h.prototype.flush = function() {
            a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
          }, h.prototype.cleanUp = function() {
            a.prototype.cleanUp.call(this), this._pako = null;
          }, h.prototype._createPako = function() {
            this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
            var t2 = this;
            this._pako.onData = function(e2) {
              t2.push({ data: e2, meta: t2.meta });
            };
          }, r.compressWorker = function(e2) {
            return new h("Deflate", e2);
          }, r.uncompressWorker = function() {
            return new h("Inflate", {});
          };
        }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
          "use strict";
          function A(e2, t2) {
            var r2, n2 = "";
            for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
            return n2;
          }
          function n(e2, t2, r2, n2, i2, s2) {
            var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _ = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
            t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
            var S = 0;
            t2 && (S |= 8), l || !_ && !g || (S |= 2048);
            var z = 0, C = 0;
            w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= (function(e3, t3) {
              var r3 = e3;
              return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
            })(h.unixPermissions, w)) : (C = 20, z |= (function(e3) {
              return 63 & (e3 || 0);
            })(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _ && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
            var E = "";
            return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
          }
          var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
          function s(e2, t2, r2, n2) {
            i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
          }
          I.inherits(s, i), s.prototype.push = function(e2) {
            var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
            this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
          }, s.prototype.openedSource = function(e2) {
            this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
            var t2 = this.streamFiles && !e2.file.dir;
            if (t2) {
              var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
              this.push({ data: r2.fileRecord, meta: { percent: 0 } });
            } else this.accumulate = true;
          }, s.prototype.closedSource = function(e2) {
            this.accumulate = false;
            var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: (function(e3) {
              return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
            })(e2), meta: { percent: 100 } });
            else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
            this.currentFile = null;
          }, s.prototype.flush = function() {
            for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
            var r2 = this.bytesWritten - e2, n2 = (function(e3, t3, r3, n3, i2) {
              var s2 = I.transformTo("string", i2(n3));
              return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
            })(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
            this.push({ data: n2, meta: { percent: 100 } });
          }, s.prototype.prepareNextSource = function() {
            this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
          }, s.prototype.registerPrevious = function(e2) {
            this._sources.push(e2);
            var t2 = this;
            return e2.on("data", function(e3) {
              t2.processChunk(e3);
            }), e2.on("end", function() {
              t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
            }), e2.on("error", function(e3) {
              t2.error(e3);
            }), this;
          }, s.prototype.resume = function() {
            return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
          }, s.prototype.error = function(e2) {
            var t2 = this._sources;
            if (!i.prototype.error.call(this, e2)) return false;
            for (var r2 = 0; r2 < t2.length; r2++) try {
              t2[r2].error(e2);
            } catch (e3) {
            }
            return true;
          }, s.prototype.lock = function() {
            i.prototype.lock.call(this);
            for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
          }, t.exports = s;
        }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
          "use strict";
          var u = e("../compressions"), n = e("./ZipFileWorker");
          r.generateWorker = function(e2, a, t2) {
            var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
            try {
              e2.forEach(function(e3, t3) {
                h++;
                var r2 = (function(e4, t4) {
                  var r3 = e4 || t4, n3 = u[r3];
                  if (!n3) throw new Error(r3 + " is not a valid compression method !");
                  return n3;
                })(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
                t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
              }), o.entriesCount = h;
            } catch (e3) {
              o.error(e3);
            }
            return o;
          };
        }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
          "use strict";
          function n() {
            if (!(this instanceof n)) return new n();
            if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
            this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
              var e2 = new n();
              for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
              return e2;
            };
          }
          (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e2, t2) {
            return new n().loadAsync(e2, t2);
          }, n.external = e("./external"), t.exports = n;
        }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
          "use strict";
          var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
          function f(n2) {
            return new i.Promise(function(e2, t2) {
              var r2 = n2.decompressed.getContentWorker().pipe(new a());
              r2.on("error", function(e3) {
                t2(e3);
              }).on("end", function() {
                r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
              }).resume();
            });
          }
          t.exports = function(e2, o) {
            var h = this;
            return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
              var t2 = new s(o);
              return t2.load(e3), t2;
            }).then(function(e3) {
              var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
              if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
              return i.Promise.all(t2);
            }).then(function(e3) {
              for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
                var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
                h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
              }
              return t2.zipComment.length && (h.comment = t2.zipComment), h;
            });
          };
        }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("../stream/GenericWorker");
          function s(e2, t2) {
            i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
          }
          n.inherits(s, i), s.prototype._bindStream = function(e2) {
            var t2 = this;
            (this._stream = e2).pause(), e2.on("data", function(e3) {
              t2.push({ data: e3, meta: { percent: 0 } });
            }).on("error", function(e3) {
              t2.isPaused ? this.generatedError = e3 : t2.error(e3);
            }).on("end", function() {
              t2.isPaused ? t2._upstreamEnded = true : t2.end();
            });
          }, s.prototype.pause = function() {
            return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
          }, s.prototype.resume = function() {
            return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
          }, t.exports = s;
        }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
          "use strict";
          var i = e("readable-stream").Readable;
          function n(e2, t2, r2) {
            i.call(this, t2), this._helper = e2;
            var n2 = this;
            e2.on("data", function(e3, t3) {
              n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
            }).on("error", function(e3) {
              n2.emit("error", e3);
            }).on("end", function() {
              n2.push(null);
            });
          }
          e("../utils").inherits(n, i), n.prototype._read = function() {
            this._helper.resume();
          }, t.exports = n;
        }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
          "use strict";
          t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
            if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
            if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
            return new Buffer(e2, t2);
          }, allocBuffer: function(e2) {
            if (Buffer.alloc) return Buffer.alloc(e2);
            var t2 = new Buffer(e2);
            return t2.fill(0), t2;
          }, isBuffer: function(e2) {
            return Buffer.isBuffer(e2);
          }, isStream: function(e2) {
            return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
          } };
        }, {}], 15: [function(e, t, r) {
          "use strict";
          function s(e2, t2, r2) {
            var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
            s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _(e2)) && b.call(this, n2, true);
            var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
            r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
            var o2 = null;
            o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
            var h2 = new d(e2, o2, s2);
            this.files[e2] = h2;
          }
          var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _ = function(e2) {
            "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
            var t2 = e2.lastIndexOf("/");
            return 0 < t2 ? e2.substring(0, t2) : "";
          }, g = function(e2) {
            return "/" !== e2.slice(-1) && (e2 += "/"), e2;
          }, b = function(e2, t2) {
            return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
          };
          function h(e2) {
            return "[object RegExp]" === Object.prototype.toString.call(e2);
          }
          var n = { load: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, forEach: function(e2) {
            var t2, r2, n2;
            for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
          }, filter: function(r2) {
            var n2 = [];
            return this.forEach(function(e2, t2) {
              r2(e2, t2) && n2.push(t2);
            }), n2;
          }, file: function(e2, t2, r2) {
            if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
            if (h(e2)) {
              var n2 = e2;
              return this.filter(function(e3, t3) {
                return !t3.dir && n2.test(e3);
              });
            }
            var i2 = this.files[this.root + e2];
            return i2 && !i2.dir ? i2 : null;
          }, folder: function(r2) {
            if (!r2) return this;
            if (h(r2)) return this.filter(function(e3, t3) {
              return t3.dir && r2.test(e3);
            });
            var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
            return n2.root = t2.name, n2;
          }, remove: function(r2) {
            r2 = this.root + r2;
            var e2 = this.files[r2];
            if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
            else for (var t2 = this.filter(function(e3, t3) {
              return t3.name.slice(0, r2.length) === r2;
            }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
            return this;
          }, generate: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, generateInternalStream: function(e2) {
            var t2, r2 = {};
            try {
              if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
              u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
              var n2 = r2.comment || this.comment || "";
              t2 = o.generateWorker(this, r2, n2);
            } catch (e3) {
              (t2 = new l("error")).error(e3);
            }
            return new a(t2, r2.type || "string", r2.mimeType);
          }, generateAsync: function(e2, t2) {
            return this.generateInternalStream(e2).accumulate(t2);
          }, generateNodeStream: function(e2, t2) {
            return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
          } };
          t.exports = n;
        }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
          "use strict";
          t.exports = e("stream");
        }, { stream: void 0 }], 17: [function(e, t, r) {
          "use strict";
          var n = e("./DataReader");
          function i(e2) {
            n.call(this, e2);
            for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
          }
          e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
            return this.data[this.zero + e2];
          }, i.prototype.lastIndexOfSignature = function(e2) {
            for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
            return -1;
          }, i.prototype.readAndCheckSignature = function(e2) {
            var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
            return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
          }, i.prototype.readData = function(e2) {
            if (this.checkOffset(e2), 0 === e2) return [];
            var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
          "use strict";
          var n = e("../utils");
          function i(e2) {
            this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
          }
          i.prototype = { checkOffset: function(e2) {
            this.checkIndex(this.index + e2);
          }, checkIndex: function(e2) {
            if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
          }, setIndex: function(e2) {
            this.checkIndex(e2), this.index = e2;
          }, skip: function(e2) {
            this.setIndex(this.index + e2);
          }, byteAt: function() {
          }, readInt: function(e2) {
            var t2, r2 = 0;
            for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
            return this.index += e2, r2;
          }, readString: function(e2) {
            return n.transformTo("string", this.readData(e2));
          }, readData: function() {
          }, lastIndexOfSignature: function() {
          }, readAndCheckSignature: function() {
          }, readDate: function() {
            var e2 = this.readInt(4);
            return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
          } }, t.exports = i;
        }, { "../utils": 32 }], 19: [function(e, t, r) {
          "use strict";
          var n = e("./Uint8ArrayReader");
          function i(e2) {
            n.call(this, e2);
          }
          e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
            this.checkOffset(e2);
            var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
          "use strict";
          var n = e("./DataReader");
          function i(e2) {
            n.call(this, e2);
          }
          e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
            return this.data.charCodeAt(this.zero + e2);
          }, i.prototype.lastIndexOfSignature = function(e2) {
            return this.data.lastIndexOf(e2) - this.zero;
          }, i.prototype.readAndCheckSignature = function(e2) {
            return e2 === this.readData(4);
          }, i.prototype.readData = function(e2) {
            this.checkOffset(e2);
            var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
          "use strict";
          var n = e("./ArrayReader");
          function i(e2) {
            n.call(this, e2);
          }
          e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
            if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
            var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
          t.exports = function(e2) {
            var t2 = n.getTypeOf(e2);
            return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
          };
        }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
          "use strict";
          r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
        }, {}], 24: [function(e, t, r) {
          "use strict";
          var n = e("./GenericWorker"), i = e("../utils");
          function s(e2) {
            n.call(this, "ConvertWorker to " + e2), this.destType = e2;
          }
          i.inherits(s, n), s.prototype.processChunk = function(e2) {
            this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
          }, t.exports = s;
        }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
          "use strict";
          var n = e("./GenericWorker"), i = e("../crc32");
          function s() {
            n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
          }
          e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
            this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
          }, t.exports = s;
        }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("./GenericWorker");
          function s(e2) {
            i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
          }
          n.inherits(s, i), s.prototype.processChunk = function(e2) {
            if (e2) {
              var t2 = this.streamInfo[this.propName] || 0;
              this.streamInfo[this.propName] = t2 + e2.data.length;
            }
            i.prototype.processChunk.call(this, e2);
          }, t.exports = s;
        }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("./GenericWorker");
          function s(e2) {
            i.call(this, "DataWorker");
            var t2 = this;
            this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
              t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
            }, function(e3) {
              t2.error(e3);
            });
          }
          n.inherits(s, i), s.prototype.cleanUp = function() {
            i.prototype.cleanUp.call(this), this.data = null;
          }, s.prototype.resume = function() {
            return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
          }, s.prototype._tickAndRepeat = function() {
            this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
          }, s.prototype._tick = function() {
            if (this.isPaused || this.isFinished) return false;
            var e2 = null, t2 = Math.min(this.max, this.index + 16384);
            if (this.index >= this.max) return this.end();
            switch (this.type) {
              case "string":
                e2 = this.data.substring(this.index, t2);
                break;
              case "uint8array":
                e2 = this.data.subarray(this.index, t2);
                break;
              case "array":
              case "nodebuffer":
                e2 = this.data.slice(this.index, t2);
            }
            return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
          }, t.exports = s;
        }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
          "use strict";
          function n(e2) {
            this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
          }
          n.prototype = { push: function(e2) {
            this.emit("data", e2);
          }, end: function() {
            if (this.isFinished) return false;
            this.flush();
            try {
              this.emit("end"), this.cleanUp(), this.isFinished = true;
            } catch (e2) {
              this.emit("error", e2);
            }
            return true;
          }, error: function(e2) {
            return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
          }, on: function(e2, t2) {
            return this._listeners[e2].push(t2), this;
          }, cleanUp: function() {
            this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
          }, emit: function(e2, t2) {
            if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
          }, pipe: function(e2) {
            return e2.registerPrevious(this);
          }, registerPrevious: function(e2) {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
            var t2 = this;
            return e2.on("data", function(e3) {
              t2.processChunk(e3);
            }), e2.on("end", function() {
              t2.end();
            }), e2.on("error", function(e3) {
              t2.error(e3);
            }), this;
          }, pause: function() {
            return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
          }, resume: function() {
            if (!this.isPaused || this.isFinished) return false;
            var e2 = this.isPaused = false;
            return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
          }, flush: function() {
          }, processChunk: function(e2) {
            this.push(e2);
          }, withStreamInfo: function(e2, t2) {
            return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
          }, mergeStreamInfo: function() {
            for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
          }, lock: function() {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.isLocked = true, this.previous && this.previous.lock();
          }, toString: function() {
            var e2 = "Worker " + this.name;
            return this.previous ? this.previous + " -> " + e2 : e2;
          } }, t.exports = n;
        }, {}], 29: [function(e, t, r) {
          "use strict";
          var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
          if (n.nodestream) try {
            o = e("../nodejs/NodejsStreamOutputAdapter");
          } catch (e2) {
          }
          function l(e2, o2) {
            return new a.Promise(function(t2, r2) {
              var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
              e2.on("data", function(e3, t3) {
                n2.push(e3), o2 && o2(t3);
              }).on("error", function(e3) {
                n2 = [], r2(e3);
              }).on("end", function() {
                try {
                  var e3 = (function(e4, t3, r3) {
                    switch (e4) {
                      case "blob":
                        return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                      case "base64":
                        return u.encode(t3);
                      default:
                        return h.transformTo(e4, t3);
                    }
                  })(s2, (function(e4, t3) {
                    var r3, n3 = 0, i3 = null, s3 = 0;
                    for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                    switch (e4) {
                      case "string":
                        return t3.join("");
                      case "array":
                        return Array.prototype.concat.apply([], t3);
                      case "uint8array":
                        for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                        return i3;
                      case "nodebuffer":
                        return Buffer.concat(t3);
                      default:
                        throw new Error("concat : unsupported type '" + e4 + "'");
                    }
                  })(i2, n2), a2);
                  t2(e3);
                } catch (e4) {
                  r2(e4);
                }
                n2 = [];
              }).resume();
            });
          }
          function f(e2, t2, r2) {
            var n2 = t2;
            switch (t2) {
              case "blob":
              case "arraybuffer":
                n2 = "uint8array";
                break;
              case "base64":
                n2 = "string";
            }
            try {
              this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
            } catch (e3) {
              this._worker = new s("error"), this._worker.error(e3);
            }
          }
          f.prototype = { accumulate: function(e2) {
            return l(this, e2);
          }, on: function(e2, t2) {
            var r2 = this;
            return "data" === e2 ? this._worker.on(e2, function(e3) {
              t2.call(r2, e3.data, e3.meta);
            }) : this._worker.on(e2, function() {
              h.delay(t2, arguments, r2);
            }), this;
          }, resume: function() {
            return h.delay(this._worker.resume, [], this._worker), this;
          }, pause: function() {
            return this._worker.pause(), this;
          }, toNodejsStream: function(e2) {
            if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
            return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
          } }, t.exports = f;
        }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
          "use strict";
          if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
          else {
            var n = new ArrayBuffer(0);
            try {
              r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
            } catch (e2) {
              try {
                var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
                i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
              } catch (e3) {
                r.blob = false;
              }
            }
          }
          try {
            r.nodestream = !!e("readable-stream").Readable;
          } catch (e2) {
            r.nodestream = false;
          }
        }, { "readable-stream": 16 }], 31: [function(e, t, s) {
          "use strict";
          for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
          u[254] = u[254] = 1;
          function a() {
            n.call(this, "utf-8 decode"), this.leftOver = null;
          }
          function l() {
            n.call(this, "utf-8 encode");
          }
          s.utf8encode = function(e2) {
            return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : (function(e3) {
              var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
              for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
              for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
              return t2;
            })(e2);
          }, s.utf8decode = function(e2) {
            return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : (function(e3) {
              var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
              for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
              else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
              else {
                for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
                1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
              }
              return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
            })(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
          }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
            var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
            if (this.leftOver && this.leftOver.length) {
              if (h.uint8array) {
                var r2 = t2;
                (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
              } else t2 = this.leftOver.concat(t2);
              this.leftOver = null;
            }
            var n2 = (function(e3, t3) {
              var r3;
              for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
              return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
            })(t2), i2 = t2;
            n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
          }, a.prototype.flush = function() {
            this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
          }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
            this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
          }, s.Utf8EncodeWorker = l;
        }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
          "use strict";
          var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
          function n(e2) {
            return e2;
          }
          function l(e2, t2) {
            for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
            return t2;
          }
          e("setimmediate"), a.newBlob = function(t2, r2) {
            a.checkSupport("blob");
            try {
              return new Blob([t2], { type: r2 });
            } catch (e2) {
              try {
                var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
                return n2.append(t2), n2.getBlob(r2);
              } catch (e3) {
                throw new Error("Bug : can't construct the Blob.");
              }
            }
          };
          var i = { stringifyByChunk: function(e2, t2, r2) {
            var n2 = [], i2 = 0, s2 = e2.length;
            if (s2 <= r2) return String.fromCharCode.apply(null, e2);
            for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
            return n2.join("");
          }, stringifyByChar: function(e2) {
            for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
            return t2;
          }, applyCanBeUsed: { uint8array: (function() {
            try {
              return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
            } catch (e2) {
              return false;
            }
          })(), nodebuffer: (function() {
            try {
              return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
            } catch (e2) {
              return false;
            }
          })() } };
          function s(e2) {
            var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
            if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
              return i.stringifyByChunk(e2, r2, t2);
            } catch (e3) {
              t2 = Math.floor(t2 / 2);
            }
            return i.stringifyByChar(e2);
          }
          function f(e2, t2) {
            for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
            return t2;
          }
          a.applyFromCharCode = s;
          var c = {};
          c.string = { string: n, array: function(e2) {
            return l(e2, new Array(e2.length));
          }, arraybuffer: function(e2) {
            return c.string.uint8array(e2).buffer;
          }, uint8array: function(e2) {
            return l(e2, new Uint8Array(e2.length));
          }, nodebuffer: function(e2) {
            return l(e2, r.allocBuffer(e2.length));
          } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
            return new Uint8Array(e2).buffer;
          }, uint8array: function(e2) {
            return new Uint8Array(e2);
          }, nodebuffer: function(e2) {
            return r.newBufferFrom(e2);
          } }, c.arraybuffer = { string: function(e2) {
            return s(new Uint8Array(e2));
          }, array: function(e2) {
            return f(new Uint8Array(e2), new Array(e2.byteLength));
          }, arraybuffer: n, uint8array: function(e2) {
            return new Uint8Array(e2);
          }, nodebuffer: function(e2) {
            return r.newBufferFrom(new Uint8Array(e2));
          } }, c.uint8array = { string: s, array: function(e2) {
            return f(e2, new Array(e2.length));
          }, arraybuffer: function(e2) {
            return e2.buffer;
          }, uint8array: n, nodebuffer: function(e2) {
            return r.newBufferFrom(e2);
          } }, c.nodebuffer = { string: s, array: function(e2) {
            return f(e2, new Array(e2.length));
          }, arraybuffer: function(e2) {
            return c.nodebuffer.uint8array(e2).buffer;
          }, uint8array: function(e2) {
            return f(e2, new Uint8Array(e2.length));
          }, nodebuffer: n }, a.transformTo = function(e2, t2) {
            if (t2 = t2 || "", !e2) return t2;
            a.checkSupport(e2);
            var r2 = a.getTypeOf(t2);
            return c[r2][e2](t2);
          }, a.resolve = function(e2) {
            for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
              var i2 = t2[n2];
              "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
            }
            return r2.join("/");
          }, a.getTypeOf = function(e2) {
            return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
          }, a.checkSupport = function(e2) {
            if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
          }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
            var t2, r2, n2 = "";
            for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
            return n2;
          }, a.delay = function(e2, t2, r2) {
            setImmediate(function() {
              e2.apply(r2 || null, t2 || []);
            });
          }, a.inherits = function(e2, t2) {
            function r2() {
            }
            r2.prototype = t2.prototype, e2.prototype = new r2();
          }, a.extend = function() {
            var e2, t2, r2 = {};
            for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
            return r2;
          }, a.prepareContent = function(r2, e2, n2, i2, s2) {
            return u.Promise.resolve(e2).then(function(n3) {
              return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
                var e3 = new FileReader();
                e3.onload = function(e4) {
                  t2(e4.target.result);
                }, e3.onerror = function(e4) {
                  r3(e4.target.error);
                }, e3.readAsArrayBuffer(n3);
              }) : n3;
            }).then(function(e3) {
              var t2 = a.getTypeOf(e3);
              return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = (function(e4) {
                return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
              })(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
            });
          };
        }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
          "use strict";
          var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
          function h(e2) {
            this.files = [], this.loadOptions = e2;
          }
          h.prototype = { checkSignature: function(e2) {
            if (!this.reader.readAndCheckSignature(e2)) {
              this.reader.index -= 4;
              var t2 = this.reader.readString(4);
              throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
            }
          }, isSignature: function(e2, t2) {
            var r2 = this.reader.index;
            this.reader.setIndex(e2);
            var n2 = this.reader.readString(4) === t2;
            return this.reader.setIndex(r2), n2;
          }, readBlockEndOfCentral: function() {
            this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
            var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
            this.zipComment = this.loadOptions.decodeFileName(r2);
          }, readBlockZip64EndOfCentral: function() {
            this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
            for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
          }, readBlockZip64EndOfCentralLocator: function() {
            if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
          }, readLocalFiles: function() {
            var e2, t2;
            for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
          }, readCentralDir: function() {
            var e2;
            for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
            if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          }, readEndOfCentral: function() {
            var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
            if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
            this.reader.setIndex(e2);
            var t2 = e2;
            if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
              if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
              if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
              this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
            }
            var r2 = this.centralDirOffset + this.centralDirSize;
            this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
            var n2 = t2 - r2;
            if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
            else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
          }, prepareReader: function(e2) {
            this.reader = n(e2);
          }, load: function(e2) {
            this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
          } }, t.exports = h;
        }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
          "use strict";
          var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
          function l(e2, t2) {
            this.options = e2, this.loadOptions = t2;
          }
          l.prototype = { isEncrypted: function() {
            return 1 == (1 & this.bitFlag);
          }, useUTF8: function() {
            return 2048 == (2048 & this.bitFlag);
          }, readLocalPart: function(e2) {
            var t2, r2;
            if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
            if (null === (t2 = (function(e3) {
              for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
              return null;
            })(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
            this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
          }, readCentralPart: function(e2) {
            this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
            var t2 = e2.readInt(2);
            if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
            e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
          }, processAttributes: function() {
            this.unixPermissions = null, this.dosPermissions = null;
            var e2 = this.versionMadeBy >> 8;
            this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
          }, parseZIP64ExtraField: function() {
            if (this.extraFields[1]) {
              var e2 = n(this.extraFields[1].value);
              this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
            }
          }, readExtraFields: function(e2) {
            var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
            for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
            e2.setIndex(i2);
          }, handleUTF8: function() {
            var e2 = u.uint8array ? "uint8array" : "array";
            if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
            else {
              var t2 = this.findExtraFieldUnicodePath();
              if (null !== t2) this.fileNameStr = t2;
              else {
                var r2 = s.transformTo(e2, this.fileName);
                this.fileNameStr = this.loadOptions.decodeFileName(r2);
              }
              var n2 = this.findExtraFieldUnicodeComment();
              if (null !== n2) this.fileCommentStr = n2;
              else {
                var i2 = s.transformTo(e2, this.fileComment);
                this.fileCommentStr = this.loadOptions.decodeFileName(i2);
              }
            }
          }, findExtraFieldUnicodePath: function() {
            var e2 = this.extraFields[28789];
            if (e2) {
              var t2 = n(e2.value);
              return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
            }
            return null;
          }, findExtraFieldUnicodeComment: function() {
            var e2 = this.extraFields[25461];
            if (e2) {
              var t2 = n(e2.value);
              return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
            }
            return null;
          } }, t.exports = l;
        }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
          "use strict";
          function n(e2, t2, r2) {
            this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
          }
          var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
          n.prototype = { internalStream: function(e2) {
            var t2 = null, r2 = "string";
            try {
              if (!e2) throw new Error("No output type specified.");
              var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
              "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
              var i2 = !this._dataBinary;
              i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
            } catch (e3) {
              (t2 = new h("error")).error(e3);
            }
            return new s(t2, r2, "");
          }, async: function(e2, t2) {
            return this.internalStream(e2).accumulate(t2);
          }, nodeStream: function(e2, t2) {
            return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
          }, _compressWorker: function(e2, t2) {
            if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
            var r2 = this._decompressWorker();
            return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
          }, _decompressWorker: function() {
            return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
          } };
          for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
          t.exports = n;
        }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
          (function(t2) {
            "use strict";
            var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
            if (e2) {
              var i = 0, s = new e2(u), a = t2.document.createTextNode("");
              s.observe(a, { characterData: true }), r = function() {
                a.data = i = ++i % 2;
              };
            } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
              var e3 = t2.document.createElement("script");
              e3.onreadystatechange = function() {
                u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
              }, t2.document.documentElement.appendChild(e3);
            } : function() {
              setTimeout(u, 0);
            };
            else {
              var o = new t2.MessageChannel();
              o.port1.onmessage = u, r = function() {
                o.port2.postMessage(0);
              };
            }
            var h = [];
            function u() {
              var e3, t3;
              n = true;
              for (var r2 = h.length; r2; ) {
                for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
                r2 = h.length;
              }
              n = false;
            }
            l.exports = function(e3) {
              1 !== h.push(e3) || n || r();
            };
          }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
        }, {}], 37: [function(e, t, r) {
          "use strict";
          var i = e("immediate");
          function u() {
          }
          var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
          function o(e2) {
            if ("function" != typeof e2) throw new TypeError("resolver must be a function");
            this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
          }
          function h(e2, t2, r2) {
            this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
          }
          function f(t2, r2, n2) {
            i(function() {
              var e2;
              try {
                e2 = r2(n2);
              } catch (e3) {
                return l.reject(t2, e3);
              }
              e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
            });
          }
          function c(e2) {
            var t2 = e2 && e2.then;
            if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
              t2.apply(e2, arguments);
            };
          }
          function d(t2, e2) {
            var r2 = false;
            function n2(e3) {
              r2 || (r2 = true, l.reject(t2, e3));
            }
            function i2(e3) {
              r2 || (r2 = true, l.resolve(t2, e3));
            }
            var s2 = p(function() {
              e2(i2, n2);
            });
            "error" === s2.status && n2(s2.value);
          }
          function p(e2, t2) {
            var r2 = {};
            try {
              r2.value = e2(t2), r2.status = "success";
            } catch (e3) {
              r2.status = "error", r2.value = e3;
            }
            return r2;
          }
          (t.exports = o).prototype.finally = function(t2) {
            if ("function" != typeof t2) return this;
            var r2 = this.constructor;
            return this.then(function(e2) {
              return r2.resolve(t2()).then(function() {
                return e2;
              });
            }, function(e2) {
              return r2.resolve(t2()).then(function() {
                throw e2;
              });
            });
          }, o.prototype.catch = function(e2) {
            return this.then(null, e2);
          }, o.prototype.then = function(e2, t2) {
            if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
            var r2 = new this.constructor(u);
            this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
            return r2;
          }, h.prototype.callFulfilled = function(e2) {
            l.resolve(this.promise, e2);
          }, h.prototype.otherCallFulfilled = function(e2) {
            f(this.promise, this.onFulfilled, e2);
          }, h.prototype.callRejected = function(e2) {
            l.reject(this.promise, e2);
          }, h.prototype.otherCallRejected = function(e2) {
            f(this.promise, this.onRejected, e2);
          }, l.resolve = function(e2, t2) {
            var r2 = p(c, t2);
            if ("error" === r2.status) return l.reject(e2, r2.value);
            var n2 = r2.value;
            if (n2) d(e2, n2);
            else {
              e2.state = a, e2.outcome = t2;
              for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
            }
            return e2;
          }, l.reject = function(e2, t2) {
            e2.state = s, e2.outcome = t2;
            for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
            return e2;
          }, o.resolve = function(e2) {
            if (e2 instanceof this) return e2;
            return l.resolve(new this(u), e2);
          }, o.reject = function(e2) {
            var t2 = new this(u);
            return l.reject(t2, e2);
          }, o.all = function(e2) {
            var r2 = this;
            if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
            var n2 = e2.length, i2 = false;
            if (!n2) return this.resolve([]);
            var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
            for (; ++t2 < n2; ) h2(e2[t2], t2);
            return o2;
            function h2(e3, t3) {
              r2.resolve(e3).then(function(e4) {
                s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
              }, function(e4) {
                i2 || (i2 = true, l.reject(o2, e4));
              });
            }
          }, o.race = function(e2) {
            var t2 = this;
            if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
            var r2 = e2.length, n2 = false;
            if (!r2) return this.resolve([]);
            var i2 = -1, s2 = new this(u);
            for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
              n2 || (n2 = true, l.resolve(s2, e3));
            }, function(e3) {
              n2 || (n2 = true, l.reject(s2, e3));
            });
            var a2;
            return s2;
          };
        }, { immediate: 36 }], 38: [function(e, t, r) {
          "use strict";
          var n = {};
          (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
        }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
          "use strict";
          var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
          function p(e2) {
            if (!(this instanceof p)) return new p(e2);
            this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
            var t2 = this.options;
            t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
            var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
            if (r2 !== l) throw new Error(i[r2]);
            if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
              var n2;
              if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
              this._dict_set = true;
            }
          }
          function n(e2, t2) {
            var r2 = new p(t2);
            if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
            return r2.result;
          }
          p.prototype.push = function(e2, t2) {
            var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
            if (this.ended) return false;
            n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
            do {
              if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
              0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
            } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
            return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
          }, p.prototype.onData = function(e2) {
            this.chunks.push(e2);
          }, p.prototype.onEnd = function(e2) {
            e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
          }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
            return (t2 = t2 || {}).raw = true, n(e2, t2);
          }, r.gzip = function(e2, t2) {
            return (t2 = t2 || {}).gzip = true, n(e2, t2);
          };
        }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
          "use strict";
          var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _ = Object.prototype.toString;
          function a(e2) {
            if (!(this instanceof a)) return new a(e2);
            this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
            var t2 = this.options;
            t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
            var r2 = c.inflateInit2(this.strm, t2.windowBits);
            if (r2 !== m.Z_OK) throw new Error(n[r2]);
            this.header = new s(), c.inflateGetHeader(this.strm, this.header);
          }
          function o(e2, t2) {
            var r2 = new a(t2);
            if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
            return r2.result;
          }
          a.prototype.push = function(e2, t2) {
            var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
            if (this.ended) return false;
            n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
            do {
              if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
              h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
            } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
            return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
          }, a.prototype.onData = function(e2) {
            this.chunks.push(e2);
          }, a.prototype.onEnd = function(e2) {
            e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
          }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
            return (t2 = t2 || {}).raw = true, o(e2, t2);
          }, r.ungzip = o;
        }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
          "use strict";
          var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
          r.assign = function(e2) {
            for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
              var r2 = t2.shift();
              if (r2) {
                if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
                for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
              }
            }
            return e2;
          }, r.shrinkBuf = function(e2, t2) {
            return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
          };
          var i = { arraySet: function(e2, t2, r2, n2, i2) {
            if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
            else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
          }, flattenChunks: function(e2) {
            var t2, r2, n2, i2, s2, a;
            for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
            for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
            return a;
          } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
            for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
          }, flattenChunks: function(e2) {
            return [].concat.apply([], e2);
          } };
          r.setTyped = function(e2) {
            e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
          }, r.setTyped(n);
        }, {}], 42: [function(e, t, r) {
          "use strict";
          var h = e("./common"), i = true, s = true;
          try {
            String.fromCharCode.apply(null, [0]);
          } catch (e2) {
            i = false;
          }
          try {
            String.fromCharCode.apply(null, new Uint8Array(1));
          } catch (e2) {
            s = false;
          }
          for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
          function l(e2, t2) {
            if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
            for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
            return r2;
          }
          u[254] = u[254] = 1, r.string2buf = function(e2) {
            var t2, r2, n2, i2, s2, a = e2.length, o = 0;
            for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          }, r.buf2binstring = function(e2) {
            return l(e2, e2.length);
          }, r.binstring2buf = function(e2) {
            for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
            return t2;
          }, r.buf2string = function(e2, t2) {
            var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
            for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
            else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
            else {
              for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
              1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
            }
            return l(o, n2);
          }, r.utf8border = function(e2, t2) {
            var r2;
            for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
            return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
          };
        }, { "./common": 41 }], 43: [function(e, t, r) {
          "use strict";
          t.exports = function(e2, t2, r2, n) {
            for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
              for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
              i %= 65521, s %= 65521;
            }
            return i | s << 16 | 0;
          };
        }, {}], 44: [function(e, t, r) {
          "use strict";
          t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
        }, {}], 45: [function(e, t, r) {
          "use strict";
          var o = (function() {
            for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
              e2 = r2;
              for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
              t2[r2] = e2;
            }
            return t2;
          })();
          t.exports = function(e2, t2, r2, n) {
            var i = o, s = n + r2;
            e2 ^= -1;
            for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
            return -1 ^ e2;
          };
        }, {}], 46: [function(e, t, r) {
          "use strict";
          var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _ = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
          function R(e2, t2) {
            return e2.msg = n[t2], t2;
          }
          function T(e2) {
            return (e2 << 1) - (4 < e2 ? 9 : 0);
          }
          function D(e2) {
            for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
          }
          function F(e2) {
            var t2 = e2.state, r2 = t2.pending;
            r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
          }
          function N(e2, t2) {
            u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
          }
          function U(e2, t2) {
            e2.pending_buf[e2.pending++] = t2;
          }
          function P(e2, t2) {
            e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
          }
          function L(e2, t2) {
            var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
            e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
            do {
              if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
                s2 += 2, r2++;
                do {
                } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
                if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                  if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                  d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
                }
              }
            } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
            return a2 <= e2.lookahead ? a2 : e2.lookahead;
          }
          function j(e2) {
            var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
            do {
              if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
                for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
                for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
                i2 += f2;
              }
              if (0 === e2.strm.avail_in) break;
              if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
            } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
          }
          function Z(e2, t2) {
            for (var r2, n2; ; ) {
              if (e2.lookahead < z) {
                if (j(e2), e2.lookahead < z && t2 === l) return A;
                if (0 === e2.lookahead) break;
              }
              if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
                for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
                e2.strstart++;
              } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
              else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
              if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            }
            return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
          }
          function W(e2, t2) {
            for (var r2, n2, i2; ; ) {
              if (e2.lookahead < z) {
                if (j(e2), e2.lookahead < z && t2 === l) return A;
                if (0 === e2.lookahead) break;
              }
              if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
                for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
                if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
              } else if (e2.match_available) {
                if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
              } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
            }
            return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
          }
          function M(e2, t2, r2, n2, i2) {
            this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
          }
          function H() {
            this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
          }
          function G(e2) {
            var t2;
            return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _);
          }
          function K(e2) {
            var t2 = G(e2);
            return t2 === m && (function(e3) {
              e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
            })(e2.state), t2;
          }
          function Y(e2, t2, r2, n2, i2, s2) {
            if (!e2) return _;
            var a2 = 1;
            if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _);
            8 === n2 && (n2 = 9);
            var o2 = new H();
            return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
          }
          h = [new M(0, 0, 0, 0, function(e2, t2) {
            var r2 = 65535;
            for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
              if (e2.lookahead <= 1) {
                if (j(e2), 0 === e2.lookahead && t2 === l) return A;
                if (0 === e2.lookahead) break;
              }
              e2.strstart += e2.lookahead, e2.lookahead = 0;
              var n2 = e2.block_start + r2;
              if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
              if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            }
            return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
          }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
            return Y(e2, t2, v, 15, 8, 0);
          }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
            return e2 && e2.state ? 2 !== e2.state.wrap ? _ : (e2.state.gzhead = t2, m) : _;
          }, r.deflate = function(e2, t2) {
            var r2, n2, i2, s2;
            if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _) : _;
            if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _);
            if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
            else {
              var a2 = v + (n2.w_bits - 8 << 4) << 8;
              a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
            }
            if (69 === n2.status) if (n2.gzhead.extra) {
              for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
            } else n2.status = 73;
            if (73 === n2.status) if (n2.gzhead.name) {
              i2 = n2.pending;
              do {
                if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                  s2 = 1;
                  break;
                }
                s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
              } while (0 !== s2);
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
            } else n2.status = 91;
            if (91 === n2.status) if (n2.gzhead.comment) {
              i2 = n2.pending;
              do {
                if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                  s2 = 1;
                  break;
                }
                s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
              } while (0 !== s2);
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
            } else n2.status = 103;
            if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
              if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
            } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
            if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
            if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
              var o2 = 2 === n2.strategy ? (function(e3, t3) {
                for (var r3; ; ) {
                  if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                    if (t3 === l) return A;
                    break;
                  }
                  if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
                }
                return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
              })(n2, t2) : 3 === n2.strategy ? (function(e3, t3) {
                for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                  if (e3.lookahead <= S) {
                    if (j(e3), e3.lookahead <= S && t3 === l) return A;
                    if (0 === e3.lookahead) break;
                  }
                  if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                    s3 = e3.strstart + S;
                    do {
                    } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                    e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                  }
                  if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
                }
                return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
              })(n2, t2) : h[n2.level].func(n2, t2);
              if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
              if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
            }
            return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
          }, r.deflateEnd = function(e2) {
            var t2;
            return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _;
          }, r.deflateSetDictionary = function(e2, t2) {
            var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
            if (!e2 || !e2.state) return _;
            if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _;
            for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
              for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
              r2.strstart = n2, r2.lookahead = x - 1, j(r2);
            }
            return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
          }, r.deflateInfo = "pako deflate (from Nodeca project)";
        }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
          "use strict";
          t.exports = function() {
            this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
          };
        }, {}], 48: [function(e, t, r) {
          "use strict";
          t.exports = function(e2, t2) {
            var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _, g, b, v, y, w, k, x, S, z, C;
            r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _ = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
            e: do {
              p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
              t: for (; ; ) {
                if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
                else {
                  if (!(16 & y)) {
                    if (0 == (64 & y)) {
                      v = m[(65535 & v) + (d & (1 << y) - 1)];
                      continue t;
                    }
                    if (32 & y) {
                      r2.mode = 12;
                      break e;
                    }
                    e2.msg = "invalid literal/length code", r2.mode = 30;
                    break e;
                  }
                  w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _[d & b];
                  r: for (; ; ) {
                    if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                      if (0 == (64 & y)) {
                        v = _[(65535 & v) + (d & (1 << y) - 1)];
                        continue r;
                      }
                      e2.msg = "invalid distance code", r2.mode = 30;
                      break e;
                    }
                    if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (d >>>= y, p -= y, (y = s - a) < k) {
                      if (l < (y = k - y) && r2.sane) {
                        e2.msg = "invalid distance too far back", r2.mode = 30;
                        break e;
                      }
                      if (S = c, (x = 0) === f) {
                        if (x += u - y, y < w) {
                          for (w -= y; C[s++] = c[x++], --y; ) ;
                          x = s - k, S = C;
                        }
                      } else if (f < y) {
                        if (x += u + f - y, (y -= f) < w) {
                          for (w -= y; C[s++] = c[x++], --y; ) ;
                          if (x = 0, f < w) {
                            for (w -= y = f; C[s++] = c[x++], --y; ) ;
                            x = s - k, S = C;
                          }
                        }
                      } else if (x += f - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S = C;
                      }
                      for (; 2 < w; ) C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                      w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                    } else {
                      for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                      w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                    }
                    break;
                  }
                }
                break;
              }
            } while (n < i && s < o);
            n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
          };
        }, {}], 49: [function(e, t, r) {
          "use strict";
          var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
          function L(e2) {
            return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
          }
          function s() {
            this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
          }
          function a(e2) {
            var t2;
            return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
          }
          function o(e2) {
            var t2;
            return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
          }
          function h(e2, t2) {
            var r2, n2;
            return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
          }
          function u(e2, t2) {
            var r2, n2;
            return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
          }
          var l, f, c = true;
          function j(e2) {
            if (c) {
              var t2;
              for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
              for (; t2 < 256; ) e2.lens[t2++] = 9;
              for (; t2 < 280; ) e2.lens[t2++] = 7;
              for (; t2 < 288; ) e2.lens[t2++] = 8;
              for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
              T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
            }
            e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
          }
          function Z(e2, t2, r2, n2) {
            var i2, s2 = e2.state;
            return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
          }
          r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
            return u(e2, 15);
          }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
            var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
            if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
            12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
            e: for (; ; ) switch (r2.mode) {
              case P:
                if (0 === r2.wrap) {
                  r2.mode = 13;
                  break;
                }
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (2 & r2.wrap && 35615 === u2) {
                  E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                  break;
                }
                if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                  e2.msg = "incorrect header check", r2.mode = 30;
                  break;
                }
                if (8 != (15 & u2)) {
                  e2.msg = "unknown compression method", r2.mode = 30;
                  break;
                }
                if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
                else if (k > r2.wbits) {
                  e2.msg = "invalid window size", r2.mode = 30;
                  break;
                }
                r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
                break;
              case 2:
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (r2.flags = u2, 8 != (255 & r2.flags)) {
                  e2.msg = "unknown compression method", r2.mode = 30;
                  break;
                }
                if (57344 & r2.flags) {
                  e2.msg = "unknown header flags set", r2.mode = 30;
                  break;
                }
                r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
              case 3:
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
              case 4:
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
              case 5:
                if (1024 & r2.flags) {
                  for (; l2 < 16; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
                } else r2.head && (r2.head.extra = null);
                r2.mode = 6;
              case 6:
                if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
                r2.length = 0, r2.mode = 7;
              case 7:
                if (2048 & r2.flags) {
                  if (0 === o2) break e;
                  for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                  if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
                } else r2.head && (r2.head.name = null);
                r2.length = 0, r2.mode = 8;
              case 8:
                if (4096 & r2.flags) {
                  if (0 === o2) break e;
                  for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                  if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
                } else r2.head && (r2.head.comment = null);
                r2.mode = 9;
              case 9:
                if (512 & r2.flags) {
                  for (; l2 < 16; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (u2 !== (65535 & r2.check)) {
                    e2.msg = "header crc mismatch", r2.mode = 30;
                    break;
                  }
                  l2 = u2 = 0;
                }
                r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
                break;
              case 10:
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
              case 11:
                if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
                e2.adler = r2.check = 1, r2.mode = 12;
              case 12:
                if (5 === t2 || 6 === t2) break e;
              case 13:
                if (r2.last) {
                  u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                  break;
                }
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                  case 0:
                    r2.mode = 14;
                    break;
                  case 1:
                    if (j(r2), r2.mode = 20, 6 !== t2) break;
                    u2 >>>= 2, l2 -= 2;
                    break e;
                  case 2:
                    r2.mode = 17;
                    break;
                  case 3:
                    e2.msg = "invalid block type", r2.mode = 30;
                }
                u2 >>>= 2, l2 -= 2;
                break;
              case 14:
                for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                  e2.msg = "invalid stored block lengths", r2.mode = 30;
                  break;
                }
                if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
              case 15:
                r2.mode = 16;
              case 16:
                if (d = r2.length) {
                  if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                  I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                  break;
                }
                r2.mode = 12;
                break;
              case 17:
                for (; l2 < 14; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                  e2.msg = "too many length or distance symbols", r2.mode = 30;
                  break;
                }
                r2.have = 0, r2.mode = 18;
              case 18:
                for (; r2.have < r2.ncode; ) {
                  for (; l2 < 3; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
                }
                for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
                if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                  e2.msg = "invalid code lengths set", r2.mode = 30;
                  break;
                }
                r2.have = 0, r2.mode = 19;
              case 19:
                for (; r2.have < r2.nlen + r2.ndist; ) {
                  for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (b < 16) u2 >>>= _, l2 -= _, r2.lens[r2.have++] = b;
                  else {
                    if (16 === b) {
                      for (z = _ + 2; l2 < z; ) {
                        if (0 === o2) break e;
                        o2--, u2 += n2[s2++] << l2, l2 += 8;
                      }
                      if (u2 >>>= _, l2 -= _, 0 === r2.have) {
                        e2.msg = "invalid bit length repeat", r2.mode = 30;
                        break;
                      }
                      k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                    } else if (17 === b) {
                      for (z = _ + 3; l2 < z; ) {
                        if (0 === o2) break e;
                        o2--, u2 += n2[s2++] << l2, l2 += 8;
                      }
                      l2 -= _, k = 0, d = 3 + (7 & (u2 >>>= _)), u2 >>>= 3, l2 -= 3;
                    } else {
                      for (z = _ + 7; l2 < z; ) {
                        if (0 === o2) break e;
                        o2--, u2 += n2[s2++] << l2, l2 += 8;
                      }
                      l2 -= _, k = 0, d = 11 + (127 & (u2 >>>= _)), u2 >>>= 7, l2 -= 7;
                    }
                    if (r2.have + d > r2.nlen + r2.ndist) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    for (; d--; ) r2.lens[r2.have++] = k;
                  }
                }
                if (30 === r2.mode) break;
                if (0 === r2.lens[256]) {
                  e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                  break;
                }
                if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                  e2.msg = "invalid literal/lengths set", r2.mode = 30;
                  break;
                }
                if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                  e2.msg = "invalid distances set", r2.mode = 30;
                  break;
                }
                if (r2.mode = 20, 6 === t2) break e;
              case 20:
                r2.mode = 21;
              case 21:
                if (6 <= o2 && 258 <= h2) {
                  e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                  break;
                }
                for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (g && 0 == (240 & g)) {
                  for (v = _, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  u2 >>>= v, l2 -= v, r2.back += v;
                }
                if (u2 >>>= _, l2 -= _, r2.back += _, r2.length = b, 0 === g) {
                  r2.mode = 26;
                  break;
                }
                if (32 & g) {
                  r2.back = -1, r2.mode = 12;
                  break;
                }
                if (64 & g) {
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break;
                }
                r2.extra = 15 & g, r2.mode = 22;
              case 22:
                if (r2.extra) {
                  for (z = r2.extra; l2 < z; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                }
                r2.was = r2.length, r2.mode = 23;
              case 23:
                for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (0 == (240 & g)) {
                  for (v = _, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  u2 >>>= v, l2 -= v, r2.back += v;
                }
                if (u2 >>>= _, l2 -= _, r2.back += _, 64 & g) {
                  e2.msg = "invalid distance code", r2.mode = 30;
                  break;
                }
                r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
              case 24:
                if (r2.extra) {
                  for (z = r2.extra; l2 < z; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                }
                if (r2.offset > r2.dmax) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                r2.mode = 25;
              case 25:
                if (0 === h2) break e;
                if (d = c2 - h2, r2.offset > d) {
                  if ((d = r2.offset - d) > r2.whave && r2.sane) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break;
                  }
                  p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
                } else m = i2, p = a2 - r2.offset, d = r2.length;
                for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
                0 === r2.length && (r2.mode = 21);
                break;
              case 26:
                if (0 === h2) break e;
                i2[a2++] = r2.length, h2--, r2.mode = 21;
                break;
              case 27:
                if (r2.wrap) {
                  for (; l2 < 32; ) {
                    if (0 === o2) break e;
                    o2--, u2 |= n2[s2++] << l2, l2 += 8;
                  }
                  if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                    e2.msg = "incorrect data check", r2.mode = 30;
                    break;
                  }
                  l2 = u2 = 0;
                }
                r2.mode = 28;
              case 28:
                if (r2.wrap && r2.flags) {
                  for (; l2 < 32; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (u2 !== (4294967295 & r2.total)) {
                    e2.msg = "incorrect length check", r2.mode = 30;
                    break;
                  }
                  l2 = u2 = 0;
                }
                r2.mode = 29;
              case 29:
                x = 1;
                break e;
              case 30:
                x = -3;
                break e;
              case 31:
                return -4;
              case 32:
              default:
                return U;
            }
            return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
          }, r.inflateEnd = function(e2) {
            if (!e2 || !e2.state) return U;
            var t2 = e2.state;
            return t2.window && (t2.window = null), e2.state = null, N;
          }, r.inflateGetHeader = function(e2, t2) {
            var r2;
            return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
          }, r.inflateSetDictionary = function(e2, t2) {
            var r2, n2 = t2.length;
            return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
          }, r.inflateInfo = "pako inflate (from Nodeca project)";
        }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
          "use strict";
          var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
          t.exports = function(e2, t2, r2, n, i, s, a, o) {
            var h, u, l, f, c, d, p, m, _, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
            for (b = 0; b <= 15; b++) O[b] = 0;
            for (v = 0; v < n; v++) O[t2[r2 + v]]++;
            for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
            if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
            for (y = 1; y < w && 0 === O[y]; y++) ;
            for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
            if (0 < z && (0 === e2 || 1 !== w)) return -1;
            for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
            for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
            if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
            for (; ; ) {
              for (p = b - S, _ = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _ | 0, 0 !== u; ) ;
              for (h = 1 << b - 1; E & h; ) h >>= 1;
              if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
                if (b === w) break;
                b = t2[r2 + a[v]];
              }
              if (k < b && (E & f) !== l) {
                for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); ) x++, z <<= 1;
                if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
                i[l = E & f] = k << 24 | x << 16 | c - s | 0;
              }
            }
            return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
          };
        }, { "../utils/common": 41 }], 51: [function(e, t, r) {
          "use strict";
          t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
        }, {}], 52: [function(e, t, r) {
          "use strict";
          var i = e("../utils/common"), o = 0, h = 1;
          function n(e2) {
            for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
          }
          var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _ = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
          n(z);
          var C = new Array(2 * f);
          n(C);
          var E = new Array(512);
          n(E);
          var A = new Array(256);
          n(A);
          var I = new Array(a);
          n(I);
          var O, B, R, T = new Array(f);
          function D(e2, t2, r2, n2, i2) {
            this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
          }
          function F(e2, t2) {
            this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
          }
          function N(e2) {
            return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
          }
          function U(e2, t2) {
            e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
          }
          function P(e2, t2, r2) {
            e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
          }
          function L(e2, t2, r2) {
            P(e2, r2[2 * t2], r2[2 * t2 + 1]);
          }
          function j(e2, t2) {
            for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
            return r2 >>> 1;
          }
          function Z(e2, t2, r2) {
            var n2, i2, s2 = new Array(g + 1), a2 = 0;
            for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
            for (i2 = 0; i2 <= t2; i2++) {
              var o2 = e2[2 * i2 + 1];
              0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
            }
          }
          function W(e2) {
            var t2;
            for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
            for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
            for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
            e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
          }
          function M(e2) {
            8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
          }
          function H(e2, t2, r2, n2) {
            var i2 = 2 * t2, s2 = 2 * r2;
            return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
          }
          function G(e2, t2, r2) {
            for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
            e2.heap[r2] = n2;
          }
          function K(e2, t2, r2) {
            var n2, i2, s2, a2, o2 = 0;
            if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
            L(e2, m, t2);
          }
          function Y(e2, t2) {
            var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
            for (e2.heap_len = 0, e2.heap_max = _, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
            for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
            for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
            for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
            e2.heap[--e2.heap_max] = e2.heap[1], (function(e3, t3) {
              var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
              for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
              for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
              if (0 !== m2) {
                do {
                  for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                  e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
                } while (0 < m2);
                for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
              }
            })(e2, t2), Z(s2, u2, e2.bl_count);
          }
          function X(e2, t2, r2) {
            var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
            for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
          }
          function V(e2, t2, r2) {
            var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
            for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
              if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
              else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
              s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
            }
          }
          n(T);
          var q = false;
          function J(e2, t2, r2, n2) {
            P(e2, (s << 1) + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
              M(e3), n3 && (U(e3, r3), U(e3, ~r3)), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
            })(e2, t2, r2, true);
          }
          r._tr_init = function(e2) {
            q || ((function() {
              var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
              for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
              for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
              for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
              for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
              for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
              for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
              for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
              for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
              for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
              O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
            })(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
          }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
            var i2, s2, a2 = 0;
            0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = (function(e3) {
              var t3, r3 = 4093624447;
              for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
              if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
              for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
              return o;
            })(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = (function(e3) {
              var t3;
              for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--) ;
              return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
            })(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
              var i3;
              for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
              V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
            })(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
          }, r._tr_tally = function(e2, t2, r2) {
            return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
          }, r._tr_align = function(e2) {
            P(e2, 2, 3), L(e2, m, z), (function(e3) {
              16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
            })(e2);
          };
        }, { "../utils/common": 41 }], 53: [function(e, t, r) {
          "use strict";
          t.exports = function() {
            this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
          };
        }, {}], 54: [function(e, t, r) {
          (function(e2) {
            !(function(r2, n) {
              "use strict";
              if (!r2.setImmediate) {
                var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
                e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                  process.nextTick(function() {
                    c(e4);
                  });
                } : (function() {
                  if (r2.postMessage && !r2.importScripts) {
                    var e4 = true, t3 = r2.onmessage;
                    return r2.onmessage = function() {
                      e4 = false;
                    }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                  }
                })() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                  r2.postMessage(a + e4, "*");
                }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                  c(e4.data);
                }, function(e4) {
                  t2.port2.postMessage(e4);
                }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                  var t3 = l.createElement("script");
                  t3.onreadystatechange = function() {
                    c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                  }, s.appendChild(t3);
                }) : function(e4) {
                  setTimeout(c, 0, e4);
                }, e3.setImmediate = function(e4) {
                  "function" != typeof e4 && (e4 = new Function("" + e4));
                  for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                  var n2 = { callback: e4, args: t3 };
                  return h[o] = n2, i(o), o++;
                }, e3.clearImmediate = f;
              }
              function f(e4) {
                delete h[e4];
              }
              function c(e4) {
                if (u) setTimeout(c, 0, e4);
                else {
                  var t3 = h[e4];
                  if (t3) {
                    u = true;
                    try {
                      !(function(e5) {
                        var t4 = e5.callback, r3 = e5.args;
                        switch (r3.length) {
                          case 0:
                            t4();
                            break;
                          case 1:
                            t4(r3[0]);
                            break;
                          case 2:
                            t4(r3[0], r3[1]);
                            break;
                          case 3:
                            t4(r3[0], r3[1], r3[2]);
                            break;
                          default:
                            t4.apply(n, r3);
                        }
                      })(t3);
                    } finally {
                      f(e4), u = false;
                    }
                  }
                }
              }
              function d(e4) {
                e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
              }
            })("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
          }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
        }, {}] }, {}, [10])(10);
      });
    }
  });

  // ../../packages/cyrene-core/src/index.js
  var index_exports = {};
  __export(index_exports, {
    ALGORITHM_NAME: () => ALGORITHM_NAME,
    ALGORITHM_VERSION: () => ALGORITHM_VERSION,
    CNRP_MAGIC: () => CNRP_MAGIC,
    DEFAULT_CYRENE_BALANCE_SETTINGS: () => DEFAULT_CYRENE_BALANCE_SETTINGS,
    DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
    HOST_BRIDGE_METHODS: () => HOST_BRIDGE_METHODS,
    HOST_BRIDGE_VERSION: () => HOST_BRIDGE_VERSION,
    PLUGIN_API_VERSION: () => PLUGIN_API_VERSION,
    PLUGIN_PERMISSIONS: () => PLUGIN_PERMISSIONS,
    TARGET_GAP: () => TARGET_GAP,
    UI_TREE_CONTROL_TYPES: () => UI_TREE_CONTROL_TYPES,
    UI_TREE_NODE_TYPES: () => UI_TREE_NODE_TYPES,
    UI_TREE_SCHEMA_VERSION: () => UI_TREE_SCHEMA_VERSION,
    buildRenderPlan: () => buildRenderPlan,
    comparePluginVersions: () => comparePluginVersions,
    computeCyreneBalanceProbability: () => computeCyreneBalanceProbability,
    createHostBridgeError: () => createHostBridgeError,
    createHostBridgeResult: () => createHostBridgeResult,
    decodePluginFile: () => decodePluginFile,
    executeCoreCardRequest: () => executeCoreCardRequest,
    executeCoreDrawRequest: () => executeCoreDrawRequest,
    executeCoreMaintenanceRequest: () => executeCoreMaintenanceRequest,
    normalizeAnimationPack: () => normalizeAnimationPack,
    normalizeAutoStopDuration: () => normalizeAutoStopDuration,
    normalizeCoreCaller: () => normalizeCoreCaller,
    normalizeCoreCardInput: () => normalizeCoreCardInput,
    normalizeCoreCommitState: () => normalizeCoreCommitState,
    normalizeCoreDrawInput: () => normalizeCoreDrawInput,
    normalizeCoreMaintenanceInput: () => normalizeCoreMaintenanceInput,
    normalizeCyreneBalanceSettings: () => normalizeCyreneBalanceSettings,
    normalizeFloatingWindowSize: () => normalizeFloatingWindowSize,
    normalizeFloatingWindowStyle: () => normalizeFloatingWindowStyle,
    normalizeHostBridgeRequest: () => normalizeHostBridgeRequest,
    normalizePluginManifest: () => normalizePluginManifest,
    normalizeStoredSettings: () => normalizeStoredSettings,
    normalizeUiSection: () => normalizeUiSection,
    normalizeUiTree: () => normalizeUiTree,
    parsePluginPackage: () => parsePluginPackage,
    permissionForMethod: () => permissionForMethod,
    personKey: () => personKey,
    pickCyreneBalanced: () => pickCyreneBalanced,
    pickCyreneBatch: () => pickCyreneBatch,
    satisfiesPluginVersion: () => satisfiesPluginVersion,
    secureRandom: () => secureRandom,
    sha256Hex: () => sha256Hex,
    validateHostBridgeImplementation: () => validateHostBridgeImplementation,
    validatePath: () => validatePath
  });

  // ../../packages/cyrene-core/src/balance.js
  var ALGORITHM_VERSION = "3.1.1";
  var ALGORITHM_NAME = "cyrenenameroller-balance/v3";
  var TARGET_GAP = 2;
  var COLD_START_ROUNDS = 2;
  var INTERNAL_SENSITIVITY = 0.7;
  var INTERNAL_MAX_RATIO = 3;
  var OVERFLOW_PENALTY = 0.2;
  var RECOVERY_DECAY = 0.08;
  var GUARD_FLOOR = 0.01;
  var MAX_SELECTION_PROBABILITY = 0.3;
  var UINT32_RANGE = 4294967296;
  var DEFAULT_CYRENE_BALANCE_SETTINGS = {
    enabled: true,
    algorithm: ALGORITHM_NAME
  };
  function personKey(person) {
    if (person && typeof person === "object") return String(person.id || person.cn || "");
    return String(person || "");
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function capWeightShares(weightMap, names) {
    if (names.length <= 1) return weightMap;
    const maxShare = Math.max(MAX_SELECTION_PROBABILITY, 1 / names.length);
    let totalWeight = 0;
    let highestWeight = 0;
    for (const name of names) {
      const weight = weightMap.get(personKey(name)) || 0;
      totalWeight += weight;
      highestWeight = Math.max(highestWeight, weight);
    }
    if (totalWeight <= 0 || highestWeight / totalWeight <= maxShare) return weightMap;
    const remaining = new Set(names.map(personKey));
    const shares = /* @__PURE__ */ new Map();
    let remainingMass = 1;
    while (remaining.size > 0) {
      const remainingNames = [...remaining];
      const totalWeight2 = remainingNames.reduce((sum, name) => sum + (weightMap.get(name) || 0), 0);
      const newlyCapped = remainingNames.filter((name) => {
        const share = totalWeight2 > 0 ? (weightMap.get(name) || 0) / totalWeight2 * remainingMass : remainingMass / remaining.size;
        return share > maxShare;
      });
      if (newlyCapped.length === 0) {
        remainingNames.forEach((name) => {
          const share = totalWeight2 > 0 ? (weightMap.get(name) || 0) / totalWeight2 * remainingMass : remainingMass / remaining.size;
          shares.set(name, share);
        });
        break;
      }
      newlyCapped.forEach((name) => {
        shares.set(name, maxShare);
        remaining.delete(name);
        remainingMass -= maxShare;
      });
    }
    return shares;
  }
  function getCount(countsMap, person) {
    const key = personKey(person);
    const value = Number(countsMap?.[key]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  function normalizeCyreneBalanceSettings(raw) {
    const settings = { ...DEFAULT_CYRENE_BALANCE_SETTINGS };
    if (!raw || typeof raw !== "object") return settings;
    settings.enabled = raw.enabled !== false;
    return settings;
  }
  function secureRandom() {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      globalThis.crypto.getRandomValues(value);
      return value[0] / UINT32_RANGE;
    }
    return Math.random();
  }
  function createWeightMap(names, whiteList, countsMap, rawSettings) {
    const settings = normalizeCyreneBalanceSettings(rawSettings);
    const whiteListSet = new Set((whiteList || []).map(personKey));
    const regularNames = names.filter((name) => !whiteListSet.has(personKey(name)));
    const weights = new Map(names.map((name) => [personKey(name), 1]));
    if (!settings.enabled || regularNames.length === 0) return weights;
    const counts = new Array(regularNames.length);
    let totalDraws = 0;
    let minCount = Number.POSITIVE_INFINITY;
    let maxCount = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < regularNames.length; index++) {
      const count = getCount(countsMap, regularNames[index]);
      counts[index] = count;
      totalDraws += count;
      minCount = Math.min(minCount, count);
      maxCount = Math.max(maxCount, count);
    }
    const expectedCount = totalDraws / regularNames.length;
    const gap = maxCount - minCount;
    const warmup = clamp(totalDraws / (regularNames.length * COLD_START_ROUNDS), 0, 1);
    const gapPressure = clamp(gap / TARGET_GAP, 0, 2);
    const adaptiveGain = INTERNAL_SENSITIVITY * (0.35 + 0.65 * gapPressure);
    const rawLogWeights = new Array(counts.length);
    let rawMin = Number.POSITIVE_INFINITY;
    let rawMax = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < counts.length; index++) {
      const weight = -adaptiveGain * (counts[index] - expectedCount);
      rawLogWeights[index] = weight;
      rawMin = Math.min(rawMin, weight);
      rawMax = Math.max(rawMax, weight);
    }
    const midpoint = (rawMin + rawMax) / 2;
    const halfLogRange = Math.log(INTERNAL_MAX_RATIO) / 2;
    const minCountOccurrences = counts.reduce((total, count) => total + (count === minCount ? 1 : 0), 0);
    const secondMinCount = counts.reduce((second, count) => count > minCount && count < second ? count : second, Number.POSITIVE_INFINITY);
    regularNames.forEach((name, index) => {
      const centered = rawLogWeights[index] - midpoint;
      const bounded = clamp(centered, -halfLogRange, halfLogRange);
      const projectedCount = counts[index] + 1;
      const projectedMin = counts[index] === minCount && minCountOccurrences === 1 ? Math.min(projectedCount, secondMinCount) : minCount;
      const projectedGap = Math.max(maxCount, projectedCount) - projectedMin;
      let guard = 1;
      if (gap > TARGET_GAP && counts[index] > minCount) {
        guard = Math.max(GUARD_FLOOR, RECOVERY_DECAY ** (counts[index] - minCount));
      } else if (gap <= TARGET_GAP && projectedGap > TARGET_GAP) {
        guard = OVERFLOW_PENALTY;
      }
      weights.set(personKey(name), Math.exp(bounded * warmup) * guard);
    });
    return capWeightShares(weights, names);
  }
  function getAvailableNames(names, excludeList, allowDuplicates) {
    if (allowDuplicates || !excludeList?.length) return names;
    const excluded = new Set(excludeList.map(personKey));
    return names.filter((name) => !excluded.has(personKey(name)));
  }
  function computeCyreneBalanceProbability(names, whiteList, countsMap, settings) {
    if (!Array.isArray(names) || names.length === 0) return {};
    const weightMap = createWeightMap(names, whiteList, countsMap, settings);
    const totalWeight = names.reduce((sum, name) => sum + (weightMap.get(personKey(name)) || 1), 0);
    const probabilities = {};
    names.forEach((name) => {
      probabilities[personKey(name)] = (weightMap.get(personKey(name)) || 1) / totalWeight * 100;
    });
    return probabilities;
  }
  function pickCyreneBalanced(names, whiteList, countsMap, settings, excludeList = [], allowDuplicates = true, random = secureRandom) {
    const available = getAvailableNames(names, excludeList, allowDuplicates);
    const whiteListSet = new Set((whiteList || []).map(personKey));
    if (available.length === 0) {
      return { cn: "(\u6CA1\u4EBA\u9009\u4E86!)", en: "(No one left!)" };
    }
    const weightMap = createWeightMap(available, whiteList, countsMap, settings);
    let totalWeight = 0;
    for (const name of available) totalWeight += weightMap.get(personKey(name)) || 1;
    const randomValue = clamp(Number(random()) || 0, 0, 1 - Number.EPSILON);
    let threshold = randomValue * totalWeight;
    for (let index = 0; index < available.length; index++) {
      threshold -= weightMap.get(personKey(available[index])) || 1;
      if (threshold < 0) {
        const selected2 = available[index];
        return {
          id: selected2.id,
          cn: selected2.cn,
          en: selected2.en,
          index: names.indexOf(selected2),
          isWhiteList: whiteListSet.has(personKey(selected2))
        };
      }
    }
    const selected = available[available.length - 1];
    return {
      id: selected.id,
      cn: selected.cn,
      en: selected.en,
      index: names.indexOf(selected),
      isWhiteList: whiteListSet.has(personKey(selected))
    };
  }
  function pickCyreneBatch(names, whiteList, countsMap, settings, drawCount, allowDuplicates = true, random = secureRandom) {
    const localCounts = { ...countsMap || {} };
    const excluded = [];
    const picks = [];
    const requestedCount = Math.max(0, Math.floor(Number(drawCount) || 0));
    const limit = allowDuplicates ? requestedCount : Math.min(requestedCount, names.length);
    for (let index = 0; index < limit; index++) {
      const pick = pickCyreneBalanced(
        names,
        whiteList,
        localCounts,
        settings,
        excluded,
        allowDuplicates,
        random
      );
      if (!pick.cn || pick.cn === "(\u6CA1\u4EBA\u9009\u4E86!)") break;
      picks.push(pick);
      if (!allowDuplicates) excluded.push(personKey(pick));
      if (!pick.isWhiteList) {
        localCounts[personKey(pick)] = getCount(localCounts, pick) + 1;
      }
    }
    return picks;
  }

  // ../../packages/cyrene-core/src/protocol.js
  var DRAW_INPUT_FIELDS = /* @__PURE__ */ new Set(["listId", "target", "count", "allowDuplicates", "gender"]);
  var CARD_INPUT_FIELDS = /* @__PURE__ */ new Set(["listId", "personIds"]);
  var MAINTENANCE_ACTIONS = /* @__PURE__ */ new Set(["clear-records", "initialize-person-count"]);
  var COMMIT_FIELDS = /* @__PURE__ */ new Set(["nextStatistics", "nextRecords"]);
  var RECORD_FIELDS = /* @__PURE__ */ new Set(["personId", "listId", "groupId", "source", "pluginId", "operationId", "time"]);
  function coreError(code, message) {
    return Object.assign(new Error(message), { code });
  }
  function normalizeCoreDrawInput(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "draw.execute \u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61");
    const unsupported = Object.keys(raw).find((key) => !DRAW_INPUT_FIELDS.has(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `draw.execute \u4E0D\u5141\u8BB8\u6307\u5B9A\u53C2\u6570 ${unsupported}`);
    return {
      listId: String(raw.listId || ""),
      target: raw.target === "groups" ? "groups" : "people",
      count: Math.max(1, Math.min(100, Math.floor(Number(raw.count) || 1))),
      allowDuplicates: raw.allowDuplicates === true,
      gender: ["male", "female"].includes(raw.gender) ? raw.gender : "all"
    };
  }
  function normalizeCoreCaller(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "Core \u8C03\u7528\u65B9\u65E0\u6548");
    const kind = raw.kind === "plugin" ? "plugin" : raw.kind === "core-ui" ? "core-ui" : "";
    const pluginId = String(raw.pluginId || "");
    if (!kind || !pluginId) throw coreError("CORE_TRANSACTION_REJECTED", "Core \u8C03\u7528\u65B9\u65E0\u6548");
    return {
      kind,
      pluginId: kind === "core-ui" ? "core" : pluginId,
      operationId: String(raw.operationId || ""),
      countStatistics: raw.countStatistics !== false
    };
  }
  function normalizeCoreCardInput(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "card.commit input must be an object");
    const unsupported = Object.keys(raw).find((key) => !CARD_INPUT_FIELDS.has(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `card.commit does not allow field ${unsupported}`);
    const personIds = Array.isArray(raw.personIds) ? [...new Set(raw.personIds.map((value) => String(value || "")).filter(Boolean))] : [];
    if (!personIds.length || personIds.length > 100) throw coreError("CORE_TRANSACTION_REJECTED", "card.commit requires 1 to 100 person IDs");
    return {
      listId: String(raw.listId || ""),
      personIds
    };
  }
  function normalizeCoreMaintenanceInput(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "maintenance input must be an object");
    const unsupported = Object.keys(raw).find((key) => !["action", "listId", "personId", "mode"].includes(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `maintenance does not allow field ${unsupported}`);
    const action = String(raw.action || "");
    if (!MAINTENANCE_ACTIONS.has(action)) throw coreError("CORE_TRANSACTION_REJECTED", "maintenance action is not allowed");
    if (action === "clear-records") {
      if (raw.listId !== void 0 || raw.personId !== void 0 || raw.mode !== void 0) throw coreError("CORE_TRANSACTION_REJECTED", "clear-records does not accept additional fields");
      return { action };
    }
    const listId = String(raw.listId || "");
    const personId = String(raw.personId || "");
    const mode = raw.mode === "zero" ? "zero" : raw.mode === "midpoint" ? "midpoint" : "";
    if (!listId || !personId || !mode) throw coreError("CORE_TRANSACTION_REJECTED", "initialize-person-count requires listId, personId and mode");
    return { action, listId, personId, mode };
  }
  function normalizeCoreCommitState(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "Core commit must be an object");
    const unsupported = Object.keys(raw).find((key) => !COMMIT_FIELDS.has(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `Core commit does not allow field ${unsupported}`);
    const statistics = raw.nextStatistics;
    if (!statistics || typeof statistics !== "object" || Array.isArray(statistics) || !statistics.counts || typeof statistics.counts !== "object" || Array.isArray(statistics.counts) || !Number.isSafeInteger(statistics.totalCount) || statistics.totalCount < 0) {
      throw coreError("CORE_TRANSACTION_REJECTED", "Core commit statistics are invalid");
    }
    if (Object.entries(statistics.counts).some(([key, value]) => !key || key.length > 256 || !Number.isSafeInteger(value) || value < 0)) {
      throw coreError("CORE_TRANSACTION_REJECTED", "Core commit counts are invalid");
    }
    if (!Array.isArray(raw.nextRecords) || raw.nextRecords.length > 500) throw coreError("CORE_TRANSACTION_REJECTED", "Core commit records are invalid");
    for (const record of raw.nextRecords) {
      if (!record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).some((key) => !RECORD_FIELDS.has(key)) || !["string", "object"].includes(typeof record.personId) || record.personId !== null && typeof record.personId !== "string" || !["string", "object"].includes(typeof record.listId) || record.listId !== null && typeof record.listId !== "string" || !["string", "object"].includes(typeof record.groupId) || record.groupId !== null && typeof record.groupId !== "string" || typeof record.source !== "string" || typeof record.pluginId !== "string" || typeof record.operationId !== "string" || !Number.isFinite(record.time) || record.time < 0) {
        throw coreError("CORE_TRANSACTION_REJECTED", "Core commit record is invalid");
      }
    }
    return {
      nextStatistics: JSON.parse(JSON.stringify(statistics)),
      nextRecords: JSON.parse(JSON.stringify(raw.nextRecords))
    };
  }
  var CORE_DRAW_INPUT_FIELDS = Object.freeze([...DRAW_INPUT_FIELDS]);
  var CORE_CARD_INPUT_FIELDS = Object.freeze([...CARD_INPUT_FIELDS]);
  var CORE_MAINTENANCE_ACTIONS = Object.freeze([...MAINTENANCE_ACTIONS]);

  // ../../packages/cyrene-core/src/core-service.js
  function coreError2(code, message) {
    return Object.assign(new Error(message), { code });
  }
  function executeCoreDrawRequest({ input: rawInput, caller: rawCaller, state, peopleCache }) {
    const input = normalizeCoreDrawInput(rawInput);
    const caller = normalizeCoreCaller(rawCaller);
    if (!state || typeof state !== "object" || Array.isArray(state)) throw coreError2("CORE_TRANSACTION_REJECTED", "Core \u72B6\u6001\u65E0\u6548");
    const list = state.names?.lists?.[input.listId];
    if (!list) throw coreError2("CORE_TRANSACTION_REJECTED", "\u62BD\u53D6\u540D\u5355\u4E0D\u5B58\u5728");
    const operationId = caller.operationId || crypto.randomUUID?.() || `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const committedAt = Date.now();
    let picks;
    if (input.target === "groups") {
      const groups = (list.groups || []).map((group) => ({ id: group.id, cn: group.name, en: group.enName || "", isGroup: true }));
      if ((list.names || []).some((person) => !person.groupId)) groups.push({ id: "__unassigned__", cn: "\u672A\u5206\u7EC4", en: "Unassigned", isGroup: true });
      if (!groups.length) throw coreError2("CORE_TRANSACTION_REJECTED", "\u6240\u9009\u540D\u5355\u6CA1\u6709\u53EF\u62BD\u53D6\u5C0F\u7EC4");
      const count = input.allowDuplicates ? input.count : Math.min(input.count, groups.length);
      const available = [...groups];
      picks = [];
      for (let index = 0; index < count; index += 1) {
        const pool = input.allowDuplicates ? groups : available;
        const selectedIndex = Math.min(pool.length - 1, Math.floor(secureRandom() * pool.length));
        picks.push(pool[selectedIndex]);
        if (!input.allowDuplicates) available.splice(selectedIndex, 1);
      }
    } else {
      const cacheKey = `${input.listId}:${input.gender}`;
      let eligible = peopleCache?.get(cacheKey);
      if (!eligible) {
        const people2 = (list.names || []).filter((person) => person.cn && person.cn !== "\u518D\u6765\u4E00\u6B21" && (input.gender === "all" || person.gender === input.gender));
        eligible = { people: people2, whiteList: people2.filter((person) => person.isWhiteList) };
        peopleCache?.set(cacheKey, eligible);
      }
      const { people, whiteList } = eligible;
      if (!people.length) throw coreError2("CORE_TRANSACTION_REJECTED", "\u6240\u9009\u540D\u5355\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4EBA\u5458");
      const count = input.allowDuplicates ? input.count : Math.min(input.count, people.length);
      picks = pickCyreneBatch(people, whiteList, state.statistics?.counts || {}, normalizeCyreneBalanceSettings(state.balance), count, input.allowDuplicates);
    }
    const results = picks.map((pick) => ({ id: pick.id || "", name: pick.cn || "", englishName: pick.en || "", isGroup: !!pick.isGroup, isWhiteList: !!pick.isWhiteList }));
    const receipt = {
      operationId,
      pluginId: caller.pluginId,
      listId: input.listId,
      target: input.target,
      count: results.length,
      allowDuplicates: input.allowDuplicates,
      gender: input.gender,
      algorithm: input.target === "people" ? ALGORITHM_NAME : "host-random/groups",
      algorithmVersion: input.target === "people" ? ALGORITHM_VERSION : "1",
      committedAt,
      results
    };
    const nextStatistics = { counts: { ...state.statistics?.counts || {} }, totalCount: Math.max(0, Number(state.statistics?.totalCount) || 0) };
    if (caller.countStatistics && input.target === "people") {
      for (const pick of picks) {
        if (pick.isWhiteList) continue;
        const key = personKey(pick);
        if (!key) continue;
        nextStatistics.counts[key] = (Number(nextStatistics.counts[key]) || 0) + 1;
        nextStatistics.totalCount += 1;
      }
    }
    const source = caller.kind === "plugin" ? `plugin:${caller.pluginId}` : "roller";
    const appended = picks.map((pick) => ({
      personId: pick.isGroup ? null : pick.id || null,
      listId: input.listId,
      groupId: pick.isGroup ? pick.id : null,
      source,
      pluginId: caller.kind === "plugin" ? caller.pluginId : "",
      operationId,
      time: committedAt
    }));
    const nextRecords = [...appended, ...Array.isArray(state.records) ? state.records : []].slice(0, 500);
    return { receipt, nextStatistics, nextRecords };
  }
  function executeCoreCardRequest({ input: rawInput, caller: rawCaller, state }) {
    const input = normalizeCoreCardInput(rawInput);
    const caller = normalizeCoreCaller(rawCaller);
    if (caller.kind !== "core-ui") throw coreError2("PLUGIN_PERMISSION_DENIED", "card.commit \u4EC5\u5141\u8BB8\u5BBF\u4E3B\u754C\u9762\u8C03\u7528");
    if (!state || typeof state !== "object" || Array.isArray(state)) throw coreError2("CORE_TRANSACTION_REJECTED", "Core \u72B6\u6001\u65E0\u6548");
    const list = state.names?.lists?.[input.listId];
    if (!list) throw coreError2("CORE_TRANSACTION_REJECTED", "\u5361\u724C\u540D\u5355\u4E0D\u5B58\u5728");
    const people = Array.isArray(list.names) ? list.names : [];
    const byId = new Map(people.map((person) => [String(person?.id || ""), person]));
    const selected = input.personIds.map((id) => byId.get(id));
    if (selected.some((person) => !person || person.isWhiteList)) throw coreError2("CORE_TRANSACTION_REJECTED", "\u5361\u724C\u7ED3\u679C\u4E0D\u5C5E\u4E8E\u5F53\u524D\u53EF\u62BD\u53D6\u540D\u5355");
    const operationId = caller.operationId || crypto.randomUUID?.() || `card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const committedAt = Date.now();
    const results = selected.map((person) => ({ id: String(person.id), name: String(person.cn || ""), englishName: String(person.en || "") }));
    const receipt = { kind: "card", operationId, pluginId: caller.pluginId, listId: input.listId, count: results.length, committedAt, results };
    const appended = results.map((result) => ({
      personId: result.id,
      listId: input.listId,
      groupId: null,
      source: "card",
      pluginId: "",
      operationId,
      time: committedAt
    }));
    const nextRecords = [...appended, ...Array.isArray(state.records) ? state.records : []].slice(0, 500);
    return { receipt, nextStatistics: { ...state.statistics || { counts: {}, totalCount: 0 }, counts: { ...state.statistics?.counts || {} } }, nextRecords };
  }
  function executeCoreMaintenanceRequest({ input: rawInput, caller: rawCaller, state }) {
    const input = normalizeCoreMaintenanceInput(rawInput);
    const caller = normalizeCoreCaller(rawCaller);
    if (caller.kind !== "core-ui") throw coreError2("PLUGIN_PERMISSION_DENIED", "maintenance is host-only");
    if (!state || typeof state !== "object" || Array.isArray(state)) throw coreError2("CORE_TRANSACTION_REJECTED", "Core state is invalid");
    const nextStatistics = { ...state.statistics || { counts: {}, totalCount: 0 }, counts: { ...state.statistics?.counts || {} } };
    let nextRecords = Array.isArray(state.records) ? [...state.records] : [];
    if (input.action === "clear-records") {
      nextRecords = [];
    } else {
      const list = state.names?.lists?.[input.listId];
      const people = Array.isArray(list?.names) ? list.names : [];
      const person = people.find((item) => String(item?.id || "") === input.personId);
      if (!person || person.isWhiteList) throw coreError2("CORE_TRANSACTION_REJECTED", "person is not eligible for statistics initialization");
      if (nextStatistics.counts[input.personId] === void 0) {
        const existingCounts = people.filter((item) => String(item?.id || "") !== input.personId && !item?.isWhiteList && item?.cn).map((item) => Number(nextStatistics.counts[String(item.id || "")]) || 0);
        let minCount = Number.POSITIVE_INFINITY;
        let maxCount = Number.NEGATIVE_INFINITY;
        for (const count of existingCounts) {
          minCount = Math.min(minCount, count);
          maxCount = Math.max(maxCount, count);
        }
        const initialCount = input.mode === "zero" || existingCounts.length === 0 ? 0 : Math.round((minCount + maxCount) / 2);
        nextStatistics.counts[input.personId] = initialCount;
        nextStatistics.totalCount = Math.max(0, Number(nextStatistics.totalCount) || 0) + initialCount;
      }
    }
    const committedAt = Date.now();
    return {
      receipt: {
        kind: "maintenance",
        action: input.action,
        operationId: caller.operationId || `maintenance-${committedAt}`,
        pluginId: "core",
        committedAt
      },
      nextStatistics,
      nextRecords
    };
  }

  // ../../packages/cyrene-core/src/storage.js
  var DEFAULT_SETTINGS = {
    recordCounts: true,
    rainbowNames: true,
    englishMode: false,
    language: "zh",
    groupMode: false,
    multiMode: false,
    peopleCount: 2,
    allowDuplicates: false,
    forbidDuplicates: false,
    multiStepStop: true,
    autoStop: false,
    autoStopDuration: 3,
    finishAnimation: "spotlight",
    stepStopInterval: 0.15,
    theme: "default",
    colorTheme: "peach",
    customThemeColor: "#0078d4",
    downloadSource: "ghproxy",
    particles: true,
    blur: true,
    animSpeed: 1,
    uiScale: 100,
    uiScaleVersion: 2,
    nameFontSize: 1,
    fontFamily: "MiSans",
    darkMode: false,
    nameColorMode: "gradient",
    customNameColorLight: "#d04a9d",
    customNameColorDark: "#f09bd7",
    perfBlur: true,
    perfShadows: true,
    perfAnimations: true,
    dockCollapsed: false,
    disableSplash: false,
    floatingWindowEnabled: false,
    floatingWindowStyle: "text",
    floatingWindowSize: 64,
    floatingCompassHintDismissed: false,
    autoStart: false,
    autoStartMode: "registry",
    autoStartToTray: false,
    uriSchemeEnabled: false,
    newMemberCountMode: "midpoint"
  };
  var FLOATING_WINDOW_STYLES = ["text", "image1", "image2", "image3"];
  var MIN_FLOATING_WINDOW_SIZE = 40;
  var MAX_FLOATING_WINDOW_SIZE = 256;
  var FLOATING_WINDOW_SIZE_STEP = 4;
  var DEFAULT_FLOATING_WINDOW_SIZE = 64;
  var DEFAULT_AUTO_STOP_DURATION = 3;
  var MIN_AUTO_STOP_DURATION = 1;
  var MAX_AUTO_STOP_DURATION = 60;
  function normalizeFloatingWindowStyle(value) {
    return FLOATING_WINDOW_STYLES.includes(value) ? value : "text";
  }
  function normalizeFloatingWindowSize(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return DEFAULT_FLOATING_WINDOW_SIZE;
    const rounded = Math.round(number / FLOATING_WINDOW_SIZE_STEP) * FLOATING_WINDOW_SIZE_STEP;
    return Math.min(MAX_FLOATING_WINDOW_SIZE, Math.max(MIN_FLOATING_WINDOW_SIZE, rounded));
  }
  function normalizeAutoStopDuration(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_AUTO_STOP_DURATION;
    return Math.min(MAX_AUTO_STOP_DURATION, Math.max(MIN_AUTO_STOP_DURATION, Math.round(parsed)));
  }
  function normalizeStoredSettings(raw) {
    const hasSaved = raw && typeof raw === "object" && !Array.isArray(raw);
    const saved = hasSaved ? raw : {};
    const settings = { ...DEFAULT_SETTINGS, ...saved };
    if (hasSaved && (!saved.uiScaleVersion || saved.uiScaleVersion < 2)) {
      settings.uiScale = Math.round((saved.uiScale || 100) * 0.8);
      settings.uiScaleVersion = 2;
    }
    settings.newMemberCountMode = settings.newMemberCountMode === "zero" ? "zero" : "midpoint";
    settings.floatingWindowStyle = normalizeFloatingWindowStyle(settings.floatingWindowStyle);
    settings.floatingWindowSize = normalizeFloatingWindowSize(settings.floatingWindowSize);
    settings.autoStopDuration = normalizeAutoStopDuration(settings.autoStopDuration);
    return settings;
  }

  // ../../packages/cyrene-core/src/host-bridge.js
  var HOST_BRIDGE_VERSION = "1.0.0";
  var HOST_BRIDGE_METHODS = Object.freeze([
    { id: "runtime.platform", permission: null, group: "platform", description: "\u5BBF\u4E3B\u5E73\u53F0\u4FE1\u606F" },
    { id: "runtime.capabilities", permission: null, group: "platform", description: "\u5BBF\u4E3B\u80FD\u529B\u58F0\u660E" },
    { id: "host.describe", permission: null, group: "host", description: "\u5BBF\u4E3B\u73AF\u5883\u63CF\u8FF0" },
    { id: "storage.read", permission: "storage:read", group: "storage", description: "\u8BFB\u53D6\u63D2\u4EF6\u5B58\u50A8" },
    { id: "storage.write", permission: "storage:write", group: "storage", description: "\u5199\u5165\u63D2\u4EF6\u5B58\u50A8" },
    { id: "dependency.storage.read", permission: null, group: "storage", description: "\u8BFB\u53D6\u524D\u7F6E\u63D2\u4EF6\u5171\u4EAB\u6570\u636E\uFF08\u9700\u53CC\u65B9\u58F0\u660E\uFF09" },
    { id: "names.read", permission: "names:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u540D\u5355" },
    { id: "records.read", permission: "records:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u8BB0\u5F55" },
    { id: "statistics.read", permission: "statistics:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u7EDF\u8BA1" },
    { id: "balance.read", permission: "balance:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u5E73\u8861\u914D\u7F6E" },
    { id: "resources.query", permission: null, group: "core-snapshot", description: "\u5BBF\u4E3B\u8D44\u6E90\u67E5\u8BE2\uFF08\u767D\u540D\u5355\uFF09" },
    { id: "draw.execute", permission: "draw:execute", group: "core-transaction", description: "\u6267\u884C\u62BD\u53D6\u4E8B\u52A1" },
    { id: "transactions.execute", permission: null, group: "core-transaction", description: "\u5BBF\u4E3B\u4E8B\u52A1\uFF08\u767D\u540D\u5355\uFF09" },
    { id: "notifications.show", permission: "notifications:show", group: "ui", description: "\u663E\u793A\u901A\u77E5\u6A2A\u5E45" },
    { id: "audio.select", permission: "audio:select", group: "audio", description: "\u9009\u62E9\u672C\u5730\u97F3\u9891\u6587\u4EF6" },
    { id: "audio.play", permission: "audio:play", group: "audio", description: "\u64AD\u653E\u5DF2\u9009\u62E9\u97F3\u9891\uFF08data: URL\uFF09" },
    { id: "system.open-url", permission: "system:open-url", group: "system", description: "\u6253\u5F00\u5916\u90E8\u94FE\u63A5" },
    { id: "system.select-file", permission: "system:select-file", group: "system", description: "\u9009\u62E9\u6587\u4EF6" },
    { id: "system.select-directory", permission: "system:select-directory", group: "system", description: "\u9009\u62E9\u76EE\u5F55" },
    { id: "system.clipboard-read", permission: "system:clipboard-read", group: "system", description: "\u8BFB\u53D6\u526A\u8D34\u677F" },
    { id: "system.clipboard-write", permission: "system:clipboard-write", group: "system", description: "\u5199\u5165\u526A\u8D34\u677F" },
    { id: "system.reveal-file", permission: "system:reveal-file", group: "system", description: "\u8D44\u6E90\u7BA1\u7406\u5668\u4E2D\u663E\u793A\u6587\u4EF6" },
    { id: "system.execute", permission: "system:execute", group: "system", description: "\u6267\u884C\u53D7\u7BA1\u7CFB\u7EDF\u64CD\u4F5C\uFF08\u767D\u540D\u5355\u547D\u4EE4\uFF09" },
    { id: "ui.render", permission: "ui:pages", group: "ui", description: "SDK v2\uFF1A\u6E32\u67D3 UI \u58F0\u660E\u6811" },
    { id: "ui.action", permission: "ui:pages", group: "ui", description: "SDK v2\uFF1AUI \u4E8B\u4EF6\u56DE\u4F20" }
  ]);
  function permissionForMethod(method) {
    return HOST_BRIDGE_METHODS.find((item) => item.id === method)?.permission || null;
  }
  function validateHostBridgeImplementation(impl) {
    const missing = HOST_BRIDGE_METHODS.filter((item) => typeof impl?.[item.id] !== "function").map((item) => item.id);
    if (missing.length) {
      throw new Error(`HostBridge \u5B9E\u73B0\u7F3A\u5C11\u65B9\u6CD5\uFF1A${missing.join(", ")}`);
    }
    return true;
  }
  var HOST_BRIDGE_REQUEST_FIELDS = Object.freeze(["method", "args", "requestId"]);
  function normalizeHostBridgeRequest(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("HostBridge \u8BF7\u6C42\u5FC5\u987B\u4E3A\u5BF9\u8C61");
    const unsupported = Object.keys(raw).find((key) => !HOST_BRIDGE_REQUEST_FIELDS.includes(key));
    if (unsupported) throw new Error(`HostBridge \u8BF7\u6C42\u4E0D\u5141\u8BB8\u5B57\u6BB5 ${unsupported}`);
    const method = String(raw.method || "");
    if (!HOST_BRIDGE_METHODS.some((item) => item.id === method)) throw new Error(`\u672A\u77E5 HostBridge \u65B9\u6CD5\uFF1A${method}`);
    const requestId = String(raw.requestId || "");
    if (!requestId || requestId.length > 128) throw new Error("HostBridge \u8BF7\u6C42\u7F3A\u5C11 requestId");
    const args = raw.args && typeof raw.args === "object" && !Array.isArray(raw.args) ? JSON.parse(JSON.stringify(raw.args)) : {};
    return { method, requestId, args };
  }
  function createHostBridgeResult(value) {
    return { ok: true, value: JSON.parse(JSON.stringify(value)) };
  }
  function createHostBridgeError(error) {
    return { ok: false, error: { code: error?.code || "HOST_BRIDGE_FAILED", message: String(error?.message || error) } };
  }

  // ../../packages/cyrene-core/src/ui-policies/component-registry.js
  var target = (id, policy, allowedStyles, extra = {}) => Object.freeze({
    id,
    platform: "all",
    visibilityPolicy: policy,
    allowedStyles: Object.freeze([...allowedStyles]),
    ...extra
  });
  var COMPONENT_TARGETS = Object.freeze({
    "app.title-bar": target("app.title-bar", "required", ["foreground", "background", "fontFamily", "fontSize", "fontWeight", "density"], { platform: "tauri", selector: ".titlebar" }),
    "app.version-badge": target("app.version-badge", "optional", ["foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".version-badge", allowPluginFonts: true }),
    "navigation.dock": target("navigation.dock", "required", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "density"], { selector: ".dock" }),
    "navigation.settings-entry": target("navigation.settings-entry", "protected", [], { selector: null, mappingStatus: "requires-host-boundary-wrapper" }),
    "roller.current-list": target("roller.current-list", "required", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".list-selector-bar", identity: true }),
    "roller.filters": target("roller.filters", "optional", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: [".switches", ".multi-settings"], allowedLayouts: ["collapse", "reserve", "compact"], allowPluginFonts: true }),
    "roller.primary-action": target("roller.primary-action", "required", ["size", "foreground", "background", "accent", "fontSize", "fontWeight", "fontFamily", "radius"], { selector: ".start-btn" }),
    "roller.result": target("roller.result", "protected", ["size", "foreground", "background", "accent", "fontFamily", "fontSize", "fontWeight", "padding", "gap", "radius", "borderColor", "borderWidth", "shadow", "alignment"], { selector: [".display-container", ".name-display"], authoritativeText: true, allowPluginFonts: false }),
    "card.controls": target("card.controls", "replaceable", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".card-controls" }),
    "card.deck": target("card.deck", "required", ["size", "padding", "gap", "foreground", "background"], { selector: ".cards-grid" }),
    "card.item": target("card.item", "required", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "radius", "shadow"], { selector: [".card", ".card-face"] }),
    "lottery.result": target("lottery.result", "protected", ["size", "foreground", "background", "accent", "fontFamily", "fontSize", "fontWeight", "padding", "gap", "radius", "borderColor", "borderWidth", "shadow", "alignment"], { selector: [".roller-result", ".wheel-result"], authoritativeText: true, allowPluginFonts: false }),
    "statistics.summary": target("statistics.summary", "optional", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".stats-summary" })
  });
  var COMPONENT_TARGET_IDS = Object.freeze(Object.keys(COMPONENT_TARGETS));
  var COMPONENT_STYLE_PROPERTIES = Object.freeze([
    "size",
    "scale",
    "foreground",
    "background",
    "accent",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "padding",
    "gap",
    "radius",
    "borderColor",
    "borderWidth",
    "shadow",
    "alignment",
    "density"
  ]);
  function getComponentTarget(id, platform = "web") {
    const descriptor = COMPONENT_TARGETS[String(id || "")];
    if (!descriptor) return null;
    if (descriptor.platform !== "all" && descriptor.platform !== platform) return { ...descriptor, available: false };
    return { ...descriptor, available: true };
  }

  // ../../packages/cyrene-core/src/ui-policies/style-policy.js
  var HOST_FONTS = /* @__PURE__ */ new Set(["host:ui", "host:display", "host:numeric"]);
  var FONT_ALIAS_PATTERN = /^plugin:([a-z0-9]+(?:[._-][a-z0-9]+)+)\/([a-z][a-z0-9._-]{0,63})$/;
  var COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  var RGB_PATTERN = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;
  var FORBIDDEN_VALUE = /url\s*\(|var\s*\(|calc\s*\(|env\s*\(|image-set\s*\(|@import|[{};<>\\]/i;
  var FORBIDDEN_PROPERTIES = /* @__PURE__ */ new Set(["selector", "css", "cssFile", "display", "visibility", "content", "position", "inset", "top", "left", "right", "bottom", "zIndex", "z-index", "pointerEvents", "pointer-events", "overflow", "transform", "opacity"]);
  function policyError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    Object.assign(error, details);
    return error;
  }
  function fail(code, message, details) {
    throw policyError(code, message, details);
  }
  function normalizeColor(value, label) {
    const source = String(value || "").trim();
    if (COLOR_PATTERN.test(source)) return source.toLowerCase();
    const rgb2 = source.match(RGB_PATTERN);
    if (!rgb2 || rgb2.slice(1, 4).some((channel) => Number(channel) > 255)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label} \u989C\u8272\u503C\u65E0\u6548`);
    if (source.toLowerCase().startsWith("rgba") && rgb2[4] === void 0) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label} rgba \u7F3A\u5C11\u900F\u660E\u5EA6`);
    return source.replace(/\s+/g, " ");
  }
  function rgb(value) {
    const source = String(value || "");
    const hex = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const raw = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
      return [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16));
    }
    const match = source.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    return match ? match.slice(1).map(Number) : null;
  }
  function contrastRatio(foreground, background) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color) => color.map(channel).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground);
    const second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }
  var RANGE = {
    scale: [0.8, 1.5],
    lineHeight: [1.1, 1.8],
    radius: [0, 16],
    borderWidth: [0, 3],
    fontSize: [8, 120],
    fontWeight: [400, 800]
  };
  var ENUMS = {
    size: /* @__PURE__ */ new Set(["small", "medium", "large"]),
    padding: /* @__PURE__ */ new Set(["compact", "normal", "comfortable"]),
    gap: /* @__PURE__ */ new Set(["compact", "normal", "comfortable"]),
    shadow: /* @__PURE__ */ new Set(["none", "small", "medium", "large"]),
    alignment: /* @__PURE__ */ new Set(["start", "center", "end"]),
    density: /* @__PURE__ */ new Set(["compact", "normal", "comfortable"])
  };
  var TARGET_SIZE_VALUES = Object.freeze({
    "navigation.dock": { small: "200px", medium: "240px", large: "280px" },
    "roller.current-list": { small: "280px", medium: "360px", large: "480px" },
    "roller.filters": { small: "240px", medium: "280px", large: "340px" },
    "roller.primary-action": { small: "240px", medium: "280px", large: "340px" },
    "roller.result": { small: "44px", medium: "64px", large: "88px" },
    "card.controls": { small: "64px", medium: "80px", large: "96px" },
    "card.deck": { small: "120px", medium: "140px", large: "170px" },
    "card.item": { small: "120px", medium: "140px", large: "170px" },
    "lottery.result": { small: "32px", medium: "48px", large: "72px" },
    "statistics.summary": { small: "64px", medium: "80px", large: "96px" }
  });
  var TARGET_DENSITY_VALUES = Object.freeze({
    "app.title-bar": { compact: "34px", normal: "40px", comfortable: "48px" },
    "navigation.dock": { compact: "6px", normal: "8px", comfortable: "12px" }
  });
  function normalizeProperty(property, value, descriptor, label, pluginId = "") {
    if (FORBIDDEN_PROPERTIES.has(property) || !COMPONENT_STYLE_PROPERTIES.includes(property)) fail("PLUGIN_UI_PROPERTY_NOT_ALLOWED", `${label}.${property} \u4E0D\u5141\u8BB8`);
    if (!descriptor.allowedStyles.includes(property)) fail(descriptor.visibilityPolicy === "protected" ? "PLUGIN_UI_PROTECTED_TARGET" : "PLUGIN_UI_PROPERTY_NOT_ALLOWED", `${label}.${property} \u4E0D\u5141\u8BB8\u7528\u4E8E\u76EE\u6807 ${descriptor.id}`);
    if (["foreground", "background", "accent", "borderColor"].includes(property)) return normalizeColor(value, `${label}.${property}`);
    if (property === "fontFamily") {
      const font = String(value || "");
      if (HOST_FONTS.has(font)) return font;
      const match = font.match(FONT_ALIAS_PATTERN);
      if (!match || pluginId && match[1] !== pluginId || descriptor.allowPluginFonts !== true) fail(descriptor.allowPluginFonts !== true ? "PLUGIN_UI_FONT_NOT_ALLOWED_FOR_TARGET" : "PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.fontFamily \u4E0D\u5141\u8BB8`);
      return font;
    }
    if (RANGE[property]) {
      const number = Number(value);
      if (!Number.isFinite(number) || number < RANGE[property][0] || number > RANGE[property][1] || property === "fontWeight" && ![400, 500, 600, 700, 800].includes(number)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.${property} \u8D85\u51FA\u5141\u8BB8\u8303\u56F4`);
      return number;
    }
    if (ENUMS[property]) {
      const normalized = String(value);
      if (!ENUMS[property].has(normalized)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.${property} \u503C\u65E0\u6548`);
      return normalized;
    }
    if (typeof value === "string" && FORBIDDEN_VALUE.test(value)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.${property} \u5305\u542B\u4E0D\u5B89\u5168\u503C`);
    return value;
  }
  function normalizeComponentStylePack(value, declaration = {}, { platform = "web", pluginId = "" } = {}) {
    const id = String(declaration.id || value?.id || "");
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("PLUGIN_UI_SCHEMA_INVALID", `\u7EC4\u4EF6\u6837\u5F0F\u5305 ${id} \u65E0\u6548`);
    if (!id || !/^[a-z][a-z0-9._-]{0,63}$/.test(id)) fail("PLUGIN_UI_SCHEMA_INVALID", `\u7EC4\u4EF6\u6837\u5F0F\u5305 ${id || "unknown"} ID \u65E0\u6548`);
    const targets = value.targets;
    if (!targets || typeof targets !== "object" || Array.isArray(targets)) fail("PLUGIN_UI_SCHEMA_INVALID", `\u7EC4\u4EF6\u6837\u5F0F\u5305 ${id} \u7F3A\u5C11 targets`);
    const normalizedTargets = {};
    for (const [targetId, rawStyles] of Object.entries(targets)) {
      const descriptor = getComponentTarget(targetId, platform);
      if (!descriptor) fail("PLUGIN_UI_UNKNOWN_TARGET", `\u672A\u77E5\u7EC4\u4EF6\u76EE\u6807\uFF1A${targetId}`);
      if (!descriptor.available) continue;
      if (!rawStyles || typeof rawStyles !== "object" || Array.isArray(rawStyles)) fail("PLUGIN_UI_SCHEMA_INVALID", `${targetId} \u6837\u5F0F\u65E0\u6548`);
      const styles = {};
      for (const [property, raw] of Object.entries(rawStyles)) styles[property] = normalizeProperty(property, raw, descriptor, `${id}.${targetId}`, pluginId);
      const foreground = rgb(styles.foreground);
      const background = rgb(styles.background);
      if (descriptor.visibilityPolicy === "protected" || descriptor.visibilityPolicy === "required") {
        if (styles.foreground && !foreground || styles.background && !background) fail("PLUGIN_UI_CONTRAST_TOO_LOW", `${targetId} \u6743\u5A01\u76EE\u6807\u989C\u8272\u5FC5\u987B\u662F\u4E0D\u900F\u660E\u989C\u8272`);
        const combinations = foreground && background ? [[foreground, background]] : foreground ? [[foreground, [255, 247, 252]], [foreground, [31, 23, 29]]] : background ? [[[42, 23, 35], background], [[245, 238, 243], background]] : [];
        if (combinations.some(([fg, bg]) => contrastRatio(fg, bg) < 4.5)) fail("PLUGIN_UI_CONTRAST_TOO_LOW", `${targetId} \u524D\u666F\u4E0E\u80CC\u666F\u5BF9\u6BD4\u5EA6\u4F4E\u4E8E 4.5:1`);
      }
      normalizedTargets[targetId] = styles;
    }
    return { id, title: String(value.title || declaration.title || id).slice(0, 120), description: String(value.description || "").slice(0, 300), targets: normalizedTargets };
  }
  function normalizeComponentStylePacks(value, permissions, options = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:component-styles")) fail("PLUGIN_PERMISSION_DENIED", "componentStylePacks \u9700\u8981 ui:component-styles \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail("PLUGIN_UI_SCHEMA_INVALID", "componentStylePacks \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((declaration, index) => {
      if (!declaration || typeof declaration !== "object" || !/^[a-z][a-z0-9._-]{0,63}$/.test(declaration.id || "") || ids.has(declaration.id)) fail("PLUGIN_UI_SCHEMA_INVALID", `componentStylePacks[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(declaration.id);
      return normalizeComponentStylePack(declaration.data || declaration, declaration, options);
    });
  }

  // ../../packages/cyrene-core/src/ui-policies/font-policy.js
  var FONT_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
  function normalizeFonts(value, permissions, { pluginId = "" } = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:fonts")) {
      const error = new Error("fonts \u9700\u8981 ui:fonts \u6743\u9650");
      error.code = "PLUGIN_PERMISSION_DENIED";
      throw error;
    }
    if (!Array.isArray(value) || value.length > 8) throw Object.assign(new Error("fonts \u6700\u591A 8 \u9879"), { code: "PLUGIN_UI_SCHEMA_INVALID" });
    const ids = /* @__PURE__ */ new Set();
    return value.map((raw, index) => {
      const id = String(raw?.id || "");
      if (!FONT_ID_PATTERN.test(id) || ids.has(id)) throw Object.assign(new Error(`fonts[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`), { code: "PLUGIN_UI_SCHEMA_INVALID" });
      ids.add(id);
      const source = String(raw.source || "").replace(/\\/g, "/");
      if (!source.toLowerCase().endsWith(".woff2") || !source || source.startsWith("/") || source.includes("../") || source.includes("/..")) throw Object.assign(new Error(`fonts[${index}] \u4EC5\u5141\u8BB8\u5305\u5185 .woff2`), { code: "PLUGIN_UI_FONT_NOT_ALLOWED" });
      const weight = raw.weight === void 0 ? 400 : Number(raw.weight);
      if (![400, 500, 600, 700, 800].includes(weight)) throw Object.assign(new Error(`fonts[${index}].weight \u65E0\u6548`), { code: "PLUGIN_UI_VALUE_OUT_OF_RANGE" });
      const style = raw.style === "italic" ? "italic" : "normal";
      return { id, source, weight, style, family: pluginId ? `plugin:${pluginId}/${id}` : "" };
    });
  }
  function validateFontFiles(fonts, files) {
    let total = 0;
    for (const font of fonts) {
      const encoded = files?.[font.source];
      if (!encoded) throw Object.assign(new Error(`\u63D2\u4EF6\u5B57\u4F53\u4E0D\u5B58\u5728\uFF1A${font.source}`), { code: "PLUGIN_UI_SCHEMA_INVALID" });
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      if (bytes.byteLength > 2 * 1024 * 1024) throw Object.assign(new Error(`\u63D2\u4EF6\u5B57\u4F53\u8D85\u8FC7 2 MiB\uFF1A${font.source}`), { code: "PLUGIN_UI_VALUE_OUT_OF_RANGE" });
      if (bytes.length < 4 || bytes[0] !== 119 || bytes[1] !== 79 || bytes[2] !== 70 || bytes[3] !== 50) throw Object.assign(new Error(`\u63D2\u4EF6\u5B57\u4F53\u6587\u4EF6\u5934\u65E0\u6548\uFF1A${font.source}`), { code: "PLUGIN_UI_SCHEMA_INVALID" });
      total += bytes.byteLength;
    }
    if (total > 8 * 1024 * 1024) throw Object.assign(new Error("\u63D2\u4EF6\u5B57\u4F53\u603B\u5927\u5C0F\u8D85\u8FC7 8 MiB"), { code: "PLUGIN_UI_VALUE_OUT_OF_RANGE" });
    return true;
  }

  // ../../packages/cyrene-core/src/ui-policies/override-policy.js
  var VISIBILITIES = /* @__PURE__ */ new Set(["visible", "hidden", "replaced"]);
  var LAYOUTS = /* @__PURE__ */ new Set(["collapse", "reserve", "compact"]);
  function fail2(code, message) {
    throw Object.assign(new Error(message), { code });
  }
  function normalizeComponentOverridePacks(value, permissions, { platform = "web" } = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:component-overrides")) fail2("PLUGIN_PERMISSION_DENIED", "componentOverridePacks \u9700\u8981 ui:component-overrides \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail2("PLUGIN_UI_SCHEMA_INVALID", "componentOverridePacks \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((pack, index) => {
      const id = String(pack?.id || "");
      if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id) || !pack.targets || typeof pack.targets !== "object" || Array.isArray(pack.targets)) fail2("PLUGIN_UI_SCHEMA_INVALID", `componentOverridePacks[${index}] \u65E0\u6548`);
      ids.add(id);
      const targets = {};
      for (const [targetId, raw] of Object.entries(pack.targets)) {
        const descriptor = getComponentTarget(targetId, platform);
        if (!descriptor) fail2("PLUGIN_UI_UNKNOWN_TARGET", `\u672A\u77E5\u7EC4\u4EF6\u76EE\u6807\uFF1A${targetId}`);
        if (!descriptor.available) continue;
        if (descriptor.visibilityPolicy === "protected" || descriptor.visibilityPolicy === "required") fail2(descriptor.visibilityPolicy === "protected" ? "PLUGIN_UI_PROTECTED_TARGET" : "PLUGIN_UI_REQUIRED_TARGET", `${targetId} \u4E0D\u5141\u8BB8\u9690\u85CF\u6216\u66FF\u6362`);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail2("PLUGIN_UI_SCHEMA_INVALID", `${targetId} \u8986\u76D6\u58F0\u660E\u65E0\u6548`);
        const visibility = raw.visibility === void 0 ? "visible" : String(raw.visibility);
        if (!VISIBILITIES.has(visibility)) fail2("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${targetId}.visibility \u65E0\u6548`);
        const layout = raw.layout === void 0 ? "collapse" : String(raw.layout);
        if (!LAYOUTS.has(layout)) fail2("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${targetId}.layout \u65E0\u6548`);
        if (visibility === "replaced") fail2("PLUGIN_UI_REPLACEMENT_UNAVAILABLE", `${targetId} \u5F53\u524D\u6CA1\u6709\u53EF\u7528\u5BBF\u4E3B\u66FF\u4EE3\u89C6\u56FE`);
        targets[targetId] = { visibility, layout };
      }
      return { id, title: String(pack.title || id).slice(0, 120), description: String(pack.description || "").slice(0, 300), targets };
    });
  }
  var COMPONENT_OVERRIDE_VISIBILITIES = Object.freeze([...VISIBILITIES]);
  var COMPONENT_OVERRIDE_LAYOUTS = Object.freeze([...LAYOUTS]);

  // ../../packages/cyrene-core/src/ui-policies/native-view-policy.js
  var NODE_TYPES = /* @__PURE__ */ new Set(["Stack", "Grid", "Text", "Icon", "Badge", "Button", "Toggle", "Select", "Range", "Progress", "Divider", "List", "Table", "Notice"]);
  var ICONS = /* @__PURE__ */ new Set(["draw", "info", "warning", "settings", "filter", "history", "check", "close", "add", "remove", "refresh"]);
  var SLOTS = /* @__PURE__ */ new Set(["slot:roller.side-panel", "slot:roller.below-result", "slot:records.toolbar"]);
  var ALL_SLOTS = /* @__PURE__ */ new Set([...SLOTS, "slot:app.command-palette", "slot:roller.toolbar", "slot:card.footer", "slot:lottery.side-panel", "slot:statistics.section", "slot:settings.plugin-section"]);
  var BINDING = /^(\$(?:state|storage|resource|host|receipt))\.[A-Za-z][A-Za-z0-9._-]{0,127}$/;
  var MAX_NODES = 128;
  var MAX_DEPTH = 12;
  function fail3(code, message) {
    throw Object.assign(new Error(message), { code });
  }
  function safeText(value, label, max = 500) {
    const text = String(value || "");
    if (text.length > max || /[<>]/.test(text)) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label} \u6587\u672C\u65E0\u6548`);
    return text;
  }
  function normalizeBinding(value, label) {
    if (value === void 0) return void 0;
    if (typeof value !== "string" || !BINDING.test(value) || /[(){};=]|\beval\b|window|document|globalThis/i.test(value) || value.startsWith("$receipt.")) fail3("PLUGIN_UI_RESOURCE_BINDING_DENIED", `${label} \u7ED1\u5B9A\u65E0\u6548`);
    return value;
  }
  function normalizeNode(raw, state, depth, label) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label} \u8282\u70B9\u65E0\u6548`);
    if (depth > MAX_DEPTH) fail3("PLUGIN_UI_SCHEMA_INVALID", "\u539F\u751F\u89C6\u56FE\u5D4C\u5957\u6DF1\u5EA6\u8D85\u8FC7 12");
    if (!NODE_TYPES.has(raw.type) || raw.type === "VerifiedResult") fail3("PLUGIN_UI_SCHEMA_INVALID", `${label} \u8282\u70B9\u7C7B\u578B\u4E0D\u5141\u8BB8`);
    state.count += 1;
    if (state.count > MAX_NODES) fail3("PLUGIN_UI_SCHEMA_INVALID", "\u539F\u751F\u89C6\u56FE\u8282\u70B9\u8D85\u8FC7 128");
    const props = raw.props && typeof raw.props === "object" && !Array.isArray(raw.props) ? raw.props : {};
    const bindings = raw.bindings && typeof raw.bindings === "object" && !Array.isArray(raw.bindings) ? raw.bindings : {};
    if (Object.keys(props).some((key) => ["class", "className", "style", "html", "innerHTML", "onClick", "handler"].includes(key))) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label} \u5305\u542B\u7981\u6B62\u5C5E\u6027`);
    const normalized = { type: raw.type, props: {}, bindings: {}, children: [] };
    if (raw.type === "Icon") {
      const icon = String(props.icon || "");
      if (!ICONS.has(icon)) fail3("PLUGIN_UI_ICON_NOT_ALLOWED", `${label} \u56FE\u6807\u4E0D\u5141\u8BB8\uFF1A${icon}`);
      normalized.props.icon = icon;
    }
    for (const [key, value] of Object.entries(props)) {
      if (key === "text" || key === "label" || key === "description") normalized.props[key] = safeText(value, `${label}.${key}`, key === "description" ? 2e3 : 500);
      else if (key === "variant") normalized.props.variant = safeText(value, `${label}.variant`);
      else if (["gap", "padding", "density", "align", "columns", "min", "max", "step", "value"].includes(key)) {
        if (typeof value === "object" || typeof value === "function") fail3("PLUGIN_UI_SCHEMA_INVALID", `${label}.${key} \u65E0\u6548`);
        normalized.props[key] = value;
      } else if (key === "options") {
        if (!Array.isArray(value) || value.length > 32) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label}.options \u65E0\u6548`);
        normalized.props.options = value.map((option) => ({ value: String(option?.value ?? ""), label: safeText(option?.label || option?.value || "", `${label}.options.label`) }));
      } else if (key !== "icon") fail3("PLUGIN_UI_SCHEMA_INVALID", `${label}.${key} \u4E0D\u5141\u8BB8`);
    }
    for (const [key, value] of Object.entries(bindings)) normalized.bindings[key] = normalizeBinding(value, `${label}.bindings.${key}`);
    if (raw.action !== void 0) {
      if (!raw.action || typeof raw.action !== "object" || Array.isArray(raw.action) || !/^[a-z][a-z0-9._-]{0,63}$/.test(raw.action.command || "")) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label}.action \u65E0\u6548`);
      normalized.action = { command: String(raw.action.command), args: raw.action.args && typeof raw.action.args === "object" && !Array.isArray(raw.action.args) ? raw.action.args : {} };
    }
    if (Array.isArray(raw.children)) normalized.children = raw.children.map((child, index) => normalizeNode(child, state, depth + 1, `${label}.children[${index}]`));
    return normalized;
  }
  function normalizeNativeViewDocument(value, label = "nativeView") {
    if (!value || typeof value !== "object" || Array.isArray(value) || value.schemaVersion !== 1 || !value.root) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label} Schema \u65E0\u6548`);
    const state = { count: 0 };
    return { schemaVersion: 1, root: normalizeNode(value.root, state, 1, `${label}.root`), nodeCount: state.count };
  }
  function normalizeNativeViews(value, permissions, { platform = "web" } = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:native-views")) fail3("PLUGIN_PERMISSION_DENIED", "nativeViews \u9700\u8981 ui:native-views \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail3("PLUGIN_UI_SCHEMA_INVALID", "nativeViews \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((raw, index) => {
      const id = String(raw?.id || "");
      if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id)) fail3("PLUGIN_UI_SCHEMA_INVALID", `nativeViews[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const slot = String(raw.slot || "");
      if (!ALL_SLOTS.has(slot)) fail3("PLUGIN_UI_SCHEMA_INVALID", `nativeViews[${index}] slot \u65E0\u6548`);
      if (!SLOTS.has(slot)) fail3("PLUGIN_UI_SCHEMA_INVALID", `${slot} \u5F53\u524D\u4E0D\u53EF\u7528`);
      const uses = [...new Set(Array.isArray(raw.uses) ? raw.uses.map(String) : [])];
      for (const permission of uses) if (!permissions.includes(permission)) fail3("PLUGIN_PERMISSION_DENIED", `${id} \u4F7F\u7528\u4E86\u672A\u58F0\u660E\u6743\u9650\uFF1A${permission}`);
      const order = raw.order === void 0 ? 500 : Number(raw.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) fail3("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.order \u65E0\u6548`);
      const source = String(raw.source || "").replace(/\\/g, "/");
      if (!source || !source.toLowerCase().endsWith(".json") || source.startsWith("/") || source.includes("../") || source.includes("/..")) fail3("PLUGIN_UI_SCHEMA_INVALID", `${id}.source \u65E0\u6548`);
      return { id, title: safeText(raw.title || id, `${id}.title`), titleEn: safeText(raw.titleEn || "", `${id}.titleEn`), description: safeText(raw.description || "", `${id}.description`, 300), slot, source, uses, order, platform, available: true };
    });
  }
  var NATIVE_VIEW_NODE_TYPES = Object.freeze([...NODE_TYPES]);
  var NATIVE_VIEW_ICON_ALIASES = Object.freeze([...ICONS]);
  var NATIVE_VIEW_SLOTS = Object.freeze([...SLOTS]);

  // ../../packages/cyrene-core/src/ui-policies/result-presentation-policy.js
  var TARGETS = /* @__PURE__ */ new Set(["roller.result"]);
  var LAYOUTS2 = /* @__PURE__ */ new Set(["single", "list", "grid", "spotlight"]);
  var SIZES = /* @__PURE__ */ new Set(["small", "medium", "large"]);
  var ALIGNMENTS = /* @__PURE__ */ new Set(["start", "center", "end"]);
  function fail4(code, message) {
    throw Object.assign(new Error(message), { code });
  }
  function normalizeResultPresentations(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:result-presentations")) fail4("PLUGIN_PERMISSION_DENIED", "resultPresentations \u9700\u8981 ui:result-presentations \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail4("PLUGIN_UI_SCHEMA_INVALID", "resultPresentations \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((raw, index) => {
      const id = String(raw?.id || "");
      if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id)) fail4("PLUGIN_UI_SCHEMA_INVALID", `resultPresentations[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const targets = [...new Set(Array.isArray(raw.targets) ? raw.targets.map(String) : [])];
      if (!targets.length || targets.some((target2) => !TARGETS.has(target2))) fail4("PLUGIN_UI_UNKNOWN_TARGET", `${id} \u7ED3\u679C\u5448\u73B0\u76EE\u6807\u4E0D\u5141\u8BB8`);
      const layout = String(raw.layout || "single");
      if (!LAYOUTS2.has(layout)) fail4("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.layout \u65E0\u6548`);
      const style = raw.style && typeof raw.style === "object" && !Array.isArray(raw.style) ? raw.style : {};
      const normalizedStyle = {};
      if (style.size !== void 0) {
        if (!SIZES.has(String(style.size))) fail4("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.style.size \u65E0\u6548`);
        normalizedStyle.size = String(style.size);
      }
      if (style.alignment !== void 0) {
        if (!ALIGNMENTS.has(String(style.alignment))) fail4("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.style.alignment \u65E0\u6548`);
        normalizedStyle.alignment = String(style.alignment);
      }
      for (const key of ["showAlgorithm", "showOperationId", "showEnglishName"]) {
        if (style[key] !== void 0) {
          if (typeof style[key] !== "boolean") fail4("PLUGIN_UI_SCHEMA_INVALID", `${id}.style.${key} \u5FC5\u987B\u662F\u5E03\u5C14\u503C`);
          normalizedStyle[key] = style[key];
        }
      }
      const unknownStyle = Object.keys(style).find((key) => !["size", "alignment", "showAlgorithm", "showOperationId", "showEnglishName"].includes(key));
      if (unknownStyle) fail4("PLUGIN_UI_PROPERTY_NOT_ALLOWED", `${id}.style.${unknownStyle} \u4E0D\u5141\u8BB8`);
      return { id, title: String(raw.title || id).slice(0, 120), titleEn: String(raw.titleEn || "").slice(0, 120), description: String(raw.description || "").slice(0, 300), targets, layout, style: normalizedStyle };
    });
  }
  var RESULT_PRESENTATION_TARGETS = Object.freeze([...TARGETS]);
  var RESULT_PRESENTATION_LAYOUTS = Object.freeze([...LAYOUTS2]);

  // ../../packages/cyrene-core/src/ui-tree-schema.js
  var UI_TREE_SCHEMA_VERSION = 1;
  var UI_TREE_LAYOUT_TYPES = Object.freeze([
    "page",
    "section",
    "card",
    "group",
    "row",
    "column",
    "form"
  ]);
  var UI_TREE_CONTROL_TYPES = Object.freeze([
    "text",
    "button",
    "text-input",
    "multiline-input",
    "toggle",
    "checkbox",
    "radio",
    "select",
    "slider",
    "number-stepper",
    "list",
    "badge",
    "icon",
    "progress"
  ]);
  var UI_TREE_NODE_TYPES = Object.freeze([...UI_TREE_LAYOUT_TYPES, ...UI_TREE_CONTROL_TYPES]);
  var UI_TREE_BINDING_SOURCES = Object.freeze([
    "settings",
    "plugin",
    "ui.state",
    "core"
  ]);
  var UI_TREE_CORE_READONLY_SOURCES = Object.freeze([
    "names",
    "records",
    "statistics",
    "balance"
  ]);
  var UI_TREE_BUTTON_VARIANTS = Object.freeze(["primary", "secondary", "subtle"]);
  var UI_TREE_TONES = Object.freeze(["neutral", "accent", "success", "warning", "danger"]);
  var UI_TREE_MAX_DEPTH = 16;
  var UI_TREE_MAX_CHILDREN = 128;
  var UI_TREE_MAX_NODES = 512;
  var UI_TREE_MAX_OPTIONS = 16;
  var UI_TREE_MAX_TEXT = 600;
  var UI_TREE_DENIED_FEATURES = Object.freeze([
    "\u4EFB\u610F DOM/VisualTree \u64CD\u4F5C",
    "\u52A8\u6001\u6CE8\u518C\u7EC4\u4EF6",
    "\u6CE8\u5165\u81EA\u5B9A\u4E49\u6837\u5F0F/CSS",
    "\u539F\u751F\u63A7\u4EF6\u76F4\u901A",
    "\u5185\u8054\u811A\u672C\u6267\u884C",
    "\u672A\u77E5\u63A7\u4EF6\u7C7B\u578B"
  ]);

  // ../../packages/cyrene-core/src/plugin-contract.js
  var PLUGIN_API_VERSION = "1.3.0";
  var PLUGIN_PERMISSIONS = /* @__PURE__ */ new Set([
    "storage:read",
    "storage:write",
    "events:draw",
    "notifications:show",
    "audio:select",
    "audio:play",
    "names:read",
    "records:read",
    "statistics:read",
    "balance:read",
    "events:lifecycle",
    "draw:execute",
    "ui:animations",
    "ui:visual-surfaces",
    "ui:appearance",
    "ui:component-styles",
    "ui:component-overrides",
    "ui:native-views",
    "ui:result-presentations",
    "ui:fonts",
    "ui:pages",
    "system:open-url",
    "system:select-file",
    "system:select-directory",
    "system:clipboard-read",
    "system:clipboard-write",
    "system:reveal-file",
    "system:execute"
  ]);
  var PLUGIN_ANIMATION_TARGETS = /* @__PURE__ */ new Set([
    "page.transition",
    "roller.finish",
    "card.deal",
    "card.flip",
    "lottery.finish",
    "global.transition"
  ]);
  var PLUGIN_LIFECYCLE_EVENTS = /* @__PURE__ */ new Set([
    "app:ready",
    "app:route-changed",
    "app:theme-changed",
    "app:resize",
    "plugin:storage-changed"
  ]);
  var PLUGIN_PLATFORM_CAPABILITIES = /* @__PURE__ */ new Set([
    "notifications:show",
    "audio:select",
    "audio:play",
    "system:open-url",
    "system:select-file",
    "system:select-directory",
    "system:clipboard-read",
    "system:clipboard-write",
    "system:reveal-file",
    "system:execute"
  ]);
  var PLUGIN_PLATFORM_IDS = /* @__PURE__ */ new Set([
    "web",
    "tauri",
    "windows",
    "macos",
    "linux",
    "android",
    "ios"
  ]);
  var PLUGIN_COMMAND_LOCATIONS = /* @__PURE__ */ new Set([
    "command-palette",
    "page-header",
    "context-menu"
  ]);
  var MAX_PLUGIN_SIZE = 32 * 1024 * 1024;
  var MAX_FILE_COUNT = 256;
  var ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/;
  var CONTRIBUTION_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
  var SETTING_PATH_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i;
  var MAX_ANIMATION_DURATION_MS = 5e3;
  var MAX_ANIMATION_DELAY_MS = 1500;
  var MAX_ANIMATION_ITERATIONS = 3;
  var ANIMATION_TIMEOUT_GRACE_MS = 500;
  var MAX_PLUGIN_ANIMATION_ACTIVE_MS = MAX_ANIMATION_DELAY_MS + MAX_ANIMATION_DURATION_MS * MAX_ANIMATION_ITERATIONS + ANIMATION_TIMEOUT_GRACE_MS;
  var ANIMATION_FRAME_PROPERTIES = /* @__PURE__ */ new Set([
    "opacity",
    "transform",
    "filter",
    "clipPath",
    "borderRadius",
    "boxShadow",
    "textShadow",
    "color",
    "background",
    "backgroundColor",
    "letterSpacing",
    "offset",
    "easing",
    "composite"
  ]);
  var GSAP_ANIMATION_PROPERTIES = /* @__PURE__ */ new Set([
    "opacity",
    "autoAlpha",
    "x",
    "y",
    "xPercent",
    "yPercent",
    "scale",
    "scaleX",
    "scaleY",
    "rotation",
    "rotate",
    "rotationX",
    "rotationY",
    "rotateX",
    "rotateY",
    "skewX",
    "skewY",
    "filter",
    "clipPath",
    "borderRadius",
    "boxShadow",
    "textShadow",
    "color",
    "background",
    "backgroundColor",
    "letterSpacing",
    "transformOrigin"
  ]);
  var UNSAFE_VISUAL_VALUE_PATTERN = /url\s*\(|image-set\s*\(|cross-fade\s*\(|paint\s*\(|(?:https?:|data:|blob:|\/\/)/i;
  var APPEARANCE_COLOR_TOKENS = /* @__PURE__ */ new Set([
    "--accent",
    "--accent-light",
    "--accent-dark",
    "--accent-hover",
    "--accent-200",
    "--accent-50",
    "--text-on-accent",
    "--bg-base",
    "--bg-card",
    "--bg-card-solid",
    "--bg-hover",
    "--bg-acrylic",
    "--bg-mica",
    "--text-primary",
    "--text-secondary",
    "--text-muted",
    "--border-default",
    "--border-subtle",
    "--border-strong"
  ]);
  var APPEARANCE_SHADOW_TOKENS = /* @__PURE__ */ new Set(["--shadow-2", "--shadow-4", "--shadow-8", "--shadow-16"]);
  var APPEARANCE_TOKENS = /* @__PURE__ */ new Set([...APPEARANCE_COLOR_TOKENS, ...APPEARANCE_SHADOW_TOKENS]);
  var ANIMATION_DIRECTIONS = /* @__PURE__ */ new Set(["normal", "reverse", "alternate", "alternate-reverse"]);
  var VISUAL_SURFACE_EVENTS = /* @__PURE__ */ new Set([
    ...PLUGIN_LIFECYCLE_EVENTS,
    "draw:item-result",
    "draw:result",
    "roller:start",
    "roller:item-result",
    "roller:result",
    "card:item-result",
    "card:result",
    "lottery:item-result",
    "lottery:result",
    "lottery:assign-result"
  ]);
  var CNRP_MAGIC = "CNRP1\n";
  function comparePluginVersions(left, right) {
    const a = String(left || "0").split(".").map((value) => Number(value) || 0);
    const b = String(right || "0").split(".").map((value) => Number(value) || 0);
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      const difference = (a[index] || 0) - (b[index] || 0);
      if (difference) return Math.sign(difference);
    }
    return 0;
  }
  function satisfiesPluginVersion(version, range = "*") {
    const wanted = String(range || "*").trim();
    if (!wanted || wanted === "*") return true;
    if (wanted.startsWith("^")) {
      const base = wanted.slice(1);
      const major = Number(base.split(".")[0]) || 0;
      return comparePluginVersions(version, base) >= 0 && Number(String(version).split(".")[0]) === major;
    }
    if (wanted.startsWith("~")) {
      const base = wanted.slice(1);
      const [major = 0, minor = 0] = base.split(".").map(Number);
      const [actualMajor = 0, actualMinor = 0] = String(version).split(".").map(Number);
      return comparePluginVersions(version, base) >= 0 && actualMajor === major && actualMinor === minor;
    }
    if (wanted.startsWith(">=")) return comparePluginVersions(version, wanted.slice(2).trim()) >= 0;
    if (wanted.startsWith(">")) return comparePluginVersions(version, wanted.slice(1).trim()) > 0;
    if (wanted.startsWith("<=")) return comparePluginVersions(version, wanted.slice(2).trim()) <= 0;
    if (wanted.startsWith("<")) return comparePluginVersions(version, wanted.slice(1).trim()) < 0;
    return comparePluginVersions(version, wanted) === 0;
  }
  function validatePath(path) {
    const normalized = String(path || "").replace(/\\/g, "/");
    if (!normalized || normalized.includes("\0") || normalized.startsWith("/") || normalized.includes("../") || normalized.includes("/..")) {
      throw new Error(`\u63D2\u4EF6\u5305\u542B\u4E0D\u5B89\u5168\u8DEF\u5F84\uFF1A${path}`);
    }
    return normalized;
  }
  function normalizePlatforms(value, label) {
    if (value === void 0) return [];
    if (!Array.isArray(value)) throw new Error(`${label}\u5FC5\u987B\u662F\u5E73\u53F0\u6570\u7EC4`);
    const platforms = [...new Set(value.map((item) => String(item).toLowerCase()))];
    const unknown = platforms.find((item) => !PLUGIN_PLATFORM_IDS.has(item));
    if (unknown) throw new Error(`${label}\u5305\u542B\u672A\u77E5\u5E73\u53F0\uFF1A${unknown}`);
    return platforms;
  }
  function normalizePlatformEntries(value, label) {
    if (value === void 0) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}\u65E0\u6548`);
    const result = {};
    for (const [platform, path] of Object.entries(value)) {
      if (!PLUGIN_PLATFORM_IDS.has(platform)) throw new Error(`${label}\u5305\u542B\u672A\u77E5\u5E73\u53F0\uFF1A${platform}`);
      result[platform] = validatePath(path);
    }
    return result;
  }
  function normalizeCapabilities(value, permissions) {
    if (value === void 0) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("capabilities \u5FC5\u987B\u662F\u5BF9\u8C61");
    const result = {};
    for (const [id, raw] of Object.entries(value)) {
      if (!PLUGIN_PLATFORM_CAPABILITIES.has(id)) throw new Error(`\u672A\u77E5\u5E73\u53F0\u80FD\u529B\uFF1A${id}`);
      const declaration = raw === true ? { required: true } : raw === false ? { required: false } : raw;
      if (!declaration || typeof declaration !== "object" || Array.isArray(declaration)) throw new Error(`\u5E73\u53F0\u80FD\u529B\u58F0\u660E\u65E0\u6548\uFF1A${id}`);
      if (!permissions.includes(id)) throw new Error(`\u5E73\u53F0\u80FD\u529B ${id} \u5FC5\u987B\u540C\u65F6\u52A0\u5165 permissions`);
      result[id] = {
        required: !!declaration.required,
        platforms: normalizePlatforms(declaration.platforms, `${id}.platforms`)
      };
    }
    const undeclared = permissions.find((permission) => permission.startsWith("system:") && !result[permission]);
    if (undeclared) throw new Error(`\u7CFB\u7EDF\u6743\u9650 ${undeclared} \u5FC5\u987B\u5728 capabilities \u4E2D\u58F0\u660E\u662F\u5426\u4E3A\u5FC5\u9700\u80FD\u529B`);
    return result;
  }
  function normalizeSystemOperations(value, permissions) {
    if (value === void 0 || Array.isArray(value) && value.length === 0) return [];
    if (!permissions.includes("system:execute")) throw new Error("systemOperations \u9700\u8981 system:execute \u6743\u9650");
    if (!Array.isArray(value)) throw new Error("systemOperations \u5FC5\u987B\u662F\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((operation) => {
      if (!operation || typeof operation !== "object" || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(operation.id || "") || ids.has(operation.id)) {
        throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ID \u65E0\u6548\u6216\u91CD\u590D\uFF1A${operation?.id || "\u672A\u77E5"}`);
      }
      ids.add(operation.id);
      if (!operation.label || String(operation.label).length > 100) throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7F3A\u5C11\u7B80\u77ED\u8BF4\u660E`);
      const platforms = normalizePlatforms(operation.platforms, `${operation.id}.platforms`);
      if (!platforms.length || platforms.includes("web")) throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u5FC5\u987B\u58F0\u660E\u975E Web \u5E73\u53F0`);
      const command = operation.command;
      if (!command || typeof command !== "object") throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7F3A\u5C11\u56FA\u5B9A\u547D\u4EE4`);
      const program = String(command.program || "");
      if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(program)) throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7684\u7A0B\u5E8F\u540D\u65E0\u6548`);
      const args = Array.isArray(command.args) ? command.args.map(String) : [];
      if (args.length > 32 || args.some((argument) => argument.includes("\0") || argument.length > 2048)) {
        throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7684\u56FA\u5B9A\u53C2\u6570\u65E0\u6548`);
      }
      return {
        id: operation.id,
        label: String(operation.label),
        platforms,
        command: { program, args },
        timeoutMs: Math.max(1e3, Math.min(3e4, Number(operation.timeoutMs) || 1e4))
      };
    });
  }
  function normalizeAnimationOptions(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}.options \u65E0\u6548`);
    const duration = Number(value.duration);
    const delay = Number(value.delay || 0);
    const iterations = Number(value.iterations || 1);
    const easing = String(value.easing || "ease");
    const direction = String(value.direction || "normal");
    if (!Number.isFinite(duration) || duration < 80 || duration > MAX_ANIMATION_DURATION_MS) throw new Error(`${label}.options.duration \u5FC5\u987B\u5728 80-${MAX_ANIMATION_DURATION_MS}ms`);
    if (!Number.isFinite(delay) || delay < 0 || delay > MAX_ANIMATION_DELAY_MS) throw new Error(`${label}.options.delay \u5FC5\u987B\u5728 0-${MAX_ANIMATION_DELAY_MS}ms`);
    if (!Number.isFinite(iterations) || iterations < 1 || iterations > MAX_ANIMATION_ITERATIONS) throw new Error(`${label}.options.iterations \u5FC5\u987B\u5728 1-${MAX_ANIMATION_ITERATIONS}`);
    if (!/^[a-z0-9().,%\s+\-*/]+$/i.test(easing) || easing.length > 160) throw new Error(`${label}.options.easing \u65E0\u6548`);
    if (!ANIMATION_DIRECTIONS.has(direction)) throw new Error(`${label}.options.direction \u65E0\u6548`);
    return { duration, delay, iterations, easing, direction, fill: "both" };
  }
  function normalizeSafeAnimationValue(raw, label) {
    if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") throw new Error(label + " \u65E0\u6548");
    if (typeof raw === "boolean") return raw;
    const serialized = String(raw);
    if (serialized.length > 600 || /[{};<>\\]/.test(serialized) || UNSAFE_VISUAL_VALUE_PATTERN.test(serialized)) {
      throw new Error(label + " \u8FC7\u957F\u6216\u5305\u542B\u4E0D\u5B89\u5168\u5185\u5BB9");
    }
    return raw;
  }
  function normalizeGsapVars(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " \u65E0\u6548");
    const normalized = {};
    for (const [property, raw] of Object.entries(value)) {
      if (!GSAP_ANIMATION_PROPERTIES.has(property)) throw new Error(label + " \u4E0D\u5141\u8BB8\u5C5E\u6027 " + property);
      normalized[property] = normalizeSafeAnimationValue(raw, label + "." + property);
    }
    if (!Object.keys(normalized).length) throw new Error(label + " \u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u52A8\u753B\u5C5E\u6027");
    return normalized;
  }
  function normalizeGsapOptions(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + ".options \u65E0\u6548");
    const duration = Number(value.duration);
    const delay = Number(value.delay || 0);
    const repeat = Number(value.repeat || 0);
    const ease = String(value.ease || value.easing || "power3.out");
    if (!Number.isFinite(duration) || duration < 80 || duration > MAX_ANIMATION_DURATION_MS) throw new Error(label + ".options.duration \u5FC5\u987B\u5728 80-" + MAX_ANIMATION_DURATION_MS + "ms");
    if (!Number.isFinite(delay) || delay < 0 || delay > MAX_ANIMATION_DELAY_MS) throw new Error(label + ".options.delay \u5FC5\u987B\u5728 0-" + MAX_ANIMATION_DELAY_MS + "ms");
    if (!Number.isInteger(repeat) || repeat < 0 || repeat >= MAX_ANIMATION_ITERATIONS) throw new Error(label + ".options.repeat \u5FC5\u987B\u5728 0-" + (MAX_ANIMATION_ITERATIONS - 1));
    if (!/^[a-z0-9().,%\s+\-*/]+$/i.test(ease) || ease.length > 160) throw new Error(label + ".options.ease \u65E0\u6548");
    return { duration, delay, repeat, ease, yoyo: value.yoyo === true };
  }
  function normalizeAnimationKeyframes(value, label) {
    if (!Array.isArray(value) || value.length < 2 || value.length > 32) throw new Error(`${label}.keyframes \u5FC5\u987B\u5305\u542B 2-32 \u5E27`);
    let previousOffset = -1;
    return value.map((frame, index) => {
      if (!frame || typeof frame !== "object" || Array.isArray(frame)) throw new Error(`${label}.keyframes[${index}] \u65E0\u6548`);
      const normalized = {};
      for (const [property, raw] of Object.entries(frame)) {
        if (!ANIMATION_FRAME_PROPERTIES.has(property)) throw new Error(`${label}.keyframes[${index}] \u4E0D\u5141\u8BB8\u5C5E\u6027 ${property}`);
        if (property === "offset") {
          const offset = Number(raw);
          if (!Number.isFinite(offset) || offset < 0 || offset > 1 || offset < previousOffset) throw new Error(`${label}.keyframes[${index}].offset \u65E0\u6548`);
          previousOffset = offset;
          normalized.offset = offset;
          continue;
        }
        if (property === "composite") {
          if (!["replace", "add", "accumulate"].includes(raw)) throw new Error(`${label}.keyframes[${index}].composite \u65E0\u6548`);
          normalized.composite = raw;
          continue;
        }
        if (typeof raw !== "string" && typeof raw !== "number") throw new Error(`${label}.keyframes[${index}].${property} \u65E0\u6548`);
        const serialized = String(raw);
        if (serialized.length > 600 || /[{};<>\\]/.test(serialized) || UNSAFE_VISUAL_VALUE_PATTERN.test(serialized)) {
          throw new Error(`${label}.keyframes[${index}].${property} \u8FC7\u957F\u6216\u5305\u542B\u4E0D\u5B89\u5168\u5185\u5BB9`);
        }
        normalized[property] = raw;
      }
      if (!Object.keys(normalized).some((property) => !["offset", "easing", "composite"].includes(property))) {
        throw new Error(`${label}.keyframes[${index}] \u6CA1\u6709\u53EF\u52A8\u753B\u5C5E\u6027`);
      }
      return normalized;
    });
  }
  function normalizeAnimationDefinition(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} \u65E0\u6548`);
    if (value.gsap !== void 0) {
      if (!value.gsap || typeof value.gsap !== "object" || Array.isArray(value.gsap)) throw new Error(`${label}.gsap \u65E0\u6548`);
      return {
        engine: "gsap",
        gsap: {
          from: normalizeGsapVars(value.gsap.from, `${label}.gsap.from`),
          to: normalizeGsapVars(value.gsap.to, `${label}.gsap.to`)
        },
        options: normalizeGsapOptions(value.gsap.options || value.options || {}, label)
      };
    }
    return {
      engine: "waapi",
      keyframes: normalizeAnimationKeyframes(value.keyframes, label),
      options: normalizeAnimationOptions(value.options || {}, label)
    };
  }
  function normalizeAnimationPack(value, declaration = {}) {
    const label = `\u52A8\u753B\u5305 ${declaration.id || "unknown"}`;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.schemaVersion !== 1) throw new Error(`${label} schemaVersion \u5FC5\u987B\u4E3A 1`);
    if (!Array.isArray(value.presets) || !value.presets.length || value.presets.length > 128) throw new Error(`${label}.presets \u5FC5\u987B\u5305\u542B 1-128 \u9879`);
    const ids = /* @__PURE__ */ new Set();
    const defaults = /* @__PURE__ */ new Set();
    const presets = value.presets.map((preset, index) => {
      if (!preset || typeof preset !== "object" || !CONTRIBUTION_ID_PATTERN.test(preset.id || "") || ids.has(preset.id)) {
        throw new Error(`${label}.presets[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      }
      ids.add(preset.id);
      if (!PLUGIN_ANIMATION_TARGETS.has(preset.target)) throw new Error(`${label}.presets[${index}] target \u65E0\u6548\uFF1A${preset.target}`);
      if (!preset.label || String(preset.label).length > 120) throw new Error(`${label}.presets[${index}] \u7F3A\u5C11 label`);
      const variants = {};
      for (const [variant, definition] of Object.entries(preset.variants || {})) {
        if (!CONTRIBUTION_ID_PATTERN.test(variant)) throw new Error(`${label}.presets[${index}] variant \u65E0\u6548\uFF1A${variant}`);
        variants[variant] = normalizeAnimationDefinition(definition, `${label}.${preset.id}.${variant}`);
      }
      const animation = preset.animation ? normalizeAnimationDefinition(preset.animation, `${label}.${preset.id}.animation`) : null;
      if (!animation && !Object.keys(variants).length) throw new Error(`${label}.presets[${index}] \u7F3A\u5C11 animation \u6216 variants`);
      const isDefault = !!preset.default;
      if (isDefault && defaults.has(preset.target)) throw new Error(`${label} \u4E2D ${preset.target} \u53EA\u80FD\u6709\u4E00\u4E2A\u9ED8\u8BA4\u52A8\u753B`);
      if (isDefault) defaults.add(preset.target);
      return {
        id: String(preset.id),
        target: preset.target,
        label: String(preset.label),
        description: String(preset.description || "").slice(0, 300),
        tags: Array.isArray(preset.tags) ? preset.tags.map(String).slice(0, 12) : [],
        default: isDefault,
        animation,
        variants
      };
    });
    return {
      id: String(declaration.id || value.id || ""),
      title: String(declaration.title || value.title || declaration.id || ""),
      description: String(declaration.description || value.description || "").slice(0, 500),
      source: String(declaration.source || ""),
      schemaVersion: 1,
      presets
    };
  }
  function normalizeAnimationPacks(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:animations")) throw new Error("animationPacks \u9700\u8981 ui:animations \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) throw new Error("animationPacks \u5FC5\u987B\u662F\u6700\u591A 16 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((pack, index) => {
      if (!pack || typeof pack !== "object" || !CONTRIBUTION_ID_PATTERN.test(pack.id || "") || ids.has(pack.id)) throw new Error(`animationPacks[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(pack.id);
      if (!pack.title || String(pack.title).length > 120) throw new Error(`animationPacks[${index}] \u7F3A\u5C11 title`);
      return { id: String(pack.id), title: String(pack.title), description: String(pack.description || "").slice(0, 300), source: validatePath(pack.source) };
    });
  }
  function normalizeAppearanceColor(value, label) {
    const source = String(value || "").trim();
    const hex = source.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hex) return source.toLowerCase();
    const rgb2 = source.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i);
    if (!rgb2 || rgb2.slice(1, 4).some((channel) => Number(channel) > 255)) throw new Error(`${label} \u5FC5\u987B\u662F\u5341\u516D\u8FDB\u5236\u6216 rgb/rgba \u989C\u8272`);
    if (source.toLowerCase().startsWith("rgba") && rgb2[4] === void 0) throw new Error(`${label} \u7684 rgba \u7F3A\u5C11\u900F\u660E\u5EA6`);
    return source.replace(/\s+/g, " ");
  }
  function normalizeAppearanceShadow(value, label) {
    const source = String(value || "").trim();
    if (source === "none") return source;
    if (!source || source.length > 320 || UNSAFE_VISUAL_VALUE_PATTERN.test(source) || /[{};<>\\]/.test(source) || !/^[#(),.%\sa-z0-9+\-]+$/i.test(source)) {
      throw new Error(`${label} \u9634\u5F71\u503C\u65E0\u6548`);
    }
    return source.replace(/\s+/g, " ");
  }
  function opaqueRgb(value) {
    const source = String(value || "").trim();
    const hex = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const raw = hex[1].length === 3 ? hex[1].split("").map((character) => character + character).join("") : hex[1];
      return [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16));
    }
    const rgb2 = source.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    return rgb2 ? rgb2.slice(1).map(Number) : null;
  }
  function contrastRatio2(foreground, background) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color) => color.map(channel).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground);
    const second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }
  function normalizeAppearanceTokens(value, label) {
    if (value === void 0) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} \u5FC5\u987B\u662F Token \u5BF9\u8C61`);
    const normalized = {};
    for (const [token, raw] of Object.entries(value)) {
      if (!APPEARANCE_TOKENS.has(token)) throw new Error(`${label} \u4E0D\u5141\u8BB8 Token ${token}`);
      normalized[token] = APPEARANCE_SHADOW_TOKENS.has(token) ? normalizeAppearanceShadow(raw, `${label}.${token}`) : normalizeAppearanceColor(raw, `${label}.${token}`);
    }
    const pairs = [["--text-primary", "--bg-base"], ["--text-on-accent", "--accent"]];
    for (const [foregroundToken, backgroundToken] of pairs) {
      const foreground = opaqueRgb(normalized[foregroundToken]);
      const background = opaqueRgb(normalized[backgroundToken]);
      if (foreground && background && contrastRatio2(foreground, background) < 4.5) {
        throw new Error(`${label} \u7684 ${foregroundToken} \u4E0E ${backgroundToken} \u5BF9\u6BD4\u5EA6\u4F4E\u4E8E 4.5:1`);
      }
    }
    return normalized;
  }
  function normalizeAppearancePacks(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:appearance")) throw new Error("appearancePacks \u9700\u8981 ui:appearance \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) throw new Error("appearancePacks \u5FC5\u987B\u662F\u6700\u591A 16 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((pack, index) => {
      if (!pack || typeof pack !== "object" || !CONTRIBUTION_ID_PATTERN.test(pack.id || "") || ids.has(pack.id)) {
        throw new Error(`appearancePacks[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      }
      ids.add(pack.id);
      const title = String(pack.title || "").trim();
      if (!title || title.length > 120) throw new Error(`appearancePacks[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      const titleEn = String(pack.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`appearancePacks[${index}].titleEn \u8FC7\u957F`);
      const light = normalizeAppearanceTokens(pack.light, `appearancePacks[${index}].light`);
      const dark = normalizeAppearanceTokens(pack.dark, `appearancePacks[${index}].dark`);
      if (!Object.keys(light).length && !Object.keys(dark).length) throw new Error(`appearancePacks[${index}] \u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u6D45\u8272\u6216\u6DF1\u8272 Token`);
      return {
        id: String(pack.id),
        title,
        titleEn,
        description: String(pack.description || "").slice(0, 300),
        base: pack.base === "fluent" ? "fluent" : "peach",
        light,
        dark
      };
    });
  }
  function normalizeVisualSurfaces(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:visual-surfaces")) throw new Error("visualSurfaces \u9700\u8981 ui:visual-surfaces \u6743\u9650");
    if (!Array.isArray(value) || value.length > 8) throw new Error("visualSurfaces \u5FC5\u987B\u662F\u6700\u591A 8 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((surface, index) => {
      if (!surface || typeof surface !== "object" || !CONTRIBUTION_ID_PATTERN.test(surface.id || "") || ids.has(surface.id)) throw new Error(`visualSurfaces[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(surface.id);
      const platformEntries = normalizePlatformEntries(surface.platformEntries, `visualSurfaces[${index}].platformEntries`);
      const entry = surface.entry ? validatePath(surface.entry) : "";
      if (!entry && !Object.keys(platformEntries).length) throw new Error(`visualSurfaces[${index}] \u7F3A\u5C11 entry`);
      if (surface.placement && surface.placement !== "background") throw new Error(`visualSurfaces[${index}].placement \u4EC5\u652F\u6301 background`);
      const events = [...new Set(Array.isArray(surface.events) ? surface.events.map(String) : [])];
      const unknownEvent = events.find((event) => !VISUAL_SURFACE_EVENTS.has(event));
      if (unknownEvent) throw new Error(`visualSurfaces[${index}] \u5305\u542B\u672A\u77E5\u4E8B\u4EF6\uFF1A${unknownEvent}`);
      return {
        id: String(surface.id),
        title: String(surface.title || surface.id),
        entry,
        platformEntries,
        placement: "background",
        events,
        defaultEnabled: surface.defaultEnabled !== false
      };
    });
  }
  function normalizeDependencies(value, pluginId) {
    if (value === void 0) return [];
    if (!Array.isArray(value)) throw new Error("dependencies \u5FC5\u987B\u662F\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((dependency, index) => {
      if (!dependency || typeof dependency !== "object" || Array.isArray(dependency)) throw new Error(`dependencies[${index}] \u65E0\u6548`);
      const id = String(dependency.id || "");
      if (!ID_PATTERN.test(id) || id === pluginId || ids.has(id)) throw new Error(`dependencies[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const range = String(dependency.range || dependency.version || "*");
      if (!range || range.length > 80 || /[{};<>]/.test(range)) throw new Error(`dependencies[${index}].range \u65E0\u6548`);
      return { id, range, dataAccess: dependency.dataAccess === true };
    });
  }
  function normalizeNativePage(value, label) {
    if (value === void 0 || value === null) return null;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} \u65E0\u6548`);
    if (value.type !== "settings") throw new Error(`${label}.type \u4EC5\u652F\u6301 settings`);
    if (!Array.isArray(value.controls) || value.controls.length > 64) throw new Error(`${label}.controls \u65E0\u6548`);
    const ids = /* @__PURE__ */ new Set();
    const controls = value.controls.map((control, index) => {
      if (!control || typeof control !== "object" || !CONTRIBUTION_ID_PATTERN.test(control.id || "") || ids.has(control.id)) {
        throw new Error(`${label}.controls[${index}] \u7684 ID \u65E0\u6548\u6216\u91CD\u590D`);
      }
      ids.add(control.id);
      const type = String(control.type || "");
      if (!["toggle", "range", "select", "audio", "animation-select"].includes(type)) throw new Error(`${label}.controls[${index}] \u7C7B\u578B\u4E0D\u53D7\u652F\u6301`);
      if (!control.label || String(control.label).length > 120) throw new Error(`${label}.controls[${index}] \u7F3A\u5C11 label`);
      if (type !== "animation-select" && !SETTING_PATH_PATTERN.test(control.path || "")) throw new Error(`${label}.controls[${index}] path \u65E0\u6548`);
      if (type === "animation-select" && !PLUGIN_ANIMATION_TARGETS.has(control.target)) throw new Error(`${label}.controls[${index}] target \u65E0\u6548`);
      if (type === "animation-select" && control.packId && !CONTRIBUTION_ID_PATTERN.test(control.packId)) throw new Error(`${label}.controls[${index}] packId \u65E0\u6548`);
      if (type === "select" && (!Array.isArray(control.options) || !control.options.length || control.options.length > 32)) {
        throw new Error(`${label}.controls[${index}] options \u65E0\u6548`);
      }
      if (type === "range") {
        const min = Number(control.min);
        const max = Number(control.max);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw new Error(`${label}.controls[${index}] \u8303\u56F4\u65E0\u6548`);
      }
      return {
        id: String(control.id),
        type,
        label: control.label,
        description: control.description || "",
        path: type === "animation-select" ? "" : String(control.path),
        target: type === "animation-select" ? control.target : void 0,
        packId: type === "animation-select" ? String(control.packId || "") : void 0,
        accept: type === "audio" ? String(control.accept || "audio/*") : void 0,
        min: type === "range" ? Number(control.min) : void 0,
        max: type === "range" ? Number(control.max) : void 0,
        step: type === "range" ? Number(control.step || 0.01) : void 0,
        options: type === "select" ? control.options.map((option) => ({ value: String(option.value), label: option.label })) : void 0,
        default: control.default
      };
    });
    const settingsKey = String(value.settingsKey || "settings");
    if (!SETTING_PATH_PATTERN.test(settingsKey)) throw new Error(`${label}.settingsKey \u65E0\u6548`);
    return { type: "settings", settingsKey, controls };
  }
  function normalizePages(value) {
    if (value === void 0) return [];
    if (!Array.isArray(value) || value.length > 32) throw new Error("pages \u5FC5\u987B\u662F\u6700\u591A 32 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((rawPage, index) => {
      if (!rawPage || typeof rawPage !== "object" || Array.isArray(rawPage)) throw new Error(`pages[${index}] \u65E0\u6548`);
      const id = String(rawPage.id || "");
      if (!CONTRIBUTION_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`pages[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const title = String(rawPage.title || "").trim();
      if (!title || title.length > 120) throw new Error(`pages[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      if (rawPage.location !== void 0 && !["plugins", "dock"].includes(rawPage.location)) throw new Error(`pages[${index}].location \u65E0\u6548`);
      const platformEntries = normalizePlatformEntries(rawPage.platformEntries, `pages[${index}].platformEntries`);
      const entry = rawPage.entry ? validatePath(rawPage.entry) : "";
      const native = normalizeNativePage(rawPage.native, `pages[${index}].native`);
      if (!entry && !Object.keys(platformEntries).length && !native) throw new Error(`pages[${index}] \u7F3A\u5C11\u53EF\u7528\u7684\u9875\u9762\u5165\u53E3`);
      const order = rawPage.order === void 0 ? 500 : Number(rawPage.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error(`pages[${index}].order \u5FC5\u987B\u662F 0-999 \u7684\u6574\u6570`);
      const icon = String(rawPage.icon || "apps-24-regular");
      if (!/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(icon)) throw new Error(`pages[${index}].icon \u65E0\u6548`);
      const titleEn = String(rawPage.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`pages[${index}].titleEn \u8FC7\u957F`);
      return {
        id,
        title,
        titleEn,
        icon,
        entry,
        platformEntries,
        native,
        location: rawPage.location === "dock" ? "dock" : "plugins",
        order,
        description: String(rawPage.description || "").slice(0, 300)
      };
    });
  }
  function normalizeCommands(value) {
    if (value === void 0) return [];
    if (!Array.isArray(value) || value.length > 64) throw new Error("commands \u5FC5\u987B\u662F\u6700\u591A 64 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((rawCommand, index) => {
      if (!rawCommand || typeof rawCommand !== "object" || Array.isArray(rawCommand)) {
        throw new Error(`commands[${index}] \u65E0\u6548`);
      }
      const id = String(rawCommand.id || "");
      if (!CONTRIBUTION_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`commands[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const title = String(rawCommand.title || "").trim();
      if (!title || title.length > 120) throw new Error(`commands[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      const titleEn = String(rawCommand.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`commands[${index}].titleEn \u8FC7\u957F`);
      const locations = [...new Set(Array.isArray(rawCommand.locations) ? rawCommand.locations.map(String) : ["command-palette"])];
      const unknownLocation = locations.find((location) => !PLUGIN_COMMAND_LOCATIONS.has(location));
      if (unknownLocation) throw new Error(`commands[${index}] \u5305\u542B\u672A\u77E5 location\uFF1A${unknownLocation}`);
      const icon = String(rawCommand.icon || "apps-24-regular");
      if (!/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(icon)) throw new Error(`commands[${index}].icon \u65E0\u6548`);
      const order = rawCommand.order === void 0 ? 500 : Number(rawCommand.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error(`commands[${index}].order \u5FC5\u987B\u662F 0-999 \u7684\u6574\u6570`);
      return {
        id,
        title,
        titleEn,
        description: String(rawCommand.description || "").slice(0, 300),
        icon,
        locations,
        order
      };
    });
  }
  function normalizeUiSection(value, permissions, sdkVersion) {
    if (sdkVersion === 1) {
      if (value !== void 0) throw new Error("sdkVersion 1 \u63D2\u4EF6\u4E0D\u5141\u8BB8\u58F0\u660E ui \u6BB5");
      return void 0;
    }
    if (!permissions.includes("ui:pages")) throw new Error("ui \u6BB5\u9700\u8981 ui:pages \u6743\u9650");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ui \u6BB5\u65E0\u6548");
    if (value.schemaVersion !== UI_TREE_SCHEMA_VERSION) throw new Error(`ui.schemaVersion \u5FC5\u987B\u4E3A ${UI_TREE_SCHEMA_VERSION}`);
    if (!Array.isArray(value.pages) || !value.pages.length || value.pages.length > 8) throw new Error("ui.pages \u5FC5\u987B\u5305\u542B 1-8 \u9879");
    const ids = /* @__PURE__ */ new Set();
    const pages = value.pages.map((rawPage, index) => {
      if (!rawPage || typeof rawPage !== "object" || Array.isArray(rawPage)) throw new Error(`ui.pages[${index}] \u65E0\u6548`);
      const id = String(rawPage.id || "");
      if (!CONTRIBUTION_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`ui.pages[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const title = String(rawPage.title || "").trim();
      if (!title || title.length > 120) throw new Error(`ui.pages[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      const titleEn = String(rawPage.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`ui.pages[${index}].titleEn \u8FC7\u957F`);
      const icon = String(rawPage.icon || "apps-24-regular");
      if (!/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(icon)) throw new Error(`ui.pages[${index}].icon \u65E0\u6548`);
      const order = rawPage.order === void 0 ? 500 : Number(rawPage.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error(`ui.pages[${index}].order \u5FC5\u987B\u662F 0-999 \u7684\u6574\u6570`);
      if (rawPage.location !== void 0 && !["plugins", "dock"].includes(rawPage.location)) throw new Error(`ui.pages[${index}].location \u65E0\u6548`);
      const source = validatePath(rawPage.source);
      if (!source) throw new Error(`ui.pages[${index}] \u7F3A\u5C11 source`);
      return { id, title, titleEn, icon, source, location: rawPage.location === "dock" ? "dock" : "plugins", order, description: String(rawPage.description || "").slice(0, 300) };
    });
    return { schemaVersion: UI_TREE_SCHEMA_VERSION, pages };
  }
  function normalizePluginManifest(raw) {
    if (!raw || typeof raw !== "object") throw new Error("manifest.json \u65E0\u6548");
    const manifest = JSON.parse(JSON.stringify(raw));
    if (manifest.schemaVersion !== 1) throw new Error("\u4E0D\u652F\u6301\u7684\u63D2\u4EF6\u6E05\u5355\u7248\u672C");
    if (!ID_PATTERN.test(manifest.id || "")) throw new Error("\u63D2\u4EF6 ID \u65E0\u6548\uFF0C\u5EFA\u8BAE\u4F7F\u7528\u53CD\u5411\u57DF\u540D\u683C\u5F0F");
    if (!manifest.name || !manifest.version || !manifest.author) throw new Error("\u63D2\u4EF6\u540D\u79F0\u3001\u7248\u672C\u6216\u5F00\u53D1\u8005\u7F3A\u5931");
    if (!manifest.engine || comparePluginVersions(PLUGIN_API_VERSION, manifest.engine.min || "0") < 0) {
      throw new Error(`\u63D2\u4EF6\u9700\u8981 API ${manifest.engine?.min || "\u672A\u77E5"}\uFF0C\u5F53\u524D\u4E3A ${PLUGIN_API_VERSION}`);
    }
    const sdkVersion = manifest.sdkVersion === void 0 ? 1 : manifest.sdkVersion;
    if (![1, 2].includes(sdkVersion)) throw new Error("sdkVersion \u5FC5\u987B\u4E3A 1 \u6216 2");
    manifest.sdkVersion = sdkVersion;
    manifest.permissions = [...new Set(manifest.permissions || [])];
    const unknownPermission = manifest.permissions.find((permission) => !PLUGIN_PERMISSIONS.has(permission));
    if (unknownPermission) throw new Error(`\u672A\u77E5\u63D2\u4EF6\u6743\u9650\uFF1A${unknownPermission}`);
    manifest.contributes = manifest.contributes && typeof manifest.contributes === "object" ? manifest.contributes : {};
    manifest.contributes.pages = normalizePages(manifest.contributes.pages);
    manifest.contributes.commands = normalizeCommands(manifest.contributes.commands);
    manifest.contributes.animationPacks = normalizeAnimationPacks(manifest.contributes.animationPacks, manifest.permissions);
    manifest.contributes.visualSurfaces = normalizeVisualSurfaces(manifest.contributes.visualSurfaces, manifest.permissions);
    manifest.contributes.appearancePacks = normalizeAppearancePacks(manifest.contributes.appearancePacks, manifest.permissions);
    manifest.contributes.componentStylePacks = normalizeComponentStylePacks(manifest.contributes.componentStylePacks, manifest.permissions, { pluginId: manifest.id });
    manifest.contributes.fonts = normalizeFonts(manifest.contributes.fonts, manifest.permissions, { pluginId: manifest.id });
    manifest.contributes.componentOverridePacks = normalizeComponentOverridePacks(manifest.contributes.componentOverridePacks, manifest.permissions);
    manifest.contributes.nativeViews = normalizeNativeViews(manifest.contributes.nativeViews, manifest.permissions);
    manifest.contributes.resultPresentations = normalizeResultPresentations(manifest.contributes.resultPresentations, manifest.permissions);
    manifest.supportedPlatforms = normalizePlatforms(manifest.supportedPlatforms, "supportedPlatforms");
    manifest.platformEntries = normalizePlatformEntries(manifest.platformEntries, "platformEntries");
    manifest.capabilities = normalizeCapabilities(manifest.capabilities, manifest.permissions);
    manifest.systemOperations = normalizeSystemOperations(manifest.systemOperations, manifest.permissions);
    manifest.dependencies = normalizeDependencies(manifest.dependencies, manifest.id);
    manifest.ui = normalizeUiSection(manifest.ui, manifest.permissions, manifest.sdkVersion);
    if (manifest.entry) manifest.entry = validatePath(manifest.entry);
    if (manifest.contributes.commands.length && !manifest.entry && !Object.keys(manifest.platformEntries).length) {
      throw new Error("commands \u9700\u8981\u63D2\u4EF6 Worker \u5165\u53E3");
    }
    if (!manifest.entry && !Object.keys(manifest.platformEntries).length && !(manifest.contributes.pages || []).length && !manifest.contributes.commands.length && !manifest.contributes.visualSurfaces.length && !manifest.contributes.appearancePacks.length && !manifest.contributes.componentStylePacks.length && !manifest.contributes.componentOverridePacks.length && !manifest.contributes.nativeViews.length && !manifest.contributes.resultPresentations.length && !manifest.contributes.fonts.length && !(manifest.ui?.pages || []).length) {
      throw new Error("\u63D2\u4EF6\u81F3\u5C11\u9700\u8981\u4E00\u4E2A Worker\u3001\u9875\u9762\u3001\u89C6\u89C9\u5C42\u6216\u5916\u89C2\u5305\u5165\u53E3");
    }
    if (manifest.icon) manifest.icon = validatePath(manifest.icon);
    if (manifest.readme) manifest.readme = validatePath(manifest.readme);
    return manifest;
  }

  // ../../packages/cyrene-core/src/ui-tree.js
  var KEY_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i;
  var ICON_PATTERN = /^[a-z0-9][a-z0-9:_-]{0,99}$/i;
  var ALLOWED_NODE_FIELDS = /* @__PURE__ */ new Set([
    "type",
    "id",
    "title",
    "titleEn",
    "children",
    "action",
    "gap",
    "label",
    "placeholder",
    "rows",
    "path",
    "itemsPath",
    "template",
    "options",
    "value",
    "text",
    "variant",
    "tone",
    "icon",
    "min",
    "max",
    "step"
  ]);
  function uiTreeError(message) {
    return Object.assign(new Error(message), { code: "UI_TREE_INVALID" });
  }
  function validateBindingPath(raw, label, writable, { itemContext = false } = {}) {
    if (typeof raw !== "string" || raw.length > 200) throw uiTreeError(`${label} \u7ED1\u5B9A\u8DEF\u5F84\u65E0\u6548`);
    if (itemContext && (raw === "item" || raw.startsWith("item."))) {
      const field = raw.slice("item.".length);
      if (!field || !KEY_PATTERN.test(field)) throw uiTreeError(`${label} \u5217\u8868\u9879\u5B57\u6BB5\u65E0\u6548\uFF1A${field}`);
      return { source: "item", path: raw, writable: false };
    }
    const source = UI_TREE_BINDING_SOURCES.filter((candidate) => raw === candidate || raw.startsWith(`${candidate}.`)).sort((left, right) => right.length - left.length)[0];
    if (!source) throw uiTreeError(`${label} \u7ED1\u5B9A\u6E90\u4E0D\u53D7\u652F\u6301\uFF1A${raw.split(".")[0]}`);
    const remainder = raw.slice(source.length + 1);
    if (source === "core") {
      const resource = remainder.split(".")[0];
      if (!UI_TREE_CORE_READONLY_SOURCES.includes(resource)) throw uiTreeError(`${label} \u6838\u5FC3\u5FEB\u7167\u53EA\u8BFB\u6E90\u65E0\u6548\uFF1A${resource || "\u7F3A\u5931"}`);
      if (remainder.split(".").length > 1 || writable) throw uiTreeError(`${label} \u6838\u5FC3\u5FEB\u7167\u4E3A\u53EA\u8BFB`);
      return { source, path: raw, writable: false };
    }
    if (!remainder || !KEY_PATTERN.test(remainder)) throw uiTreeError(`${label} \u7ED1\u5B9A\u952E\u65E0\u6548\uFF1A${remainder}`);
    if (source === "settings" && !SETTING_PATH_PATTERN.test(remainder)) throw uiTreeError(`${label} \u8BBE\u7F6E\u952E\u65E0\u6548\uFF1A${remainder}`);
    return { source, path: raw, writable: true };
  }
  function validateAction(action, label) {
    if (!action || typeof action !== "object" || Array.isArray(action)) throw uiTreeError(`${label} action \u65E0\u6548`);
    const method = String(action.method || "");
    if (!HOST_BRIDGE_METHODS.some((item) => item.id === method)) throw uiTreeError(`${label} action \u65B9\u6CD5\u4E0D\u5728 HostBridge \u5951\u7EA6\u5185\uFF1A${method}`);
    const args = action.args && typeof action.args === "object" && !Array.isArray(action.args) ? JSON.parse(JSON.stringify(action.args)) : {};
    return { method, args };
  }
  function validateText(raw, label, max = UI_TREE_MAX_TEXT) {
    if (typeof raw !== "string" || raw.length > max) throw uiTreeError(`${label} \u6587\u672C\u65E0\u6548\u6216\u8FC7\u957F`);
    if (/[{};<>\\]/.test(raw)) throw uiTreeError(`${label} \u6587\u672C\u5305\u542B\u4E0D\u5B89\u5168\u5185\u5BB9`);
    return raw;
  }
  function validateOptions(raw, label) {
    if (!Array.isArray(raw) || !raw.length || raw.length > UI_TREE_MAX_OPTIONS) throw uiTreeError(`${label} options \u5FC5\u987B\u5305\u542B 1-${UI_TREE_MAX_OPTIONS} \u9879`);
    const values = /* @__PURE__ */ new Set();
    return raw.map((option, index) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) throw uiTreeError(`${label}.options[${index}] \u65E0\u6548`);
      const value = String(option.value || "");
      if (!value || value.length > 200 || values.has(value)) throw uiTreeError(`${label}.options[${index}] value \u65E0\u6548\u6216\u91CD\u590D`);
      values.add(value);
      return { value, label: validateText(String(option.label || value), `${label}.options[${index}].label`) };
    });
  }
  function normalizeControl(node, label, writable, itemContext) {
    const type = node.type;
    if (!UI_TREE_CONTROL_TYPES.includes(type)) throw uiTreeError(`${label} \u63A7\u4EF6\u7C7B\u578B\u4E0D\u53D7\u652F\u6301\uFF1A${type}`);
    const result = { type };
    if (node.id) result.id = String(node.id);
    if (type === "text") {
      if (node.path) result.binding = validateBindingPath(node.path, label, false, { itemContext });
      else result.value = validateText(String(node.value ?? ""), `${label}.value`);
    }
    if (type === "button") {
      result.label = validateText(String(node.label || ""), `${label}.label`, 120);
      if (node.variant !== void 0) {
        if (!UI_TREE_BUTTON_VARIANTS.includes(node.variant)) throw uiTreeError(`${label} button variant \u65E0\u6548`);
        result.variant = node.variant;
      }
      result.action = validateAction(node.action, label);
    }
    if (["text-input", "multiline-input", "toggle", "checkbox", "slider", "number-stepper", "progress"].includes(type)) {
      if (type === "text-input" || type === "multiline-input") {
        if (node.label !== void 0) result.label = validateText(String(node.label), `${label}.label`, 120);
        if (node.placeholder !== void 0) result.placeholder = validateText(String(node.placeholder), `${label}.placeholder`, 120);
        if (type === "multiline-input" && node.rows !== void 0) {
          const rows = Number(node.rows);
          if (!Number.isInteger(rows) || rows < 1 || rows > 16) throw uiTreeError(`${label}.rows \u65E0\u6548`);
          result.rows = rows;
        }
      }
      if (["toggle", "checkbox"].includes(type)) result.label = validateText(String(node.label || ""), `${label}.label`, 120);
      if (type === "slider" || type === "number-stepper") {
        if (type === "slider") {
          if (node.label !== void 0) result.label = validateText(String(node.label), `${label}.label`, 120);
          const min = Number(node.min);
          const max = Number(node.max);
          if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw uiTreeError(`${label} \u8303\u56F4\u65E0\u6548`);
          result.min = min;
          result.max = max;
          if (node.step !== void 0) {
            const step = Number(node.step);
            if (!Number.isFinite(step) || step <= 0) throw uiTreeError(`${label}.step \u65E0\u6548`);
            result.step = step;
          }
        }
        if (type === "number-stepper") {
          if (node.min !== void 0 || node.max !== void 0) {
            const min = Number(node.min);
            const max = Number(node.max);
            if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw uiTreeError(`${label} \u8303\u56F4\u65E0\u6548`);
            result.min = min;
            result.max = max;
          }
        }
      }
      if (node.path) result.binding = validateBindingPath(node.path, label, writable, { itemContext });
    }
    if (["radio", "select"].includes(type)) {
      result.label = validateText(String(node.label || ""), `${label}.label`, 120);
      result.options = validateOptions(node.options, label);
      if (node.path) result.binding = validateBindingPath(node.path, label, writable, { itemContext });
    }
    if (type === "list") {
      result.itemsPath = validateBindingPath(node.itemsPath, `${label}.itemsPath`, false);
      if (result.itemsPath.writable) throw uiTreeError(`${label} \u5217\u8868\u6570\u636E\u6E90\u5FC5\u987B\u4E3A\u53EA\u8BFB`);
      if (!node.template || typeof node.template !== "object" || Array.isArray(node.template)) throw uiTreeError(`${label}.template \u65E0\u6548`);
      result.template = normalizeNode2(node.template, `${label}.template`, writable, 1, true);
    }
    if (type === "badge") {
      if (node.text !== void 0) result.text = validateText(String(node.text), `${label}.text`, 120);
      else if (node.path) result.binding = validateBindingPath(node.path, label, false, { itemContext });
      else throw uiTreeError(`${label} badge \u9700\u8981 text \u6216 path`);
      if (node.tone !== void 0) {
        if (!UI_TREE_TONES.includes(node.tone)) throw uiTreeError(`${label} badge tone \u65E0\u6548`);
        result.tone = node.tone;
      }
    }
    if (type === "icon") {
      const icon = String(node.icon || "");
      if (!ICON_PATTERN.test(icon)) throw uiTreeError(`${label} icon \u65E0\u6548`);
      result.icon = icon;
    }
    if (node.action !== void 0) result.action = validateAction(node.action, label);
    return result;
  }
  function normalizeNode2(raw, label, writable, depth, itemContext = false) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw uiTreeError(`${label} \u8282\u70B9\u65E0\u6548`);
    if (depth > UI_TREE_MAX_DEPTH) throw uiTreeError(`${label} \u8D85\u8FC7\u6700\u5927\u5D4C\u5957\u6DF1\u5EA6 ${UI_TREE_MAX_DEPTH}`);
    const unknownField = Object.keys(raw).find((key) => !ALLOWED_NODE_FIELDS.has(key));
    if (unknownField) throw uiTreeError(`${label} \u4E0D\u5141\u8BB8\u5B57\u6BB5 ${unknownField}`);
    const type = String(raw.type || "");
    if (!UI_TREE_NODE_TYPES.includes(type)) throw uiTreeError(`${label} \u8282\u70B9\u7C7B\u578B\u4E0D\u53D7\u652F\u6301\uFF1A${type}`);
    if (raw.id !== void 0 && !CONTRIBUTION_ID_PATTERN.test(String(raw.id || ""))) throw uiTreeError(`${label} \u8282\u70B9 ID \u65E0\u6548`);
    const result = { type };
    if (raw.id) result.id = String(raw.id);
    if (["page", "section", "card"].includes(type)) {
      if (raw.title !== void 0) result.title = validateText(String(raw.title), `${label}.title`, 120);
      if (raw.titleEn !== void 0) result.titleEn = validateText(String(raw.titleEn), `${label}.titleEn`, 120);
    }
    if (type === "row" || type === "column") {
      if (raw.gap !== void 0) {
        const gap = Number(raw.gap);
        if (!Number.isFinite(gap) || gap < 0 || gap > 64) throw uiTreeError(`${label}.gap \u65E0\u6548`);
        result.gap = gap;
      }
    }
    if (type === "list") {
      return normalizeControl(raw, label, writable, itemContext);
    }
    if (UI_TREE_CONTROL_TYPES.includes(type)) {
      return normalizeControl(raw, label, writable, itemContext);
    }
    if (raw.children !== void 0) {
      if (!Array.isArray(raw.children) || !raw.children.length || raw.children.length > UI_TREE_MAX_CHILDREN) {
        throw uiTreeError(`${label} children \u5FC5\u987B\u5305\u542B 1-${UI_TREE_MAX_CHILDREN} \u9879`);
      }
      result.children = raw.children.map((child, index) => normalizeNode2(child, `${label}.children[${index}]`, writable, depth + 1, itemContext));
    }
    if (raw.action !== void 0) result.action = validateAction(raw.action, label);
    return result;
  }
  function normalizeUiTree(raw, { pluginId = "" } = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw uiTreeError("UI \u58F0\u660E\u6811\u65E0\u6548");
    if (raw.schemaVersion !== UI_TREE_SCHEMA_VERSION) throw uiTreeError(`UI \u58F0\u660E\u6811 schemaVersion \u5FC5\u987B\u4E3A ${UI_TREE_SCHEMA_VERSION}`);
    if (!raw.root || typeof raw.root !== "object" || Array.isArray(raw.root)) throw uiTreeError("UI \u58F0\u660E\u6811\u7F3A\u5C11 root");
    if (pluginId && raw.root.type === "page" && raw.root.id && String(raw.root.id) !== `${pluginId}.main`) {
      if (raw.root.id !== pluginId) throw uiTreeError(`UI \u58F0\u660E\u6811 root.id \u4E0E\u63D2\u4EF6 ID \u4E0D\u4E00\u81F4\uFF1A${raw.root.id}`);
    }
    let nodeCount = 0;
    const countNodes = (node) => {
      nodeCount += 1;
      if (nodeCount > UI_TREE_MAX_NODES) throw uiTreeError(`UI \u58F0\u660E\u6811\u8D85\u8FC7\u6700\u5927\u8282\u70B9\u6570 ${UI_TREE_MAX_NODES}`);
      for (const child of node.children || []) countNodes(child);
      if (node.template) countNodes(node.template);
    };
    countNodes(raw.root);
    const root = normalizeNode2(raw.root, "root", true, 1);
    return { schemaVersion: UI_TREE_SCHEMA_VERSION, root, nodeCount };
  }

  // ../../packages/cyrene-core/src/ui-tree-render-plan.js
  function resolveBinding(binding, dataContext = {}) {
    if (!binding) return void 0;
    const { source, path } = binding;
    if (source === "settings") return dataContext.settings?.[path.slice("settings.".length)];
    if (source === "plugin") return dataContext.pluginStorage?.[path.slice("plugin.storage.".length)];
    if (source === "ui.state") return dataContext.uiState?.[path.slice("ui.state.".length)];
    if (source === "core") return dataContext.core?.[path.slice("core.".length)];
    if (source === "item") return dataContext.item?.[path.slice("item.".length)];
    return void 0;
  }
  function planNode(node, dataContext, depth) {
    const plan = { kind: node.type };
    if (node.id) plan.id = node.id;
    if (node.title) plan.title = node.title;
    if (node.titleEn) plan.titleEn = node.titleEn;
    if (node.gap !== void 0) plan.gap = node.gap;
    if (node.label) plan.label = node.label;
    if (node.variant) plan.variant = node.variant;
    if (node.tone) plan.tone = node.tone;
    if (node.icon) plan.icon = node.icon;
    if (node.rows) plan.rows = node.rows;
    if (node.placeholder) plan.placeholder = node.placeholder;
    if (node.min !== void 0) plan.min = node.min;
    if (node.max !== void 0) plan.max = node.max;
    if (node.step !== void 0) plan.step = node.step;
    if (node.options) plan.options = node.options;
    if (node.value !== void 0) plan.value = node.value;
    if (node.text !== void 0) plan.text = node.text;
    if (node.action) plan.action = node.action;
    if (node.binding) {
      plan.binding = { source: node.binding.source, path: node.binding.path, value: resolveBinding(node.binding, dataContext) };
    }
    if (node.children) plan.children = node.children.map((child) => planNode(child, dataContext, depth + 1));
    return plan;
  }
  function buildRenderPlan(tree, dataContext = {}) {
    if (!tree?.root) throw Object.assign(new Error("UI \u6E32\u67D3\u8BA1\u5212\u9700\u8981\u5DF2\u6821\u9A8C\u7684\u58F0\u660E\u6811"), { code: "UI_TREE_INVALID" });
    const root = planNode(tree.root, dataContext, 1);
    return { schemaVersion: tree.schemaVersion, nodeCount: tree.nodeCount, root };
  }

  // ../../packages/cyrene-core/src/plugin-package.js
  var import_jszip = __toESM(require_jszip_min(), 1);
  async function sha256Hex(bytes) {
    if (typeof globalThis.__cyreneSha256Hex === "function") {
      return globalThis.__cyreneSha256Hex(bytes instanceof Uint8Array ? Array.from(bytes) : Array.from(new Uint8Array(bytes)));
    }
    const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function fromBase64(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }
  async function verifyPublisherSignature(envelope, expectedPublisherKey = "") {
    if (!envelope.signature) {
      if (expectedPublisherKey) throw new Error("\u63D2\u4EF6\u76EE\u5F55\u8981\u6C42\u53D1\u5E03\u8005\u7B7E\u540D\uFF0C\u4F46\u63D2\u4EF6\u5305\u672A\u7B7E\u540D");
      return { verified: false, publisherKey: "" };
    }
    if (envelope.signatureAlgorithm !== "Ed25519" || !envelope.publisherKey) {
      throw new Error("\u63D2\u4EF6\u53D1\u5E03\u8005\u7B7E\u540D\u683C\u5F0F\u65E0\u6548");
    }
    if (expectedPublisherKey && envelope.publisherKey !== expectedPublisherKey) {
      throw new Error("\u63D2\u4EF6\u53D1\u5E03\u8005\u516C\u94A5\u4E0E\u76EE\u5F55\u767B\u8BB0\u4E0D\u4E00\u81F4");
    }
    let key;
    try {
      key = await crypto.subtle.importKey("spki", fromBase64(envelope.publisherKey), { name: "Ed25519" }, false, ["verify"]);
    } catch {
      throw new Error("\u63D2\u4EF6\u53D1\u5E03\u8005\u516C\u94A5\u65E0\u6548");
    }
    const signed = new TextEncoder().encode(`${envelope.id}\0${envelope.version}\0${envelope.hash}`);
    const valid = await crypto.subtle.verify("Ed25519", key, fromBase64(envelope.signature), signed);
    if (!valid) throw new Error("\u63D2\u4EF6\u53D1\u5E03\u8005\u7B7E\u540D\u9A8C\u8BC1\u5931\u8D25\uFF0C\u6587\u4EF6\u53EF\u80FD\u5DF2\u88AB\u66FF\u6362");
    return { verified: true, publisherKey: envelope.publisherKey };
  }
  async function decryptCnrp(bytes) {
    const header = new TextDecoder().decode(bytes.subarray(0, CNRP_MAGIC.length));
    if (header !== CNRP_MAGIC) throw new Error("\u4E0D\u662F\u6709\u6548\u7684 .cnrp \u63D2\u4EF6\u5305");
    let envelope;
    try {
      envelope = JSON.parse(new TextDecoder().decode(bytes.subarray(CNRP_MAGIC.length)));
    } catch {
      throw new Error("CNRP \u5C01\u88C5\u6570\u636E\u65E0\u6548");
    }
    if (envelope.v !== 1 || !envelope.id || !envelope.version || !envelope.salt || !envelope.iv || !envelope.data || !envelope.hash) {
      throw new Error("CNRP \u52A0\u5BC6\u5C01\u88C5\u65E0\u6548");
    }
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(`${envelope.id}@${envelope.version}:CyreneNameRollerPlugin-v1`),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: fromBase64(envelope.salt), iterations: 12e4, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const additionalData = new TextEncoder().encode(`${envelope.id}\0${envelope.version}\0${envelope.hash}`);
    let decrypted;
    try {
      decrypted = new Uint8Array(await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(envelope.iv), additionalData },
        key,
        fromBase64(envelope.data)
      ));
    } catch {
      throw new Error("\u63D2\u4EF6\u5305\u89E3\u5BC6\u6216\u8BA4\u8BC1\u5931\u8D25\uFF0C\u6587\u4EF6\u53EF\u80FD\u5DF2\u88AB\u7BE1\u6539");
    }
    if (await sha256Hex(decrypted) !== envelope.hash) throw new Error("\u63D2\u4EF6\u5305\u6574\u4F53\u54C8\u5E0C\u4E0D\u5339\u914D");
    return { bytes: decrypted, envelope };
  }
  async function parsePluginPackage(input, { expectedPublisherKey = "" } = {}) {
    const packageBytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (packageBytes.byteLength > MAX_PLUGIN_SIZE) throw new Error("\u63D2\u4EF6\u5305\u8D85\u8FC7 32 MB \u9650\u5236");
    const { bytes, envelope } = await decryptCnrp(packageBytes);
    const publisher = await verifyPublisherSignature(envelope, expectedPublisherKey);
    const archive = await import_jszip.default.loadAsync(bytes, { checkCRC32: true, createFolders: false });
    const fileNames = Object.keys(archive.files).filter((name) => !archive.files[name].dir);
    if (fileNames.length > MAX_FILE_COUNT) throw new Error("\u63D2\u4EF6\u5305\u6587\u4EF6\u6570\u91CF\u8FC7\u591A");
    fileNames.forEach(validatePath);
    const manifestEntry = archive.file("manifest.json");
    if (!manifestEntry) throw new Error("\u63D2\u4EF6\u5305\u7F3A\u5C11 manifest.json");
    const manifest = normalizePluginManifest(JSON.parse(await manifestEntry.async("string")));
    if (manifest.id !== envelope.id || manifest.version !== envelope.version) {
      throw new Error("\u63D2\u4EF6\u6E05\u5355\u4E0E CNRP \u5C01\u88C5\u8EAB\u4EFD\u4E0D\u4E00\u81F4");
    }
    const files = {};
    let totalUncompressedSize = 0;
    for (const name of fileNames) {
      const content = await archive.file(name).async("uint8array");
      totalUncompressedSize += content.byteLength;
      if (totalUncompressedSize > 64 * 1024 * 1024) throw new Error("\u63D2\u4EF6\u89E3\u538B\u5185\u5BB9\u8D85\u8FC7 64 MB \u9650\u5236");
      let binary = "";
      for (let index = 0; index < content.length; index += 32768) binary += String.fromCharCode(...content.subarray(index, index + 32768));
      files[name] = btoa(binary);
    }
    const requiredFiles = [
      manifest.entry,
      ...Object.values(manifest.platformEntries || {}),
      manifest.icon,
      manifest.readme,
      ...(manifest.contributes.pages || []).flatMap((page) => [page.entry, ...Object.values(page.platformEntries || {})]),
      ...(manifest.contributes.animationPacks || []).map((pack) => pack.source),
      ...(manifest.contributes.fonts || []).map((font) => font.source),
      ...(manifest.contributes.nativeViews || []).map((view) => view.source),
      ...(manifest.contributes.visualSurfaces || []).flatMap((surface) => [surface.entry, ...Object.values(surface.platformEntries || {})]),
      ...(manifest.ui?.pages || []).map((page) => page.source)
    ].filter(Boolean);
    for (const name of requiredFiles) if (!files[name]) throw new Error(`\u63D2\u4EF6\u6E05\u5355\u5F15\u7528\u7684\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${name}`);
    validateFontFiles(manifest.contributes.fonts || [], files);
    const integrity = manifest.integrity || {};
    for (const name of fileNames) {
      if (name !== "manifest.json" && !Object.hasOwn(integrity, name)) throw new Error(`\u5B8C\u6574\u6027\u6E05\u5355\u672A\u8986\u76D6\u6587\u4EF6\uFF1A${name}`);
    }
    const nativeViews = (manifest.contributes.nativeViews || []).map((declaration) => {
      try {
        return { ...declaration, document: normalizeNativeViewDocument(JSON.parse(decodePluginFile({ files }, declaration.source)), `nativeView ${declaration.id}`) };
      } catch (error) {
        if (error?.code) throw error;
        throw new Error(`\u539F\u751F\u89C6\u56FE ${declaration.id} \u65E0\u6CD5\u89E3\u6790\uFF1A${error.message || error}`);
      }
    });
    for (const [name, expected] of Object.entries(integrity)) {
      const encoded = files[validatePath(name)];
      if (!encoded) throw new Error(`\u5B8C\u6574\u6027\u6E05\u5355\u6587\u4EF6\u7F3A\u5931\uFF1A${name}`);
      const actual = await sha256Hex(Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)));
      if (actual !== String(expected).toLowerCase()) throw new Error(`\u63D2\u4EF6\u6587\u4EF6\u5B8C\u6574\u6027\u6821\u9A8C\u5931\u8D25\uFF1A${name}`);
    }
    const packageHash = await sha256Hex(packageBytes);
    const animationPacks = (manifest.contributes.animationPacks || []).map((declaration) => {
      let raw;
      try {
        raw = JSON.parse(decodePluginFile({ files }, declaration.source));
      } catch (error) {
        throw new Error(`\u52A8\u753B\u5305 ${declaration.id} \u65E0\u6CD5\u89E3\u6790\uFF1A${error.message || error}`);
      }
      return normalizeAnimationPack(raw, declaration);
    });
    const uiPages = (manifest.ui?.pages || []).map((declaration) => {
      let raw;
      try {
        raw = JSON.parse(decodePluginFile({ files }, declaration.source));
      } catch (error) {
        throw new Error(`UI \u9875\u9762 ${declaration.id} \u65E0\u6CD5\u89E3\u6790\uFF1A${error.message || error}`);
      }
      return { ...declaration, tree: normalizeUiTree(raw, { pluginId: manifest.id }) };
    });
    return {
      manifest,
      files,
      animationPacks,
      nativeViews,
      uiPages,
      packageHash,
      packageSignature: envelope.signature || "",
      publisherKey: publisher.publisherKey,
      publisherVerified: publisher.verified,
      signatureAlgorithm: envelope.signatureAlgorithm || "",
      readme: archive.file(manifest.readme || "README.md") ? await archive.file(manifest.readme || "README.md").async("string") : ""
    };
  }
  function decodePluginFile(plugin, path, binary = false) {
    const encoded = plugin?.files?.[validatePath(path)];
    if (!encoded) throw new Error(`\u63D2\u4EF6\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${path}`);
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    return binary ? bytes : new TextDecoder().decode(bytes);
  }
  return __toCommonJS(index_exports);
})();
