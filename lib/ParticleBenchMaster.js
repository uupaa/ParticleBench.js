// @name: ParticleBenchMaster.js
// @require: Clock.js
// @cutoff: @node

(function(global) {
"use strict";

// --- variable --------------------------------------------
var Clock = global["Clock"] || require("uupaa.clock.js");

var _inNode = "process" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function ParticleBenchMaster(param,      // @arg Object: { count:Integer = 1000, canvas:HTMLCanvasElement, src: URLString }
                             callback) { // @arg Function(= null): callback(fps:Number)
                                         // @help: ParticleBenchMaster
    _init(this, param, callback || null);
}

ParticleBenchMaster["repository"] = "https://github.com/uupaa/ParticleBenchMaster.js";

// --- public method ---
ParticleBenchMaster["prototype"]["run"]    = ParticleBenchMaster_run;    // ParticleBenchMaster#run():this
ParticleBenchMaster["prototype"]["stop"]   = ParticleBenchMaster_stop;   // ParticleBenchMaster#stop():this
// --- private method ---
//ParticleBenchMaster["prototype"]["update"] = ParticleBenchMaster_update; // ParticleBench#update(particles, imageData, width, height, mx, my):this
ParticleBenchMaster["prototype"]["render"] = ParticleBenchMaster_render; // ParticleBenchMaster#render(particles:ArrayBuffer):this

// --- implement -------------------------------------------
function _init(that, param, callback) {
    var count  = param["count"] || 1000;
    var canvas = param["canvas"];
    var width  = canvas.width;
    var height = canvas.height;

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
    that._imageData = that._ctx.createImageData(width, height);
    canvas.addEventListener("click", _handleCanvasMouseClickEvent.bind(that));
    canvas.addEventListener("mousemove", _handleCanvasMouseMoveEvent.bind(that));

    // --- State ---
    that._running = false;
    that._fps = {
        count: 0,
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

function _tick() {
    var that = this;

    that._worker.postMessage({
                mx: that._mouse.position.x,
                my: that._mouse.position.y
            });
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

function ParticleBenchMaster_run() {
    this._running = true;

    this._fps.count = 0;
    this._fps.lastTime = Date.now();

    this._clock["on"](this._tickRef);
    this._clock["run"]();

    return this;
}

function ParticleBenchMaster_stop() {
    this._running = false;

    this._fps.count = 0;
    this._fps.lastTime = Date.now();

    this._clock["stop"]();
    this._clock["off"](this._tickRef);

    return this;
}

function ParticleBenchMaster_render(arrayBuffer) { // @arg ArrayBuffer:
    this._imageData.data.set( new Uint8ClampedArray(arrayBuffer) );

    this._ctx.putImageData(this._imageData, 0, 0);
    if (++this._fps.count > 60) {
        _calcFPS(this);
    }
    return this;
}

function _calcFPS(that) {
    var now = Date.now();
    var fps = 1000 / ((now - that._fps.lastTime) / that._fps.count);

    if (that._callback) {
        that._callback(fps);
    }
    that._fps.count = 0;
    that._fps.lastTime = now;
}

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = ParticleBenchMaster;
}
//}@node
if (global["ParticleBenchMaster"]) {
    global["ParticleBenchMaster_"] = ParticleBenchMaster; // already exsists
} else {
    global["ParticleBenchMaster"]  = ParticleBenchMaster;
}

})((this || 0).self || global);

