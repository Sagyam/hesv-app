const linearDetectUrl =
	"https://major-project-backend-production-ef63.up.railway.app/equations/get-linear-equation";

const twoDegreeSolveUrl =
	"https://major-project-backend-production-ef63.up.railway.app/equations/solve-2d-linear-equation";

const threeDegreeSolveUrl =
	"https://major-project-backend-production-ef63.up.railway.app/equations/solve-3d-linear-equation";

let elt = document.getElementById("calculator");
let calculator = Desmos.GraphingCalculator(
	elt,
	(options = {
		settingsMenu: false,
		keypad: false,
		expressionsTopbar: false,
		expressions: false,
	})
);
//set z to 0 intially
calculator.setExpression({ id: "graph4", latex: "z=0" });

let drawer = null;

let inputBox1 = document.getElementById("1");
let inputBox2 = document.getElementById("2");
let inputBox3 = document.getElementById("3");

let errorBox = document.getElementById("errorBox");
let warningBox = document.getElementById("warningBox");

let activeBox = inputBox1;

// Listen for focus events
inputBox1.addEventListener("focus", function () {
	activeBox = inputBox1;
});

inputBox2.addEventListener("focus", function () {
	activeBox = inputBox2;
});

inputBox3.addEventListener("focus", function () {
	activeBox = inputBox3;
});

//Listen for keypress events
inputBox1.addEventListener("keyup", function (event) {
	calculator.setExpression({ id: "graph1", latex: inputBox1.value });
	isLinearEqnValid();
});

inputBox2.addEventListener("keyup", function (event) {
	calculator.setExpression({ id: "graph2", latex: inputBox2.value });
	isLinearEqnValid();
});

inputBox3.addEventListener("keyup", function (event) {
	calculator.setExpression({ id: "graph3", latex: inputBox3.value });
	isLinearEqnValid();
});

function isLinearEqnValid() {
	activeBox.classList.remove("error");
	let id = activeBox.id;
	var errorBox = document.getElementById(`local-error-${id}`);
	errorBox.innerHTML = "";

	let eqn = activeBox.value;

	let validCharsRegex = /[^xyzXYZ+-.=\d]/g;
	let containsInvalid = !!eqn.match(validCharsRegex);

	let tooManyEquals = eqn.split("=").length > 2;

	//no repeating characters
	let containsRepeat = !!eqn.match(/([xXyYzZ+-.=\^])\1/g);

	if (containsInvalid) {
		errorBox.innerHTML = "Invalid Character!";
		activeBox.classList.add("error");
	} else if (tooManyEquals) {
		errorBox.innerHTML = "Too Many Equals!";
		activeBox.classList.add("error");
	} else if (containsRepeat) {
		errorBox.innerHTML = "Repeating Characters!";
		activeBox.classList.add("error");
	}
	toggleSolveBtn();
	return !containsInvalid && !tooManyEquals && !containsRepeat;
}

//This validation should run only when input box loses focus
function validateOnFocusOut(event) {
	let errorBox = document.getElementById(`local-error-${event.target.id}`);
	errorBox.innerHTML = "";
	event.target.classList.remove("error");

	eqn = event.target.value;
	let isValid = eqn.split("=").length == 2;
	if (!isValid && eqn != "") {
		errorBox.innerHTML = "Equation Must Contain One Equals Sign!";
		event.target.classList.add("error");
	}
	toggleSolveBtn();
	return isValid;
}

//Get the buttons
let sendBtn = document.getElementById("send");
let solveBtn = document.getElementById("solve");

function toggleSendBtn() {
	let imageBase64 = drawer.api.getCanvasAsImage();
	let tooltip = document.getElementById("send-tooltip");
	if (imageBase64) {
		sendBtn.disabled = false;
		tooltip.innerHTML = "Send Image for Inference";
	} else {
		sendBtn.disabled = true;
		tooltip.innerHTML = "Draw Something First!";
	}
}

//Listen for drawing events
let canvas = document.getElementById("canvas-editor");
canvas.addEventListener("click", function (event) {
	toggleSendBtn();
});

function toggleSolveBtn() {
	let eqnCount = getNonEmptyEqns().length;
	let tooltip = document.getElementById("solve-tooltip");

	if (eqnCount >= 2 && noErrors()) {
		solveBtn.disabled = false;
		tooltip.innerHTML = "Solve this System of Equations";
	} else {
		solveBtn.disabled = true;
		tooltip.innerHTML = "Two or More Valid Equations Required!";
	}
}

function noErrors() {
	return (
		!document.getElementById("local-error-1").innerHTML.length &&
		!document.getElementById("local-error-2").innerHTML.length &&
		!document.getElementById("local-error-3").innerHTML.length
	);
}

function getNonEmptyEqns() {
	let nonEmptyEqn = [];
	if (inputBox1.value != "") {
		nonEmptyEqn.push(inputBox1);
	}
	if (inputBox2.value != "") {
		nonEmptyEqn.push(inputBox2);
	}
	if (inputBox3.value != "") {
		nonEmptyEqn.push(inputBox3);
	}

	return nonEmptyEqn;
}

function togglePleaseWait() {
	activeBox.value = "Please Wait...";
}

function dataURItoBlob(dataURI) {
	var binary = atob(dataURI.split(",")[1]);
	var array = [];
	for (var i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}
	return new Blob([new Uint8Array(array)], { type: "image/png" });
}

function sendImage() {
	let imageBase64 = drawer.api.getCanvasAsImage();
	if (imageBase64) {
		let blob = dataURItoBlob(imageBase64);
		let formData = new FormData();
		formData.append("image", blob);

		var requestOptions = {
			method: "POST",
			body: formData,
			redirect: "follow",
		};
		togglePleaseWait();
		fetch(linearDetectUrl, requestOptions)
			.then((response) => response.json())
			.then((result) => linDetectSuccess(result))
			.catch((error) => linDetectFailure(error));
	} else {
		alert("Draw Something!!");
	}
}

function linDetectSuccess(result) {
	let equation = result.equation;
	let logs = result.debug_logs;
	console.log(equation, logs);
	calculator.setExpression({ id: activeBox.id, latex: equation });
	activeBox.value = equation;
	nextBox();
	toggleSolveBtn();
}

function linDetectFailure(error) {
	errorBox.classList.remove("hide");
	warningBox.classList.add("hide");
	errorBox.innerHTML = "Sorry, I couldn't  detect any equation.";

	inputBox.value = "";
}

function nextBox() {
	if (activeBox == inputBox1) {
		activeBox = inputBox2;
	} else if (activeBox == inputBox2) {
		activeBox = inputBox3;
	} else if (activeBox == inputBox3) {
		activeBox = inputBox1;
	}
}

function solve() {
	let validEqns = getNonEmptyEqns();
	let formData = new FormData();
	validEqns.forEach((box, index) => {
		formData.append(`equation${index + 1}`, box.value);
	});

	var requestOptions = {
		method: "POST",
		body: formData,
		redirect: "follow",
	};
	if (validEqns.length === 2) {
		fetch(twoDegreeSolveUrl, requestOptions)
			.then((response) => response.json())
			.then((result) => linSolveSuccess(result))
			.catch((error) => linSolveFailure(error));
	} else if (validEqns.length === 3) {
		fetch(threeDegreeSolveUrl, requestOptions)
			.then((response) => response.json())
			.then((result) => linSolveSuccess(result))
			.catch((error) => linSolveFailure(error));
	} else if (validEqns.length < 2) {
		alert("Enter 2 or more equations");
	}
}

function linSolveSuccess(result) {
	let xSpan = document.getElementById("x");
	let ySpan = document.getElementById("y");
	let zSpan = document.getElementById("z");

	let xSolnDiv = document.getElementById("x-soln");
	let ySolnDiv = document.getElementById("y-soln");
	let zSolnDiv = document.getElementById("z-soln");

	errorBox.classList.add("hide");
	warningBox.classList.add("hide");

	let x = result.x;
	let y = result.y;
	let z = result.z;

	xSolnDiv.classList.remove("hide");
	ySolnDiv.classList.remove("hide");
	xSpan.innerText = x;
	ySpan.innerText = y;

	if (z) {
		zSolnDiv.classList.remove("hide");
		zSpan.innerText = z;
		calculator.setExpression({ id: "graph4", latex: `z=${z}` });
	} else {
		zSpan.innerText = "";
		zSolnDiv.classList.add("hide");
		calculator.setExpression({ id: "graph4", latex: "z=0" });
	}

	let error = result.error;
	let errorMessage = result.errorMessage;
	let warningMessage = result.warningMessage;
	let logs = result.debug_logs;

	if (error) {
		errorBox.classList.remove("hide");
		errorBox.innerHTML = errorMessage;
	}
	if (warningMessage) {
		warningBox.classList.remove("hide");
		warningBox.innerHTML = warningMessage;
	}
}

function linSolveFailure(result) {
	errorBox.classList.remove("hide");
	warningBox.classList.add("hide");
	errorBox.innerHTML = "Sorry, I couldn't solve this equation.";

	let xSolnDiv = document.getElementById("x-soln");
	let ySolnDiv = document.getElementById("y-soln");
	let zSolnDiv = document.getElementById("z-soln");

	xSolnDiv.classList.add("hide");
	ySolnDiv.classList.add("hide");
	zSolnDiv.classList.add("hide");
}

function clearCanvas() {
	drawer = null;
	$("#canvas-editor").empty();
	setupCanvas();
	toggleSendBtn();
}

function setupCanvas() {
	drawer = new DrawerJs.Drawer(
		null,
		{
			texts: customLocalization,
			plugins: ["Pencil", "Eraser"],
			defaultActivePlugin: { name: "Pencil", mode: "lastUsed" },
			pluginsConfig: {
				Eraser: {
					brushSize: 25,
				},
				Pencil: {
					brushSize: 5,
				},
			},
			activeColor: "#000000",
			transparentBackground: false,
			toolbars: {
				drawingTools: {
					positionType: "inside",
				},

				settings: {
					positionType: "inside",
				},
			},
		},

		window.innerWidth * 0.9375,
		window.innerHeight * 0.4
	);
	$("#canvas-editor").append(drawer.getHtml());
	drawer.onInsert();
}

window.onload = function () {
	setupCanvas();
};

window.onresize = function () {
	var width = window.innerWidth * 0.9375;
	var height = window.innerHeight * 0.37037;
	drawer.api.setSize(width, height);
};
