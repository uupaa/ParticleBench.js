// @name: WorkerRenderEx.js
// @require: Clock.js
// @cutoff: @node

(function(global) {
"use strict";

// --- variable --------------------------------------------
var Clock = global["Clock"] || require("uupaa.clock.js");

var _inNode = "process" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function WorkerRenderEx(param,      // @arg Object: { src, count, canvas, frameSkip }
                                    //     param.src - URLString:
                                    //     param.count - Integer(= 1000):
                                    //     param.canvas - HTMLCanvasElement:
                                    //     param.frameSkip - Boolean(= false):
                        callback) { // @arg Function(= null): callback(fps:Number)
                                    // @help: WorkerRenderEx
    _init(this, param, callback || null);
}

WorkerRenderEx["repository"] = "https://github.com/uupaa/WorkerRenderEx.js";

// --- public method ---
WorkerRenderEx["prototype"]["run"]    = WorkerRenderEx_run;    // WorkerRenderEx#run():this
WorkerRenderEx["prototype"]["stop"]   = WorkerRenderEx_stop;   // WorkerRenderEx#stop():this
// --- private method ---
//WorkerRenderEx["prototype"]["update"] = WorkerRenderEx_update; // ParticleBench#update(particles, imageData, width, height, mx, my):this
WorkerRenderEx["prototype"]["render"] = WorkerRenderEx_render; // WorkerRenderEx#render(particles:ArrayBuffer):this

// --- implement -------------------------------------------
function _init(that, param, callback) {
    var count  = param["count"] || 1000;
    var canvas = param["canvas"];
    var width  = canvas.width;
    var height = canvas.height;

    that._offsetX = param["offset"]["x"];
    that._offsetY = param["offset"]["y"];
    that._bgoffsetX = param["bgoffset"]["x"];
    that._bgoffsetY = param["bgoffset"]["y"];

    // --- Worker ---
    that._worker = new Worker(param["src"]);
    that._worker.onmessage = function(event) {
        if (that._running) {
            that.render(event.data);
        }
    };
    that._worker.postMessage({ init: true, count: count, width: width, height: height });

    // --- Canvas ---
    that._ctx = canvas.getContext("2d");
    that._bgctx = document.getCSSCanvasContext("2d", param.bgcanvas, width + 1, height + 1);

    // TODO: -webkit-canvas burn-in.
    //
    // ineffective
    //  setTimeout(function() {
    //      that._bgctx.clearRect(0, 0, width, height);
    //  }, 1000);

    that._imageData = that._ctx.createImageData(width, height);
    that._bgimageData = that._bgctx.createImageData(width, height);

    canvas.addEventListener("click", _handleCanvasMouseClickEvent.bind(that));
    canvas.addEventListener("mousemove", _handleCanvasMouseMoveEvent.bind(that));

    // --- State ---
    that._running = false;
    that._frameSkip = param["frameSkip"] || false;
    that._fps = {
        count: 0,
        skipped: 0,  // render skipped
        lastTime: 0
    };
    that._mouse = {
        offset: canvas.getBoundingClientRect(),
        position: { x: 0, y: 0 }
    };

    // --- Animation ---
    that._callback = callback;
    that._tickRef = _tick.bind(that);
    that._clock = new Clock({ "vsync": true });
}

function _tick(counter, // @arg Integer:
               now,     // @arg Number:
               delta) { // @arg Number: delta time.
    var that = this;

    // frame skip
    if (that._frameSkip && delta > 20) { // 16.6666 * 120% = 19.9992
        ++that._fps.skipped;
    } else {
        that._worker.postMessage({
                    mx: that._mouse.position.x,
                    my: that._mouse.position.y
                });
    }
}

function _handleCanvasMouseClickEvent() {
    var that = this;

    if (that._running) {
        that["stop"]();
    } else {
        that["run"]();
    }
    return that;
}

function _handleCanvasMouseMoveEvent(event) {
    var that = this;

    that._mouse.position.x = event.pageX - that._mouse.offset["left"];
    that._mouse.position.y = event.pageY - that._mouse.offset["top"];
}

function WorkerRenderEx_run() {
    this._running = true;

    this._fps.count = 0;
    this._fps.lastTime = Date.now();

    this._clock["on"](this._tickRef);
    this._clock["run"]();

    return this;
}

function WorkerRenderEx_stop() {
    this._running = false;

    this._fps.count = 0;
    this._fps.lastTime = Date.now();

    this._clock["off"](this._tickRef);
    this._clock["stop"]();

    return this;
}

function WorkerRenderEx_render(arrayBuffer) { // @arg ArrayBuffer:
    this._imageData.data.set( new Uint8ClampedArray(arrayBuffer) );
    this._bgimageData.data.set( new Uint8ClampedArray(arrayBuffer) );

    this._ctx.putImageData(this._imageData, this._offsetX, this._offsetY);
    this._bgctx.putImageData(this._bgimageData, this._bgoffsetX, this._bgoffsetY);

    if (++this._fps.count > 60) {
        _calcFPS(this);
    }
    return this;
}

function _calcFPS(that) {
    var now = Date.now();
    var fps = 1000 / ((now - that._fps.lastTime) / that._fps.count);

    if (that._callback) {
        that._callback(fps, that._fps.skipped);
    }
    that._fps.count = 0;
    that._fps.skipped = 0;
    that._fps.lastTime = now;
}

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = WorkerRenderEx;
}
//}@node
if (global["WorkerRenderEx"]) {
    global["WorkerRenderEx_"] = WorkerRenderEx; // already exsists
} else {
    global["WorkerRenderEx"]  = WorkerRenderEx;
}

})((this || 0).self || global);

