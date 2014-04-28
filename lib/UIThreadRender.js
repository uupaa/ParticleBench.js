// @name: UIThreadRender.js
// @require: Clock.js
// @cutoff: @node

(function(global) {
"use strict";

// --- variable --------------------------------------------
var Clock = global["Clock"] || require("uupaa.clock.js");

var _inNode = "process" in global;

// --- define ----------------------------------------------
// --- interface -------------------------------------------
function UIThreadRender(param,      // @arg Object: { count, canvas, frameSkip }
                                    //   param.count - Integer(= 1000):
                                    //   param.canvas - HTMLCanvasElement:
                                    //   param.frameSkip - Boolean(= false):
                        callback) { // @arg Function(= null): callback(fps:Number)
                                    // @help: UIThreadRender
    _init(this, param, callback || null);
}

UIThreadRender["repository"] = "https://github.com/uupaa/ParticleBench.js";

// --- public method ---
UIThreadRender["prototype"]["run"]    = ParticleBench_run;    // UIThreadRender#run():this
UIThreadRender["prototype"]["stop"]   = ParticleBench_stop;   // UIThreadRender#stop():this
// --- private method ---
UIThreadRender["prototype"]["update"] = ParticleBench_update; // UIThreadRender#update(particles, imageData, width, height, mx, my):this
UIThreadRender["prototype"]["render"] = ParticleBench_render; // UIThreadRender#render():this

// --- implement -------------------------------------------
function _init(that, param, callback) {
    var count  = param["count"] || 1000;
    var canvas = param["canvas"];
    var width  = canvas.width;
    var height = canvas.height;

    // --- Canvas ---
    that._ctx = canvas.getContext("2d");
    that._imageData = that._ctx.createImageData(width, height);
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
    that._callback  = callback;
    that._tickRef = _tick.bind(that);
    that._clock = new Clock({ "vsync": true });

    // --- Particle ---
    that._particles = new Float32Array(count * 4); // [ <x, y, vx, vy>, ... ]

    for (var i = 0, iz = count * 4; i < iz; i += 4) {
        that._particles[i    ] = Math.random() * width;   // x
        that._particles[i + 1] = Math.random() * height;  // y
        that._particles[i + 2] = 0;                       // vx
        that._particles[i + 3] = 0;                       // vy
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

function ParticleBench_run() {
    this._running = true;

    this._fps.count = 0;
    this._fps.lastTime = Date.now();

    this._clock["on"](this._tickRef);
    this._clock["run"]();

    return this;
}

function ParticleBench_stop() {
    this._running = false;

    this._fps.count = 0;
    this._fps.lastTime = Date.now();

    this._clock["off"](this._tickRef);
    this._clock["stop"]();

    return this;
}

function ParticleBench_render() {
//  this._imageData.data.set( new Uint8ClampedArray(arrayBuffer) );

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
        that._callback(fps, that._fps.skipped);
    }
    that._fps.count = 0;
    that._fps.skipped = 0;
    that._fps.lastTime = now;
}

function _tick(counter, // @arg Integer:
               now,     // @arg Number:
               delta) { // @arg Number: delta time.
    var that = this;

    // frame skip
    if (that._frameSkip && delta > 20) { // 16.6666 * 120% = 19.9992
        ++that._fps.skipped;
    } else {
        that["update"](that._particles,
                       that._imageData["data"],
                       that._imageData["width"],
                       that._imageData["height"],
                       that._mouse.position.x,
                       that._mouse.position.y);
        that["render"]();
    }
}

function ParticleBench_update(particles, imageData, width, height, mx, my) {
    // poormans-effect (alpha effect)
    for (var i = 3, iz = imageData.length; i < iz; i += 32) { // 3, 6, 9 ... are alpha values
        imageData[i     ] >>= 2;
        imageData[i +  4] >>= 2;
        imageData[i +  8] >>= 2;
        imageData[i + 12] >>= 2;
        imageData[i + 16] >>= 2;
        imageData[i + 20] >>= 2;
        imageData[i + 24] >>= 2;
        imageData[i + 28] >>= 2;
    }
    for (i = 0, iz = particles.length; i < iz; i += 4) {
        var x  = particles[i    ];
        var y  = particles[i + 1];
        var vx = particles[i + 2];
        var vy = particles[i + 3];
        var dx = mx - (x | 0);
        var dy = my - (y | 0);
        var dd = dx * dx + dy * dy;

        if (!dd) { // [avoid] division by zero
            dd = 1;
        }
        var acc = 50 / dd;

        vx += acc * dx;
        vy += acc * dy;
        x  += vx;
        y  += vy;
        x = x > width  ? 0 : x < 0 ? width  - 1 : x;
        y = y > height ? 0 : y < 0 ? height - 1 : y;

        particles[i    ] = x;
        particles[i + 1] = y;
        particles[i + 2] = vx * 0.96;
        particles[i + 3] = vy * 0.96;

        // put purple dots
        var j = ((x | 0) + (y | 0) * width) * 4;

        imageData[j    ] = 230; // r (0 - 255)
      //imageData[j + 1] = 230; // g (0 - 255)
        imageData[j + 2] = 230; // b (0 - 255)
        imageData[j + 3] = 200; // a (0 - 255) 200 is vaguely
    }
}

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = UIThreadRender;
}
//}@node
if (global["UIThreadRender"]) {
    global["ParticleBench_"] = UIThreadRender; // already exsists
} else {
    global["UIThreadRender"]  = UIThreadRender;
}

})((this || 0).self || global);

