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
To size it to 400x400 pixels give these first 2 arguments:

```js
let gl = webgl(400, 400);
```

Most of the time after creation you would place the canvas somewhere in the DOM but in the simplest case append it to the body.
"gluck" can do that with just an additional hint:

```js
let gl = webgl(400, 400, "appendToBody");
```

Onec created the context is ready to create other WeBGL objects. Most essentially: the shader.

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
fragment shader code. If the code won't compile or link `gl.shader()` will throw and print an error to the Javascript console.

The second essential thing WebGL needs is a vertex buffer that feeds your shader with input data. So here we make one with just
three 2D-vertices forming a triangle:

```js
let buffer = gl.buffer([0,0, 1,0, 0,1]);
```

Will give us a "static" buffer filled with 6 floats of 32-bit size. And that's enough to finally draw something.

```js
shader.draw(3, {pos: buffer});
```

This draws a single triangle (3 vertices) with the buffer supplying data for the `pos` attribute.

And here is the result, a colored triangle:

![simple triangle](./doc/triangle.png)

## Reference

### Integration

gluck is imported as an ES6 module which modern browsers support with the `<script>`'s `type="module"` attribute:

```html
<script type="module">
	import webgl from "./gluck/webgl.js";
</script>
```

### WebGL contexts

```js
let gl = webgl( [width, height] [, canvas] [, options...] );
```

Creates a WebGL context from an existing or automatically created canvas.

* `width`, `height` - the initial size of the canvas and viewport in pixels. natively defaults to `300` and `150`
* `canvas` - the underlying canvas to create a context for if not to be created automatically
* `...options` - the rest of the argument list can be an arbitrary number of hints: 
  * a string naming a boolean WebGL context attribute to be enabled. You can look them up
    [here](https://www.khronos.org/registry/webgl/specs/latest/1.0/#WEBGLCONTEXTATTRIBUTES)
  * if you want a context attribute to be disabled instead, prefix it with `"no-"` (e.g.: `"no-alpha"` to disable the alpha
    component of the drawing buffer)
  * for the `"powerPreference"` context attribute you can pass one of the following strings:
    * `"highPerformance"` will set `powerPreference = "high-performance"`
    * `"lowPower"` will set `powerPreference = "low-power"`
  * `"appendToBody"` tells gluck to append the canvas to the body after creation

The context will have enhanced helper methods: `aspect()`, `shader()`, `buffer()`, `indices()`, `texture()`.

```js
let aspect = gl.aspect();
```

Returns the aspect ratio of the canvas. Nothing else than `gl.canvas.clientWidth / gl.canvas.clientHeight`

### Buffers

```js
let buffer = gl.buffer(["index",] [usage,] [type,] [sizeOrData])
```

Creates a vertex or index buffer with a specified usage pattern and optionally the data to initialize the buffer with.

* `"index"` as the first argument will denote this buffer as an index buffer and bind it as an "element array buffer". Otherwise
  it will be a regular vertex buffer and bound as an "array buffer".
* `usage` - might be `"static"`, `"dynamic"` or `"stream"` to describe it's usage hint. Defaults to `"static"` when omitted.
* `type` - data type of the items in the buffer, one of `"float"`, `"byte"`, `"short"`, `"ubyte"`, `"ushort"`
  (for unsigned byte and short integer values). Defaults to `"float"` or `"ushort"` for index buffers. This parameter is only
  used when passing a bare Javascript array as next parameter so that `buffer()` can cast it properly to a `TypedArray`
  like `Float32Array` or `Uint16Array` e.g.)
* `sizeOrData` - either a `number` of bytes to preallocate for this buffer or an `Array` or some `TypedArray` of items to
  initialize the buffer with. When you pass a bare `Array` here, don't forget to also state the desired data type to be cast to
  with the `type` parameter.

```js
let indices = gl.indices([usage,] [type,] [sizeOrData])
```

This is just a short-hand to create an index buffer and is equivalent to

```js
let indices = gl.buffer("index", [usage,] [type,] [sizeOrData])
```

### Shaders

```js
let shader = gl.shader([precision,] vertexSource, fragmentSource);
```

Compile and link a shader program with the given source text strings for a vertex and a fragment shader, respectively.

```js
shader.draw([mode, ] [count, ] [data]);
```

Draws primitives

* `mode` one of `"points"`, `"linestrip"`, `"lineloop"`, `"lines"`, `"trianglestrip"`, `"trianglefan"`, `"triangles"`.
  specify the type of primitive to draw. Defaults to `"triangles"`
* `count` number of vertices or indices to process
* `data` on object specifying which uniforms, index or vertex buffers and textures to use for this draw call. This object can
  be filled arbitrarily with properties like these:
  * `"nameOfUniform"` - set the value of an uniform variable. Might be a scalar number, an `Array` or `TypedArray` of values for
    vector or matrix uniforms or a texture object if you want to set a sampler2D uniform. Consecutive texture units are assigned
    automatically for multiple textures
  * `"nameOfAttribute"` - set the value of an attribute variable. Might be a scalar number, an `Array` or `TypedArray` of values
    in case you want the attribute to be constant for every vertex. Otherwise if you assign a buffer object to the attribute,
    `draw()` will assume tightly packed float values in that buffer with stride and offset of 0.
    If your buffer contains interleaved vertex data you can assign an object with the following structure to specify the
    attribute:
    * `buffer` - a reference to the buffer
    * `type` - the data type of each element in the buffer, one of `"float"`, `"byte"`, `"short"`, `"ubyte"`, `"ushort"`
    * `stride` and `offset` - like in
      [`gl.vertexAttribPointer()`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)
    [Layouts](#layouts) can heavily simplify this structure.

### Layouts

Usually your vertex buffers do not just contain data for one single vertex attribute. Instead you likely have attributes like
position, texture coords, normal vector or vertex color for each vertex. The data is stored interleaved in your buffer.

To simplify the process of vertex specification when calling `shader.draw()` you can use layout objects containing a
specification for each attribute.

If you already have a buffer create a layout like so:

```js
let layout = buffer.layout("float", ["pos", 2], ["col", 3], ["uv", 2]);
```

The layout in this example contains 3 attributes:

* `vec2 pos;`
* `vec3 col;`
* `vec2 uv;`

Now when you call the shader's `draw()` method you can obtain the attribute specification from your layout object:

```js
shader.draw(6, {
	pos: layout.pos,
	col: layout.col,
	uv: layout.uv,
});
```

Even shorter, if you simply want to assign in all attributes of this layout, just pass it in to `draw()` like this:

```js
shader.draw(6, {layout});
```
