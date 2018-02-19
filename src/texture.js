var texCache = {};

function texture(width, height, pixels, filter)
{
	if(typeof width === "string") {
		return this.textureFromUrl(width, height, pixels);
	}
	
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
	
	tex.size = [width, height];
	tex.ready = true;
	tex.img = undefined;
	
	return tex;
}

function textureFromUrl(url, filter, readyFunc)
{
	if(typeof filter === "function") {
		readyFunc = filter;
		filter = undefined;
	}
	
	var filterName = filter || "nearest";
	var texid = url + "#" + filterName;
	
	if(texCache[texid]) {
		if(readyFunc) {
			readyFunc(texCache[texid]);
		}
		
		return texCache[texid];
	}
	
	filter = (
		filterName === "nearest" ? this.NEAREST : filterName === "linear" ? this.LINEAR : 0
	);
	
	var tex = this.createTexture();
	var img = document.createElement("img");
	
	img.addEventListener("load", imgLoad.bind(this));
	img.src = url;
	
	tex.size = [0, 0];
	tex.ready = false;
	tex.img = img;
	
	return tex;
	
	function imgLoad()
	{
		tex.size = [img.width, img.height];
		tex.ready = true;
	
		this.bindTexture(this.TEXTURE_2D, tex);
		this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, filter);
		this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, filter);
		this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, img);
		
		texCache[texid] = tex;
		
		if(readyFunc) {
			readyFunc(tex);
		}
	}
}
