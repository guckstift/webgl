# gluck

This library simplifies WebGL (1.0) programming as much as possible and adds some object oriented convenience to it. While gluck
deals just with native WebGL objects it also augments them with some helper methods.

## Getting started

gluck is imported as an ES6 module which modern browsers support with the `<script>`'s `type="module"` attribute:

```html
<script type="module">
	import webgl from "./gluck/webgl.js";
</script>
```

To create a fresh WebGL context call:

```js
let gl = webgl();
```

An underlying canvas is created automatically. Its width and height falls back to the browsers defaults of 300 and 150 pixels.
To size it to 800x600 pixels give these first 2 arguments:

```js
let gl = webgl(800, 600);
```

Most of the time after creation you would place the canvas somewhere in the DOM but in the simplest case append it to the body.
Just tell gluck to do that with an additional hint:

```js
let gl = webgl(800, 600, "appendToBody");
```

And now we can work with the context. But in WebGL nothing can be drawn without its most essential object: the shader.

```js
let shader = gl.shader("mediump", `
	attribute vec2 pos;
	varying vec2 vpos;
	
	void main()
	{
		gl_Position = vec4(pos, 0, 1);
		vpos = pos;
	}
`,`
	varying vec2 vpos;
	
	void main()
	{
		gl_FragColor = vec4(vpos, 0, 1);
	}
`);
```

The first argument the `gl.shader()` is an optional specifier for the float precision to use. Then follows the vertex and the
fragment shader source codes. If the code is erroneous `gl.shader()` will throw and print the compile or link error to the
Javascript console.

The second essential thing WebGL needs is a vertex buffer that feeds your shader with input data. So here we make one with just
three 2D-vertices forming a triangle:

```js
let buffer = gl.buffer([0,0, 1,0, 0,1]);
```

This creates a "static" buffer holding six 32-bit floating point numbers in it. And that's enough to finally draw
something.

```js
shader.draw(3, {pos: buffer});
```

You tell the shader to draw something with 3 vertices and the `pos` attribute fed with the values in our buffer. By default
this methods assumes to draw a list of triangles.

And ready it is our colored triangle:

![simple triangle](./doc/triangle.png)
