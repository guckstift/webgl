let cache = new WeakMap();

export default function shader(gl, precision, vertSrc, fragSrc)
{
	let prog = gl.createProgram();
	let vert = gl.createShader(gl.VERTEX_SHADER);
	let frag = gl.createShader(gl.FRAGMENT_SHADER);
	
	if(!fragSrc) {
		[vertSrc, fragSrc] = [precision, vertSrc];
	}
	else {
		vertSrc = `precision ${precision} float;\n${vertSrc}`;
		fragSrc = `precision ${precision} float;\n${fragSrc}`;
	}
	
	gl.shaderSource(vert, vertSrc);
	gl.shaderSource(frag, fragSrc);
	gl.compileShader(vert);
	gl.compileShader(frag);
	gl.attachShader(prog, vert);
	gl.attachShader(prog, frag);
	gl.linkProgram(prog);
	
	if(gl.getShaderParameter(vert, gl.COMPILE_STATUS) === false) {
		throw "vertex error: " + gl.getShaderInfoLog(vert);
	}
	
	if(gl.getShaderParameter(frag, gl.COMPILE_STATUS) === false) {
		throw "fragment error: " + gl.getShaderInfoLog(frag);
	}
	
	if(gl.getProgramParameter(prog, gl.LINK_STATUS) === false) {
		throw "program error: " + gl.getProgramInfoLog(prog);
	}
	
	prog.use = () => gl.useProgram(prog);
	prog.info = (...args) => info(gl, prog, ...args);
	prog.assign = (...args) => assign(gl, prog, ...args);
	prog.draw = (...args) => draw(gl, prog, ...args);
	
	return prog;
}

export function info(gl, shader, name)
{
	let vars = cache.get(shader);
	
	if(!vars) {
		let attribs = gl.getProgramParameter(shader, gl.ACTIVE_ATTRIBUTES);
		let uniforms = gl.getProgramParameter(shader, gl.ACTIVE_UNIFORMS);
		cache.set(shader, vars = {});
		
		for(let i=0; i<attribs; i++) {
			let info = gl.getActiveAttrib(shader, i);
			let name = info.name.match(/[a-zA-Z0-9_]+/)[0];
			let loca = gl.getAttribLocation(shader, name);
			vars[name] = {loca, name, size: info.size, type: info.type};
		}
		
		for(let i=0; i<uniforms; i++) {
			let info = gl.getActiveUniform(shader, i);
			let name = info.name.match(/[a-zA-Z0-9_]+/)[0];
			let loca = gl.getUniformLocation(shader, name);
			vars[name] = {loca, name, size: info.size, type: info.type};
		}
	}
	
	return vars[name];
}

export function assign(gl, shader, name, value)
{
	let varinfo = info(gl, shader, name);
	let type = varinfo.type;
	let loca = varinfo.loca;
	
	if(typeof varinfo.loca === "number") {
		if(typeof value === "number") {
			gl.disableVertexAttribArray(loca);
			
			if(type === gl.FLOAT) {
				gl.vertexAttrib1f(loca, value);
			}
		}
		else if(Array.isArray(value)) {
			gl.disableVertexAttribArray(loca);
			
			if(type === gl.FLOAT) {
				gl.vertexAttrib1fv(loca, value);
			}
			else if(type === gl.FLOAT_VEC2) {
				gl.vertexAttrib2fv(loca, value);
			}
			else if(type === gl.FLOAT_VEC3) {
				gl.vertexAttrib3fv(loca, value);
			}
			else if(type === gl.FLOAT_VEC4) {
				gl.vertexAttrib4fv(loca, value);
			}
		}
		else {
			if(!value.type) {
				value = {
					type: "float",
					buffer: value,
					stride: 0,
					offset: 0,
				};
			}
			
			let comp = type === gl.FLOAT      ? 1 :
			           type === gl.FLOAT_VEC2 ? 2 :
			           type === gl.FLOAT_VEC3 ? 3 :
			           type === gl.FLOAT_VEC4 ? 4 :
			           type === gl.FLOAT_MAT2 ? 2 :
			           type === gl.FLOAT_MAT3 ? 3 :
			           type === gl.FLOAT_MAT4 ? 4 :
			           undefined;
			
			let count = type === gl.FLOAT_MAT2 ? 2 :
			            type === gl.FLOAT_MAT3 ? 3 :
			            type === gl.FLOAT_MAT4 ? 4 :
			            1;
			
			let comptype = value.type === "float"  ? gl.FLOAT :
			               value.type === "byte"   ? gl.BYTE :
			               value.type === "short"  ? gl.SHORT :
			               value.type === "ubyte"  ? gl.UNSIGNED_BYTE :
			               value.type === "ushort" ? gl.UNSIGNED_SHORT :
			               gl.FLOAT;
			
			let typesize = value.type === "float"  ? 4 :
			               value.type === "byte"   ? 1 :
			               value.type === "short"  ? 2 :
			               value.type === "ubyte"  ? 1 :
			               value.type === "ushort" ? 2 :
			               4;
			
			let buffer = value.buffer;
			let stride = value.stride;
			let offset = value.offset;
			
			for(let i=0; i<count; i++) {
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
				gl.enableVertexAttribArray(loca + i);
				gl.vertexAttribPointer(loca + i, comp, comptype, false, stride, offset + i * comp * typesize);
			}
		}
	}
	else {
		if(varinfo.type === gl.SAMPLER_2D) {
			let [tex, unit] = value;
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.uniform1i(loca, unit);
		}
		else if(typeof value === "number") {
			if(varinfo.type === gl.INT) {
				gl.uniform1i(loca, value);
			}
			else if(varinfo.type === gl.FLOAT) {
				gl.uniform1f(loca, value);
			}
		}
		else if(Array.isArray(value)) {
			if(varinfo.type === gl.INT) {
				gl.uniform1iv(loca, value);
			}
			else if(varinfo.type === gl.INT_VEC2) {
				gl.uniform2iv(loca, value);
			}
			else if(varinfo.type === gl.INT_VEC3) {
				gl.uniform3iv(loca, value);
			}
			else if(varinfo.type === gl.INT_VEC4) {
				gl.uniform4iv(loca, value);
			}
			else if(varinfo.type === gl.FLOAT) {
				gl.uniform1fv(loca, value);
			}
			else if(varinfo.type === gl.FLOAT_VEC2) {
				gl.uniform2fv(loca, value);
			}
			else if(varinfo.type === gl.FLOAT_VEC3) {
				gl.uniform3fv(loca, value);
			}
			else if(varinfo.type === gl.FLOAT_VEC4) {
				gl.uniform4fv(loca, value);
			}
			else if(varinfo.type === gl.FLOAT_MAT2) {
				gl.uniformMatrix2fv(loca, false, value);
			}
			else if(varinfo.type === gl.FLOAT_MAT3) {
				gl.uniformMatrix3fv(loca, false, value);
			}
			else if(varinfo.type === gl.FLOAT_MAT4) {
				gl.uniformMatrix4fv(loca, false, value);
			}
		}
	}
}

export function draw(gl, shader, mode, count, instances, data = {})
{
	let indexed = false;
	let type = gl.UNSIGNED_SHORT;
	gl.useProgram(shader);
	
	if(typeof mode !== "string") {
		[mode, count, instances, data] = ["triangles", mode, count, instances];
	}
	
	if(typeof instances !== "number") {
		[instances, data] = [1, instances];
	}
	
	if(typeof count !== "number") {
		[count, instances, data] = [1, count, instances];
	}
	
	mode = {
		points: gl.POINTS,
		linestrip: gl.LINE_STRIP,
		lineloop: gl.LINE_LOOP,
		lines: gl.LINES,
		trianglestrip: gl.TRIANGLE_STRIP,
		trianglefan: gl.TRIANGLE_FAN,
		triangles: gl.TRIANGLES,
	}[mode];
	
	for(let key in data) {
		let value = data[key];
		
		if(key === "layout") {
			for(let name in value) {
				assign(gl, shader, name, value[name]);
			}
		}
		else if(key === "indices") {
			let buf = value;
			
			if(Array.isArray(value)) {
				[buf, type] = value;
				type = type === "ubyte" ? gl.UNSIGNED_BYTE : gl.UNSIGNED_SHORT;
			}
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
			indexed = true;
		}
		else if(typeof key === "string") {
			assign(gl, shader, key, value);
		}
	}
	
	if(indexed) {
		gl.drawElements(mode, count, type, 0);
	}
	else {
		gl.drawArrays(mode, 0, count);
	}
}
