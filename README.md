# webgl

This library simplifies WebGL programming and adds object oriented convenience to WebGL

## Getting Started

Get a WebGL context that has a viewport size of 400x400 and is instantly appended to the body element with

```js
var gl = webgl(400, 400, "appendToBody");
```

Then create a buffer of three 2D-vertices by simply calling

```js
var buffer = gl.buffer([0,0, 1,0, 0,1]);
```

Next and most important: the shader sources. You can put them into script elements with a type-attribute of "text/plain" for example.

```html
<script id="vert-shader" type="text/plain">
  attribute vec2 aPos;
  varying vec2 vPos;

  void main()
  {
    vPos = aPos;
    gl_Position = vec4(aPos, 0, 1);
  }
</script>
<script id="frag-shader" type="text/plain">
  varying highp vec2 vPos;

  void main()
  {
    gl_FragColor = vec4(vPos, 0, 1);
  }
</script>
```

And then you can create the shader from this source code.

```js
var shader = gl.shader("#vert-shader", "#frag-shader");
```

Draw something by calling the shader's draw method.

```js
shader.draw({ aPos: buffer });
```

And here we go.

![simple triangle](/simple.png)

## Reference

### Integration

Just download [webgl.js](https://raw.githubusercontent.com/guckstift/webgl/master/webgl.js) and include it in your document's `<head>` with

```html
<script src="webgl.js"></script>
```

### WebGL contexts

Create a canvas with an associated WebGL context with `webgl()`

Syntax:

```js
var gl = webgl([width, height], option...);
var gl = webgl(width, height, option...);
var gl = webgl(option...);
```

* `width`, `height` - the initial size of the canvas and viewport in pixels. defaults to `800` and `600`
* `option` - pass an arbitrary number of option arguments to `webgl()`. An option can be
  * a `function` that is set up as the new render function
  * a `string` denoting an option to be enabled or disabled. Just pass the name of any of the boolean WebGL context attributes you can look up [here](https://www.khronos.org/registry/webgl/specs/latest/1.0/#WEBGLCONTEXTATTRIBUTES) with their default values. For example pass `"preserveDrawingBuffer"` to turn of automatic drawing buffer clearing. Prepend the particular option with `no-` to disable it, for example `"no-antialias"` will turn of anti-aliasing.
  
    Additional options are:
    * `appendToBody` - initially append the canvas to the document's body

### Buffers

Create a WebGL buffer with `gl.buffer()`

Syntax:

```js
var buffer = gl.buffer(option...);
```

* `option` - pass an arbitrary number of option arguments to `gl.buffer()`. An option can be
  * the `count` to resize the buffer to `count` elements, defaults to `0`
  * `"index"` to define this buffer to hold indices instead of direct vertex data
  * one of `"static"`, `"dynamic"` or `"stream"` to denote the usage hint of this buffer, defaults to `static`
  * one of `"byte"`, `"ubyte"`, `"short"`, `"ushort"` or `"float"` to define the data type of each element in the buffer.
    the type defaults to `"float"` for vertex data buffers and to `"ushort"` for index buffers.
  * an `array` of values to fill the buffer with. This array also implies the buffer's length that doesn't have to be set explicitly

### Shaders

Create a WebGL shader program with `gl.shader()` or `gl.shaderFromUrl()`.

Syntax:

```js
var shader = gl.shader(vert, frag);
```

`vert` and `frag` can be DOM elements (typically `<script>` tags) that contain the source code of the vertex or fragment shader, respectively, they can be selector-strings to match such an element or they can be the source code directly passed as `string`s

Shaders can also be loaded asynchronously from URLs with `gl.shaderFromUrl()`.

Syntax:

```js
var shader = gl.shaderFromUrl(vertUrls, fragUrls);
```

`vertUrls` and `fragUrls` can be single strings or arrays of strings defining the urls to load shader source code from through an XHR request. Though the shader won't draw anything until the source files have been loaded and compiled, it will be returned instantly and won't complain when you call its `draw()`-method.

### Textures

Textures can be created with `gl.texture()` or `gl.textureFromUrl()`.

Syntax:

```js
var texture = gl.texture(image[, filter]);
```

Creates a texture from an `HTMLImageElement`. `filter` can be `"nearest"` or `"linear"` to define the min- and mag-filtering of the texture. `filter` defaults to `"nearest"`.

You can also create an empty or filled from an array texture with this syntax:

```js
var texture = gl.texture(width, height [, pixels] [, filter]]);
```

where `pixels` is an array that is used to fill the texture with color data.

## Example

```html
<!DOCTYPE html>
<html>
	<head>
		<title>webgl</title>
		<script src="webgl.js"></script>
	</head>
	<body>
		<script id="vert-shader" type="text/plain">
		
			attribute vec2 aPos;
			varying vec2 vPos;

			void main()
			{
				vPos = aPos;
				gl_Position = vec4(aPos * 2.0 - vec2(1), 0.0, 1.0);
			}
			
		</script>
		<script id="frag-shader" type="text/plain">
		
			uniform sampler2D uTex;
			varying highp vec2 vPos;

			void main()
			{
				gl_FragColor = texture2D(uTex, vec2(vPos.x, 1.0 - vPos.y));
			}
		
		</script>
		<script id="frag-shader2" type="text/plain">
		
			varying highp vec2 vPos;

			void main()
			{
				gl_FragColor = vec4(vPos, 0, 1);
			}
		
		</script>
		<script>
		
			var gl = webgl(400, 400, render, "appendToBody", "no-antialias", "no-alpha");
			var buffer = gl.buffer([0,0, 1,0, 0,1, 1,1]);
			var indices = gl.buffer("index", [0,1,2, 1,2,3]);
			var shader1 = gl.shader("#vert-shader", "#frag-shader");
			var shader2 = gl.shader("#vert-shader", "#frag-shader2");
			var texture = gl.textureFromUrl("tree.png");
			
			function render()
			{
				shader2.draw({indices: indices, aPos: buffer});
				shader1.draw({indices: indices, aPos: buffer, uTex: texture});
			}
			
		</script>
	</body>
</html>
```
