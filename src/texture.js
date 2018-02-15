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

function textureFromUrl(url, filter, readyFunc)
{
	var filterName = filter || "nearest";
	
	if(texCache[url + "#" + filterName]) {
		if(readyFunc) {
			readyFunc();
		}
		
		return texCache[url + "#" + filterName];
	}
	
	filter = (
		filterName === "nearest" ? this.NEAREST : filterName === "linear" ? this.LINEAR : 0
	);
	
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
		
		texCache[url + "#" + filterName] = tex;
		
		if(readyFunc) {
			readyFunc();
		}
	}
}
