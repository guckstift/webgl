const datasizes = {
	byte:   1,
	ubyte:  1,
	short:  2,
	ushort: 2,
	float:  4,
};

export default function layout(buffer, type, ...fields)
{
	let stride = 0;
	let attribs = {};
	
	if(typeof type !== "string") {
		fields.unshift(type);
		type = "float";
	}
	
	let datasize = datasizes[type];
	
	fields.forEach(field => {
		let [name, count] = field;
		let size = datasize * count;
		let offset = stride;
		attribs[name] = {name, buffer, type, offset};
		stride += size;
	});
	
	for(let name in attribs) {
		attribs[name].stride = stride;
	}
	
	return attribs;
}
