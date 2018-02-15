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
	buffer.bytesPerElm = buffer.arrayType.BYTES_PER_ELEMENT;
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
