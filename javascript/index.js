var ajax = require("./lib/ajax");

document.querySelector("#ajax").addEventListener("click", function() {
	ajax({
		url: '/',
		error: function() {
			alert("Of course there's error");
		}
	})
});