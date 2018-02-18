var plugins = {};

webgl.plugins = plugins;
webgl.loadText = loadText;

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
	var fullPage = false;
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
			else if(arg === "fullPage") {
				fullPage = true;
			}
		}
		else if(typeof arg === "function") {
			renderFunc = arg;
		}
	}
	
	var gl = document.createElement("canvas").getContext("webgl", options);
	
	gl.ia = gl.getExtension("ANGLE_instanced_arrays");
	gl.fd = gl.getExtension("EXT_frag_depth");
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
	gl.fullPage = false;
	gl.renderFunc = undefined;
	gl.frameLoopStarted = false;
	gl.lastShader = undefined;
	gl.sizeBackup = [0, 0];
	
	gl.resize = resize;
	gl.enableFullPage = enableFullPage;
	gl.disableFullPage = disableFullPage;
	gl.appendTo = appendTo;
	gl.appendToBody = appendToBody;
	gl.setClearColor = setClearColor;
	gl.setRenderFunc = setRenderFunc;
	gl.useShader = useShader;
	gl.buffer = buffer;
	gl.shader = shader;
	gl.shaderFromUrl = shaderFromUrl;
	gl.texture = texture;
	gl.textureFromUrl = textureFromUrl;
	
	gl.onWindowResize = function()
	{
		gl.resize(innerWidth, innerHeight);
	};
	
	if(setSize) {
		gl.resize(width, height);
	}
	else {
		gl.resize(800, 600);
	}
	
	if(toBody) {
		gl.appendToBody();
	}
	
	if(fullPage) {
		gl.enableFullPage();
	}
	
	if(renderFunc) {
		gl.setRenderFunc(renderFunc);
	}
	
	var pluginKeys = Object.getOwnPropertyNames(plugins);
	
	for(var i=0; i<pluginKeys.length; i++) {
		var key = pluginKeys[i];
		
		gl[key] = plugins[key];
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

function enableFullPage()
{
	this.canvas.style.position = "absolute";
	this.canvas.style.top = "0";
	this.canvas.style.left = "0";
	this.sizeBackup = [this.canvas.width, this.canvas.height];

	addEventListener("resize", this.onWindowResize);

	this.onWindowResize();
	
	return this;
}

function disableFullPage()
{
	this.canvas.style.position = "";
	this.canvas.style.top = "";
	this.canvas.style.left = "";

	removeEventListener("resize", this.onWindowResize);
	
	this.resize(this.sizeBackup);
	
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

function setClearColor(r, g, b, a)
{
	if(Array.isArray(r)) {
		g = r[1];
		b = r[2];
		a = r[3];
		r = r[0];
	}
	
	this.clearColor(r, g, b, a);
}

function setRenderFunc(func)
{
	var self = this;
	
	this.renderFunc = func;
	
	if(this.frameLoopStarted === false) {
		this.frameLoopStarted = true;
		requestAnimationFrame(frame);
	}
	
	function frame(now)
	{
		if(self.renderFunc) {
			self.clear(self.COLOR_BUFFER_BIT);
			self.renderFunc(now);
			requestAnimationFrame(frame);
		}
		else {
			self.frameLoopStarted = false;
		}
	}
}

function useShader(shader)
{
	if(this.lastShader !== shader) {
		this.useProgram(shader);
		this.lastShader = shader;
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
