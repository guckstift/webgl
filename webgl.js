var webgl = (function() {

	function webgl(w, h)
	{
		var width = w;
		var height = h;
		
		if(Array.isArray(width)) {
			height = width[1];
			width = width[0];
		}
		
		var setSize = typeof width === "number" && typeof height === "number"
		var argc = arguments.length;
		var toBody = false;
		var renderFunc = undefined;
		
		var options = {
			alpha: true,
			depth: true,
			stencil: false,
			antialias: true,
			premultipliedAlpha: true,
			preserveDrawingBuffer: false,
			failIfMajorPerformanceCaveat: false,
		}
		
		for(var i=0; i<argc; i++) {
			var arg = arguments[i];
			
			if(typeof arg === "string") {
				var negate = arg.substr(0, 3) === "no-";
				
				if(negate) {
					arg = arg.substr(3);
				}
				
				if(options.hasOwnProperty(arg)) {
					options[arg] = !negate;
				}
				else if(arg === "appendToBody") {
					toBody = true;
				}
			}
			else if(typeof arg === "function") {
				renderFunc = arg;
			}
		}
		
		var gl = document.createElement("canvas").getContext("webgl", options);
		
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		gl.renderFunc = undefined;
		gl.frameLoopStarted = false;
		
		gl.resize = resize;
		gl.appendTo = appendTo;
		gl.appendToBody = appendToBody;
		gl.setRenderFunc = setRenderFunc;
		gl.buffer = buffer;
		gl.shader = shader;
		gl.shaderFromUrl = shaderFromUrl;
		gl.texture = texture;
		gl.textureFromUrl = textureFromUrl;
		
		if(setSize) {
			gl.resize(width, height);
		}
		else {
			gl.resize(800, 600);
		}
		
		if(toBody) {
			gl.appendToBody();
		}
		
		if(renderFunc) {
			gl.setRenderFunc(renderFunc);
		}
		
		return gl;
	}
	
	function resize(width, height)
	{
		if(Array.isArray(width)) {
			height = width[1];
			width = width[0];
		}
		
		this.canvas.width = width;
		this.canvas.height = height;
		this.size = [width, height];
		this.viewport(0, 0, width, height);
	
		return this;
	}
	
	function appendTo(elm)
	{
		if(typeof elm === "string") {
			elm = document.querySelector(elm);
		}
		
		elm.append(this.canvas);
	
		return this;
	}
	
	function appendToBody()
	{
		this.appendTo(document.body);
	
		return this;
	}
	
	function setRenderFunc(func)
	{
		var self = this;
		
		this.renderFunc = func;
		
		if(this.frameLoopStarted === false) {
			this.frameLoopStarted = true;
			requestAnimationFrame(frame);
		}
		
		function frame()
		{
			if(self.renderFunc) {
				self.renderFunc();
			}
			
			requestAnimationFrame(frame);
		}
	}
	
	function buffer()
	{
		var buffer = this.createBuffer();
		var argc = arguments.length;
		var index = false;
		var len = 0;
		var data = [];
		
		var usages = {
			"static":  this.STATIC_DRAW,
			"dynamic": this.DYNAMIC_DRAW,
			"stream":  this.STREAM_DRAW,
		};
		
		var types = {
			"byte":   { arrayType: Int8Array,    glType: this.BYTE },
			"short":  { arrayType: Int16Array,   glType: this.SHORT },
			"ubyte":  { arrayType: Uint8Array,   glType: this.UNSIGNED_BYTE },
			"ushort": { arrayType: Uint16Array,  glType: this.UNSIGNED_SHORT },
			"float":  { arrayType: Float32Array, glType: this.FLOAT },
		};
		
		for(var i=0; i<argc; i++) {
			var arg = arguments[i];
			
			if(typeof arg === "string") {
				if(usages.hasOwnProperty(arg)) {
					buffer.usage = arg;
				}
				else if(types.hasOwnProperty(arg)) {
					buffer.type = arg;
				}
				else if(arg === "index") {
					buffer.index = true;
				}
			}
			else if(typeof arg === "number") {
				len = arg;
			}
			else if(Array.isArray(arg)) {
				len = arg.length;
				data = arg;
			}
		}
		
		buffer.usage = buffer.usage || "static";
		buffer.index = buffer.index || false;
		buffer.type = buffer.type || (buffer.index ? "ushort" : "float");
		
		buffer.arrayType = types[buffer.type].arrayType;
		buffer.glType = types[buffer.type].glType;
		buffer.glUsage = usages[buffer.usage];
		buffer.target = buffer.index ? this.ELEMENT_ARRAY_BUFFER : this.ARRAY_BUFFER;

		buffer.gl = this;

		buffer.resize = bufferResize;
		buffer.set = bufferSet;
		buffer.update = bufferUpdate;
		
		buffer.resize(len);
		buffer.set(0, data);
		
		return buffer;
	}
	
	function bufferResize(len)
	{
		var gl = this.gl;
		var data = new this.arrayType(len);
		
		if(this.data) {
			data.set(this.data.subarray(0, Math.min(this.len, len)));
		}
		
		this.data = data;
		this.len = len;
		
		gl.bindBuffer(this.target, this);
		gl.bufferData(this.target, this.data, this.glUsage);
		
		this.invalidRange = [this.len, 0];
		
		return this;
	}
	
	function bufferSet(offset, data)
	{
		data = Array.isArray(data) ? data : [data];
		
		this.data.set(data, offset);
		
		this.invalidRange = [
			Math.min(this.invalidRange[0], offset),
			Math.max(this.invalidRange[1], offset + data.length),
		];
		
		return this;
	}
	
	function bufferUpdate()
	{
		var gl = this.gl;
		
		if(this.invalidRange[0] < this.invalidRange[1]) {
			gl.bindBuffer(this.target, this);
		
			gl.bufferSubData(
				this.target, this.invalidRange[0] * this.arrayType.BYTES_PER_ELEMENT,
				this.data.subarray(this.invalidRange[0], this.invalidRange[1])
			);
		
			this.invalidRange = [this.len, 0];
		}
		
		return this;
	}
	
	function createShader(gl)
	{
		var prog = gl.createProgram();
		
		prog.vertShader = gl.createShader(gl.VERTEX_SHADER);
		prog.fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		
		prog.gl = gl;
		prog.ready = false;
		
		prog.draw = shaderDraw;
		
		return prog;
	}
	
	function shader(vert, frag)
	{
		var prog = createShader(this);
		var vertElm = typeof vert === "string" ? document.querySelector(vert) : vert;
		var fragElm = typeof frag === "string" ? document.querySelector(frag) : frag;
		
		vert = vertElm instanceof Node ? vertElm.textContent : vert;
		frag = fragElm instanceof Node ? fragElm.textContent : frag;
		
		compileShader(prog, vert, frag);
		
		return prog;
	}
	
	function shaderFromUrl(vertUrls, fragUrls)
	{
		var prog = createShader(this);
		
		vertUrls = Array.isArray(vertUrls) ? vertUrls : [vertUrls];
		fragUrls = Array.isArray(fragUrls) ? fragUrls : [fragUrls];
	
		var vertUrlsToLoad = vertUrls.length;
		var fragUrlsToLoad = fragUrls.length;
		var vertSrcs = {};
		var fragSrcs = {};
		var vertSrc = null;
		var fragSrc = null;
	
		for(var i=0; i<vertUrls.length; i++) {
			loadText(vertUrls[i], vertSrcLoad.bind(this, vertUrls[i]));
		}
	
		for(var i=0; i<fragUrls.length; i++) {
			loadText(fragUrls[i], fragSrcLoad.bind(this, fragUrls[i]));
		}
		
		return prog;
	
		function vertSrcLoad(url, src)
		{
			vertSrcs[url] = src;
			vertUrlsToLoad --;
	
			if(vertUrlsToLoad === 0) {
				vertSrc = combineTextFromUrls(vertUrls, vertSrcs);
				
				if(vertSrc !== null && fragSrc !== null) {
					compileShader(prog, vertSrc, fragSrc);
				}
			}
		}
	
		function fragSrcLoad(url, src)
		{
			fragSrcs[url] = src;
			fragUrlsToLoad --;
	
			if(fragUrlsToLoad === 0) {
				fragSrc = combineTextFromUrls(fragUrls, fragSrcs);
				
				if(vertSrc !== null && fragSrc !== null) {
					compileShader(prog, vertSrc, fragSrc);
				}
			}
		}

		function combineTextFromUrls(urls, srcMap)
		{
			var res = "";
	
			for(var i=0; i<urls.length; i++) {
				var url = urls[i];
				var text = srcMap[url];
				res += text;
			}
	
			return res;
		}
	
		function loadText(url, callback)
		{
			var xhr = new XMLHttpRequest();
		
			xhr.open("GET", url);
			xhr.addEventListener("load", xhrLoad);
			xhr.send();
		
			function xhrLoad()
			{
				if(xhr.status === 200) {
					callback(xhr.responseText);
				}
			}
		}
	}
	
	function compileShader(prog, vertSrc, fragSrc)
	{
		var gl = prog.gl;
		
		gl.shaderSource(prog.vertShader, vertSrc);
		gl.shaderSource(prog.fragShader, fragSrc);
	
		gl.compileShader(prog.vertShader);
		gl.compileShader(prog.fragShader);

		if(!gl.getShaderParameter(prog.vertShader, gl.COMPILE_STATUS)) {
			throw(
				"Error: Vertex shader compilation failed: " +
				gl.getShaderInfoLog(prog.vertShader)
			);
		}

		if(!gl.getShaderParameter(prog.fragShader, gl.COMPILE_STATUS)) {
			throw(
				"Error: Fragment shader compilation failed: " +
				gl.getShaderInfoLog(prog.fragShader)
			);
		}
	
		gl.attachShader(prog, prog.vertShader);
		gl.attachShader(prog, prog.fragShader);
		gl.linkProgram(prog);
	
		if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			throw(
				"Error: Shader program linking failed: " +
				gl.getProgramInfoLog(prog)
			);
		}
	
		prog.attributes = {};
		prog.uniforms = {};
	
		gl.useProgram(prog);
	
		var numAttributes = gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES);

		for(var i=0; i<numAttributes; i++) {
			var info = gl.getActiveAttrib(prog, i);

			prog.attributes[info.name] = {
				location: gl.getAttribLocation(prog, info.name),
				type: info.type,
			};
		}
	
		var numUniforms = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);

		for(var i=0; i<numUniforms; i++) {
			var info = gl.getActiveUniform(prog, i);
		
			prog.uniforms[info.name] = {
				location: gl.getUniformLocation(prog, info.name),
				type: info.type,
				size: info.size,
			};
		}
		
		prog.ready = true;
	}
	
	function shaderDraw(input)
	{
		if(this.ready === false) {
			return this;
		}
		
		var gl = this.gl;
		var keys = Object.getOwnPropertyNames(input);
		var indices = null;
		var mode = gl.TRIANGLES;
		var excount = 0;
		var count = 0xffFFffFF;
		var texUnitCounter = 0;
		
		gl.useProgram(this);
		
		for(var i=0; i<keys.length; i++) {
			var key = keys[i];
			
			if(key === "indices") {
				indices = input[key];
				indices.update();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
			}
			else if(key === "mode") {
				mode = (
					input[key] == "points"        ? gl.POINTS :
					input[key] == "linestrip"     ? gl.LINE_STRIP :
					input[key] == "lineloop"      ? gl.LINE_LOOP :
					input[key] == "lines"         ? gl.LINES :
					input[key] == "trianglestrip" ? gl.TRIANGLE_STRIP :
					input[key] == "trianglefan"   ? gl.TRIANGLE_FAN :
					input[key] == "triangles"     ? gl.TRIANGLES :
					mode
				);
			}
			else if(key === "count") {
				excount = excount || input[key];
			}
			else if(this.attributes.hasOwnProperty(key)) {
				var attrib = this.attributes[key];
				var config = input[key];
				var buffer = config.buffer || config;
				var stride = config.stride || 0;
				var offset = config.offset || 0;
		
				if(attrib === undefined) {
					continue;
				}
				
				var type = attrib.type;
				var location = attrib.location;
				
				var components = (
					type === gl.FLOAT ? 1 :
					type === gl.FLOAT_VEC2 ? 2 :
					type === gl.FLOAT_VEC3 ? 3 :
					type === gl.FLOAT_VEC4 ? 4 :
					0
				);
				
				if(components === 0) {
					throw "Error: Attribute type not supported.";
				}
				
				count = Math.min(
					count,
					Math.floor(buffer.len / (stride / 4 || components) - offset / 4)
				);
				
				buffer.update();
				gl.bindBuffer(buffer.target, buffer);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(location, components, buffer.glType, false, stride, offset);
			}
			else if(this.uniforms.hasOwnProperty(key)) {
				var uniform = this.uniforms[key];
				var data = input[key];
		
				if(uniform === undefined) {
					continue;
				}
				
				var type = uniform.type;
				var location = uniform.location;
				
				if(type === gl.SAMPLER_2D) {
					if(data.ready === false) {
						return this;
					}
					
					gl.activeTexture(gl.TEXTURE0 + texUnitCounter);
					gl.bindTexture(gl.TEXTURE_2D, data);
					gl.uniform1i(location, texUnitCounter);
					texUnitCounter ++;
				}
				else {
					var func = (
						type === gl.FLOAT ? gl.uniform1fv :
						type === gl.FLOAT_VEC2 ? gl.uniform2fv :
						type === gl.FLOAT_VEC3 ? gl.uniform3fv :
						type === gl.FLOAT_VEC4 ? gl.uniform4fv :
						type === gl.INT || gl.BOOL ? gl.uniform1iv :
						type === gl.INT_VEC2 || gl.BOOL_VEC2 ? gl.uniform2iv :
						type === gl.INT_VEC3 || gl.BOOL_VEC3 ? gl.uniform3iv :
						type === gl.INT_VEC4 || gl.BOOL_VEC4 ? gl.uniform4iv :
						type === gl.FLOAT_MAT2 ? gl.uniformMatrix2fv :
						type === gl.FLOAT_MAT3 ? gl.uniformMatrix3fv :
						type === gl.FLOAT_MAT4 ? gl.uniformMatrix4fv :
						null
					);
		
					if(func === null) {
						throw "Error: Uniform type not supported.";
					}
		
					if(
						type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT4
					) {
						func.call(gl, location, false, value);
					}
					else {
						func.call(gl, location, value);
					}
				}
			}
		}
		
		if(indices === null) {
			gl.drawArrays(mode, 0, excount || count);
		}
		else {
			gl.drawElements(mode, excount || indices.len, indices.glType, 0);
		}
		
		return this;
	}
	
	function texture(width, height, pixels, filter)
	{
		var tex = this.createTexture();
		
		this.bindTexture(this.TEXTURE_2D, tex);
		
		if(width instanceof HTMLImageElement) {
			var img = width;
			
			width = img.width;
			height = img.height;
			filter = height || "nearest";
			filter = filter === "nearest" ? this.NEAREST : filter === "linear" ? this.LINEAR : 0;
			
			this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, filter);
			this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, filter);
			this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, img);
		}
		else {
			if(typeof pixels === "string") {
				filter = pixels;
				pixels = null;
			}
			
			pixels = pixels || null;
			filter = filter || "nearest";
			filter = filter === "nearest" ? this.NEAREST : filter === "linear" ? this.LINEAR : 0;
			
			this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, filter);
			this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, filter);
			
			this.texImage2D(
				this.TEXTURE_2D, 0, this.RGBA, width, height, 0, this.RGBA, this.UNSIGNED_BYTE,
				new Uint8Array(pixels)
			);
		}
		
		tex.width = width;
		tex.height = height;
		tex.ready = true;
		
		return tex;
	}
	
	function textureFromUrl(url, filter)
	{
		filter = filter || "nearest";
		filter = filter === "nearest" ? this.NEAREST : filter === "linear" ? this.LINEAR : 0;
		
		var tex = this.createTexture();
		var img = document.createElement("img");
		
		img.addEventListener("load", imgLoad.bind(this));
		img.src = url;
		
		tex.width = 0;
		tex.height = 0;
		tex.ready = false;
		
		return tex;
		
		function imgLoad()
		{
			tex.width = img.width;
			tex.height = img.height;
			tex.ready = true;
		
			this.bindTexture(this.TEXTURE_2D, tex);
			this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, filter);
			this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, filter);
			this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, img);
		}
	}

	return webgl;

})();
