import shader from "./shader.js";
import buffer from "./buffer.js";
import texture from "./texture.js";

const flags = [
	"alpha",
	"depth",
	"stencil",
	"antialias",
	"premultipliedAlpha",
	"preserveDrawingBuffer",
	"failIfMajorPerformanceCaveat",
	"desynchronized",
];

export default function webgl(width, height, canvas, ...opts)
{
	if(typeof canvas === "string") {
		opts.unshift(canvas);
		canvas = document.querySelector(canvas);
	}
	
	if(!canvas) {
		canvas = document.createElement("canvas");
	}
	
	if(typeof width !== "number") {
		opts.unshift(width, height);
		width = canvas.width;
		height = canvas.height;
	}
	
	let appendToBody = opts.includes("appendToBody");
	let attribs = {};
	
	opts.forEach(opt => {
		if(flags.includes(opt)) {
			attribs[opt] = true;
		}
		else if(opt.startsWith("no-") && flags.includes(opt.slice(3))) {
			attribs[opt.slice(3)] = false;
		}
		else if(opt === "highPerformance") {
			attribs.powerPreference = "high-performance";
		}
		else if(opt === "lowPower") {
			attribs.powerPreference = "low-power";
		}
	});
	
	canvas.width = width;
	canvas.height = height;
	let gl = canvas.getContext("webgl", attribs);
	gl = gl || canvas.getContext("experimental-webgl", attribs);
	gl.viewport(0, 0, width, height);
	
	if(appendToBody) {
		document.body.appendChild(canvas);
	}
	
	gl.aspect = () => aspect(gl);
	gl.shader = (...args) => shader(gl, ...args);
	gl.buffer = (...args) => buffer(gl, ...args);
	gl.indices = (...args) => buffer(gl, "index", ...args);
	gl.texture = (...args) => texture(gl, ...args);
	
	return gl;
}

export function aspect(gl)
{
	return gl.canvas.clientWidth / gl.canvas.clientHeight;
}
