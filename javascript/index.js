var ajax = require("./lib/ajax");

document.querySelector("#ajax").addEventListener("click", function() {
	ajax({
		url: '/',
		onError: function() {
			alert("Of course there's error");
		}
	})
});