// @name: Worker.js
// @require: none
// @cutoff:

(function(global) {
"use strict";

// --- variable --------------------------------------------
var _width  = 0;
var _height = 0;
var _particles = null; // Float32Array
var _imageData = null; // Uint8ClampedArray

// --- define ----------------------------------------------
// --- interface -------------------------------------------
// --- implement -------------------------------------------
self.onmessage = function(event) {
    if (event.data.init) { // event.data = { init: true, width: Integer, height: Integer, count: Integer }
        _width  = event.data.width;
        _height = event.data.height;
        _imageData = new Uint8ClampedArray(_width * _height * 4);
        _particles = new Float32Array(event.data.count * 4); // [ <x, y, vx, vy>, ... ]

        for (var i = 0, iz = event.data.count * 4; i < iz; i += 4) {
            _particles[i    ] = Math.random() * _width;   // x
            _particles[i + 1] = Math.random() * _height;  // y
            _particles[i + 2] = 0;                        // vx
            _particles[i + 3] = 0;                        // vy
        }
    } else { // event.data = { mx, my }
        // --- tick ---
        _update(_particles,
                _imageData,
                _width,
                _height,
                event.data.mx || 0,
                event.data.my || 0);

        var clonedImageData = new Uint8ClampedArray(_imageData.byteLength);

        clonedImageData.set( _imageData.subarray(0) ); // clone

        self.postMessage(clonedImageData.buffer, [clonedImageData.buffer]);
    }
}

function _update(particles, imageData, width, height, mx, my) {
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

      //imageData[j    ] = 230; // r (0 - 255)
        imageData[j + 1] = 200; // g (0 - 255)
        imageData[j + 2] = 200; // b (0 - 255)
        imageData[j + 3] = 200; // a (0 - 255) 200 is vaguely
    }
}

// --- export ----------------------------------------------

})((this || 0).self || global);

