=========
ParticleBench.js
=========

![](https://travis-ci.org/uupaa/ParticleBench.js.png)

Particle benchmake.

# Document

- [WebModule](https://github.com/uupaa/WebModule) ([Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html))
- [Development](https://github.com/uupaa/WebModule/wiki/Development)
- [ParticleBench.js wiki](https://github.com/uupaa/ParticleBench.js/wiki/ParticleBench)


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
