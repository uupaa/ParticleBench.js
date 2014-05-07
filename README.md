=========
ParticleBench.js
=========

![](https://travis-ci.org/uupaa/ParticleBench.js.png)

Particle benchmake.

# Document

- [ParticleBench.js wiki](https://github.com/uupaa/ParticleBench.js/wiki/ParticleBench)
- [Development](https://github.com/uupaa/WebModule/wiki/Development)
- [WebModule](https://github.com/uupaa/WebModule) ([Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html))


# How to use

```js
<script src="lib/UIThreadRender.js">
<script>
  var viewNode = document.querySelector("#view");
  var fpsNode  = document.querySelector("#fps");
  var param = { count: 30000, canvas: viewNode };

  var bench = new UIThreadRender(param, function(fps, skipped) {
                    fpsNode.textContent = fps.toFixed(2) + "(frameSkipped: " + skipped + ")";
                  }).run();
</script>
```
