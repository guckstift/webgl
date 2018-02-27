var shaderCache = {};

function createShader(gl)
{
	var prog = gl.createProgram();
	
	prog.vertShader = gl.createShader(gl.VERTEX_SHADER);
	prog.fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	prog.gl = gl;
	prog.ready = false;
	prog.attributes = {};
	prog.uniforms = {};
	prog._indices = undefined;
	prog._mode = undefined;
	prog._stride = undefined;
	prog._offset = undefined;
	prog._count = undefined;
	prog._divisor = undefined;
	prog._instances = undefined;
	prog._buffer = undefined;
	
	prog.indices = shaderIndices;
	prog.mode = shaderMode;
	prog.stride = shaderStride;
	prog.offset = shaderOffset;
	prog.count = shaderCount;
	prog.divisor = shaderDivisor;
	prog.instances = shaderInstances;
	prog.buffer = shaderBuffer;
	prog.assign = shaderAssign;
	prog.draw = shaderDraw;
	
	return prog;
}

function shader(vert, frag)
{
	var shaderId = null;
	var prog = createShader(this);
	
	try {
		if(
			typeof vert === "string" && typeof frag === "string" &&
			document.querySelector(vert) && document.querySelector(frag)
		) {
			shaderId = vert + "|" + frag;
		
			if(shaderCache[shaderId]) {
				return shaderCache[shaderId];
			}
		}
	
		var vertElm = typeof vert === "string" ? document.querySelector(vert) : vert;
		var fragElm = typeof frag === "string" ? document.querySelector(frag) : frag;
	}
	catch(e) {
	}
	
	vert = vertElm instanceof Node ? vertElm.textContent : vert;
	frag = fragElm instanceof Node ? fragElm.textContent : frag;
	
	compileShader(prog, vert, frag);
	
	shaderCache[shaderId] = prog;
	
	return prog;
}

function shaderFromUrl(vertUrls, fragUrls, readyFunc)
{
	vertUrls = Array.isArray(vertUrls) ? vertUrls : [vertUrls];
	fragUrls = Array.isArray(fragUrls) ? fragUrls : [fragUrls];
	
	var shaderId = vertUrls.join("|") + "|" + fragUrls.join("|");
	
	if(shaderCache[shaderId]) {
		if(readyFunc) {
			readyFunc(shaderCache[shaderId]);
		}
		
		return shaderCache[shaderId];
	}
	
	var prog = createShader(this);
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
				shaderCache[shaderId] = prog;
				
				if(readyFunc) {
					readyFunc(prog);
				}
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
				shaderCache[shaderId] = prog;
				
				if(readyFunc) {
					readyFunc(prog);
				}
			}
		}
	}
}

function compileShader(prog, vertSrc, fragSrc)
{
	var gl = prog.gl;
	var texCnt = 0;
	
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
		var name = info.name.match(/[a-zA-Z0-9_]+/)[0];
		
		prog.attributes[name] = {
			location: gl.getAttribLocation(prog, name),
			type: info.type,
		};
	}

	var numUniforms = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);

	for(var i=0; i<numUniforms; i++) {
		var info = gl.getActiveUniform(prog, i);
		var name = info.name.match(/[a-zA-Z0-9_]+/)[0];
	
		prog.uniforms[name] = {
			location: gl.getUniformLocation(prog, name),
			type: info.type,
			size: info.size,
			texUnit: info.type === gl.SAMPLER_2D ? texCnt : 0,
			texReady: false,
		};
		
		if(info.type === gl.SAMPLER_2D) {
			texCnt += info.size;
		}
	}
	
	prog.ready = true;
}

function shaderIndices(indices)
{
	var gl = this.gl;
	
	this._indices = indices;
	indices.update();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
	
	return this;
}

function shaderMode(mode)
{
	var gl = this.gl;
	
	this._mode = (
		mode == "points"        ? gl.POINTS :
		mode == "linestrip"     ? gl.LINE_STRIP :
		mode == "lineloop"      ? gl.LINE_LOOP :
		mode == "lines"         ? gl.LINES :
		mode == "trianglestrip" ? gl.TRIANGLE_STRIP :
		mode == "trianglefan"   ? gl.TRIANGLE_FAN :
		mode == "triangles"     ? gl.TRIANGLES :
		this._mode
	);
	
	return this;
}

function shaderStride(stride)
{
	this._stride = stride;
	
	return this;
};

function shaderOffset(offset)
{
	this._offset = offset;
	
	return this;
};

function shaderCount(count)
{
	this._count = count;
	
	return this;
};

function shaderDivisor(divisor)
{
	this._divisor = divisor;
	
	return this;
}

function shaderBuffer(buffer)
{
	this._buffer = buffer;
	
	return this;
}

function shaderInstances(instances)
{
	this._instances = instances;
	
	return this;
}

function shaderAssign(name, value)
{
	if(this.attributes.hasOwnProperty(name)) {
		shaderAssignAttribute.call(this, name, value);
	}
	else if(this.uniforms.hasOwnProperty(name)) {
		shaderAssignUniform.call(this, name, value);
	}
	
	return this;
}

function shaderAssignAttribute(name, value)
{
	var gl = this.gl;
	var attrib = this.attributes[name];
	
	var buffer = (
		value.buffer !== undefined ? value.buffer :
		value instanceof WebGLBuffer ? value :
		this._buffer !== undefined ? this._buffer :
		0
	);
	
	var offset = (
		value.offset !== undefined ? value.offset :
		this._offset !== undefined ? this._offset :
		0
	);
	
	var stride = (
		value.stride !== undefined ? value.stride :
		this._stride !== undefined ? this._stride :
		0
	);
	
	var divisor = (
		value.divisor !== undefined ? value.divisor :
		this._divisor !== undefined ? this._divisor :
		0
	);
	
	if(!attrib) {
		return this;
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
	
	buffer.update();
	gl.bindBuffer(buffer.target, buffer);
	gl.enableVertexAttribArray(location);
	gl.vertexAttribPointer(location, components, buffer.glType, false, stride, offset);
	
	if(gl.ia) {
		gl.ia.vertexAttribDivisorANGLE(location, divisor);
	}
	
	return this;
}

function shaderAssignUniform(name, value)
{
	var gl = this.gl;
	var uniform = this.uniforms[name];

	if(!uniform) {
		return false;
	}
	
	var type = uniform.type;
	var location = uniform.location;
	var size = uniform.size;
	
	gl.useShader(this);
	
	if(type === gl.SAMPLER_2D) {
		if(size > 1) {
			var texUnits = Array(value.length);
	
			for(var i=0; i<value.length; i++) {
				texUnits[i] = uniform.texUnit + i;
				
				if(!value[i].ready) {
					uniform.texReady = false;
					return false;
				}
				
				gl.activeTexture(gl.TEXTURE0 + texUnits[i]);
				gl.bindTexture(gl.TEXTURE_2D, value[i]);
			}

			gl.uniform1iv(location, texUnits);
			uniform.texReady = true;
		}
		else {
			if(!value.ready) {
				uniform.texReady = false;
				return false;
			}
		
			gl.activeTexture(gl.TEXTURE0 + uniform.texUnit);
			gl.bindTexture(gl.TEXTURE_2D, value);
			gl.uniform1i(location, uniform.texUnit);
			uniform.texReady = true;
		}
	}
	else {
		var func = (
			type === gl.FLOAT ? gl.uniform1f :
			type === gl.FLOAT_VEC2 ? gl.uniform2fv :
			type === gl.FLOAT_VEC3 ? gl.uniform3fv :
			type === gl.FLOAT_VEC4 ? gl.uniform4fv :
			type === gl.INT || type === gl.BOOL ? gl.uniform1iv :
			type === gl.INT_VEC2 || type === gl.BOOL_VEC2 ? gl.uniform2iv :
			type === gl.INT_VEC3 || type === gl.BOOL_VEC3 ? gl.uniform3iv :
			type === gl.INT_VEC4 || type === gl.BOOL_VEC4 ? gl.uniform4iv :
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
	
	return true;
}

function shaderDraw(input)
{
	input = input || {};
	
	if(this.ready === false) {
		return this;
	}
	
	var gl = this.gl;
	var keys = Object.getOwnPropertyNames(input);
	
	for(var i=0; i<keys.length; i++) {
		var key = keys[i];
		
		if(key === "indices") {
			this.indices(input[key]);
		}
		else if(key === "mode") {
			this.mode(input[key]);
		}
		else if(key === "stride") {
			this.stride(input[key]);
		}
		else if(key === "offset") {
			this.offset(input[key]);
		}
		else if(key === "count") {
			this.count(input[key]);
		}
		else if(key === "divisor") {
			this.divisor(input[key]);
		}
		else if(key === "instances") {
			this.instances(input[key]);
		}
		else if(key === "buffer") {
			this.buffer(input[key]);
		}
		else {
			this.assign(key, input[key]);
		}
	}
	
	var allTexturesReady = true;
	var uniKeys = Object.getOwnPropertyNames(this.uniforms);
	
	for(var i=0; i<uniKeys.length; i++) {
		var uniform = this.uniforms[uniKeys[i]];
		
		if(uniform.type === gl.SAMPLER_2D) {
			allTexturesReady = allTexturesReady && uniform.texReady;
		}
	}
	
	if(!allTexturesReady) {
		return this;
	}
	
	gl.useShader(this);
	
	var mode = this._mode || gl.TRIANGLES;
	var instances = this._instances || 1;
	
	if(gl.ia) {
		if(this._indices) {
			gl.ia.drawElementsInstancedANGLE(
				mode, this._indices.len, this._indices.glType, 0, instances
			);
		}
		else {
			gl.ia.drawArraysInstancedANGLE(mode, 0, this._count, instances);
		}
	}
	else {
		if(this._indices) {
			gl.drawElements(mode, this._indices.len, this._indices.glType, 0);
		}
		else {
			gl.drawArrays(mode, 0, this._count);
		}
	}
	
	return this;
}
