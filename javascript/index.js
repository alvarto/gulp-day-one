var ajax = require("./lib/ajax");

document.querySelector("#ajax").addEventListener("click", function() {
	ajax({
		url: '/',
		complete: function() {
			alert("Ajax submodule is excuted properly.");
		}
	});
});