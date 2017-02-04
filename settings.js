let set = (key, val) => {
	global.settings[key] = val;
}

let get = (key) => {
	return global.settings[key];
}

exports.setFileName = fn => {
	set("fileName", fn);
}

exports.getFileName = () => {
	return get("fileName");
}