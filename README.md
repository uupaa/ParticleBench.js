=========
ParticleBench.js
=========

Particle benchmake.

# Document

- https://github.com/uupaa/ParticleBench.js/wiki/ParticleBench
- https://github.com/uupaa/WebModule ([Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html))
- https://github.com/uupaa/Help.js ([Slide](http://uupaa.github.io/Slide/slide/Help.js/index.html))

# How to use

```js
<script src="lib/ParticleBench.js">
<script>
  var viewNode = document.querySelector("#view");
  var fpsNode  = document.querySelector("#fps");
  var param = { count: 30000, canvas: viewNode };

  var bench = new ParticleBench(param, function(fps) {
                    fpsNode.textContent = fps.toFixed(2);
                  }).run();
</script>
```


# for Developers

1. Install development dependency tools

    ```sh
    $ brew install closure-compiler
    $ brew install node
    $ npm install -g plato
    ```

2. Clone Repository and Install

    ```sh
    $ git clone git@github.com:uupaa/ParticleBench.js.git
    $ cd ParticleBench.js
    $ npm install
    ```

3. Build and Minify

    `$ npm run build`

4. Test

    `$ npm run test`

5. Lint

    `$ npm run lint`

