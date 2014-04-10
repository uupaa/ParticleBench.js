// @name: ParticleBench.js
// @require: none
// @cutoff: @node

(function(global) {
"use strict";

// --- variable --------------------------------------------
var _inNode = "process" in global;

// --- define ----------------------------------------------
var REQUEST_ANIMATION_FRAME = global["requestAnimationFrame"]    ||
                              global["msRequestAnimationFrame"]  ||
                              global["mozRequestAnimationFrame"] ||
                              global["webkitRequestAnimationFrame"];
// --- interface -------------------------------------------
function ParticleBench(param,      // @arg Object: { count:Integer = 30000, canvas:HTMLCanvasElement }
                       callback) { // @arg Function(= null): callback(fps:Number)
                                   // @help: ParticleBench
    _init(this, param, callback || null);
}

ParticleBench["repository"] = "https://github.com/uupaa/ParticleBench.js";

ParticleBench["prototype"]["run"]  = ParticleBench_run;  // ParticleBench#run():this
ParticleBench["prototype"]["stop"] = ParticleBench_stop; // ParticleBench#stop():this

// --- implement -------------------------------------------
function _init(that, param, callback) {
    var count  = param["count"] || 30000;
    var canvas = param["canvas"];
    var width  = canvas.width;
    var height = canvas.height;

    that._callback  = callback;
    that._particles = new Array(count * 4);
    that._ctx       = canvas.getContext("2d");
    that._pixels    = that._ctx.getImageData(0, 0, width, height); // { data: array }
    that._running   = false;
    that._mouse = {
        offset: canvas.getBoundingClientRect(),
        position: { x: 0, y: 0 }
    };
    canvas.addEventListener("click", _handleCanvasMouseClickEvent.bind(that));
    canvas.addEventListener("mousemove", _handleCanvasMouseMoveEvent.bind(that));

    that._fps = {};
    that._fps.count = 0;
    that._fps.lastTime = 0;

    for (var i = 0, iz = count * 4; i < iz; i += 4) {
        that._particles[i    ] = Math.random() * width;
        that._particles[i + 1] = Math.random() * height;
        that._particles[i + 2] = 0;
        that._particles[i + 3] = 0;
    }
}

function _handleCanvasMouseClickEvent() {
    var that = this;

    if (that._running) {
        that.stop();
    } else {
        that._fps.count = 0;
        that._fps.lastTime = Date.now();
        that.run();
    }
    return that;
}

function _handleCanvasMouseMoveEvent(event) {
    var that = this;

    that._mouse.position.x = event["pageX"] - that._mouse.offset["left"];
    that._mouse.position.y = event["pageY"] - that._mouse.offset["top"];
}

function ParticleBench_run() {
    var that   = this;
    var ctx    = that._ctx;
    var width  = ctx.canvas.width;
    var height = ctx.canvas.height;
    var position = that._mouse.position;

    that._running = true;
    _tick();

    return that;

    function _tick() {
        if (that._running) {
            REQUEST_ANIMATION_FRAME(_tick);
        }

        var particles = that._particles;
        var data = that._pixels["data"];
        var mx = position.x;
        var my = position.y;
        var i = 0, iz = data.length;
        var j, x, y, vx, vy, dx, dy, acc, dd;

        // poormans-effect (alpha effect)
        for (i = 3; i < iz; i += 32) { // 3, 6, 9 ... are alpha values
            data[i     ] >>= 2;
            data[i +  4] >>= 2;
            data[i +  8] >>= 2;
            data[i + 12] >>= 2;
            data[i + 16] >>= 2;
            data[i + 20] >>= 2;
            data[i + 24] >>= 2;
            data[i + 28] >>= 2;
        }
        for (i = 0, iz = particles.length; i < iz; i += 4) {
            x  = particles[i    ];
            y  = particles[i + 1];
            vx = particles[i + 2];
            vy = particles[i + 3];
            dx = mx - (x | 0);
            dy = my - (y | 0);
//            dx = 0 - (x | 0);
//            dy = 0 - (y | 0);
            dd = dx * dx + dy * dy;
            if (!dd) { // [avoid] division by zero
                dd = 1;
            }
            acc = 50 / dd;
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
            j = ((x | 0) + (y | 0) * width) * 4;
            data[j    ] = 230;
            data[j + 2] = 230;
            data[j + 3] = 200; // 200 is vaguely
        }
        ctx.putImageData(that._pixels, 0, 0);

        if (++that._fps.count > 60) {
            _calcFPS(that);
        }
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
}

function ParticleBench_stop() {
    this._running = false;
    this._fps.count = 0;
    this._fps.lastTime = Date.now();
    return this;
}

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = ParticleBench;
}
//}@node
if (global["ParticleBench"]) {
    global["ParticleBench_"] = ParticleBench; // already exsists
} else {
    global["ParticleBench"]  = ParticleBench;
}

})((this || 0).self || global);

