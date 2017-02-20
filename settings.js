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

exports.setTheme = th => {
	set("theme", th);
}

exports.getTheme = () => {
	var theme = get("theme");
	if(theme) {
		return theme;
	} else {
		return "default.css";
	}
}