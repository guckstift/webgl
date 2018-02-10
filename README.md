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
