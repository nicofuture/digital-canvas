<script>

////////////////
// ART CANVAS //
////////////////

const moCont = document.querySelector("[data-mo='container']");
const moSlider = document.querySelector("[data-mo='slider']");
const moZSpeed = moCont.getAttribute("data-mo-zoom-speed");
var moScales = [1, 2], moScale = 1; // fallbacks
// get + format scales
if(moCont.hasAttribute("data-mo-scales")) {
	moScales = moCont.getAttribute("data-mo-scales").split(",")}
moScales.forEach((s, i) => {moScales[i] = Number(s)});
// get + format default scale
if(moCont.hasAttribute("data-mo-default-scale")) {
	moScale = Number(moCont.getAttribute("data-mo-default-scale"))}
moScale = (moScale - moScales[0]) / (moScales[moScales.length - 1] - moScales[0]);
// other
const moKeys = document.querySelectorAll("[data-mo-key]");
var moThrottle = false, moTouches = [], moPrevTouchDist = -1;
var moThrottleTime = {"scroll": 0, "gesture": 0, "touch": 0}
if(moCont.hasAttribute("data-mo-throttle")) {
	let data = moCont.getAttribute("data-mo-throttle").split(",");
	data.forEach(pair => {pair = pair.split("="); moThrottleTime[pair[0]] = Number(pair[1])})
}

// .includes polyfill for IE
if(!String.prototype.includes) {
	String.prototype.includes = (search, start) => {
		"use strict";
		if(search instanceof RegExp) {
			throw TypeError("first argument must not be a RegExp")}
		if(start === undefined) {start = 0}
		return this.indexOf(search, start) !== -1
	}
}

// Drag
function moDrag(el) {
	let pos1 = 0, pos2 = 0, pos3 = 0; pos4 = 0;
	el.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get cursor pos at startup
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call function whenever cursor moves
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calc new cursor pos
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set el's new pos
		el.style.top = (el.offsetTop - pos2) + "px";
		el.style.left = (el.offsetLeft - pos1) + "px";
	}

	function closeDragElement(e) {
		// stop moving when mouse is released
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

// Pointer Zoom
function moPointerZoom(el) {
	// wheel
	el.addEventListener("wheel", (ev) => {
		if(!moThrottle) {
			moThrottle = true;
			// zoom
			if(ev.deltaY > 0) {document.querySelector("#MO-Minus").click()}
			else if(ev.deltaY < 0) {document.querySelector("#MO-Plus").click()}
			// set throttle
			setTimeout(() => {moThrottle = false}, moThrottleTime.scroll)
		}
		ev.preventDefault()
	});
	// gestures
	el.addEventListener("gesturestart", (ev) => {ev.preventDefault()});
	el.addEventListener("gesturechange", (ev) => {
		if(!moThrottle) {
			moThrottle = true;
			// zoom
			if(ev.scale > 1) {document.querySelector("#MO-Plus").click()}
			else if(ev.scale < 1) {document.querySelector("#MO-Minus").click()}
			// set throttle
			setTimeout(() => {moThrottle = false}, moThrottleTime.gesture)
		}
		ev.preventDefault()
	});
	el.addEventListener("gestureend", (ev) => {ev.preventDefault()});
	// touch
	el.addEventListener("touchstart", (ev) => {
		if(ev.targetTouches.length == 2) {
			ev.preventDefault();
			for(let i = 0; i < ev.targetTouches.length; i++) {
				moTouches.push(ev.targetTouches[i])}
		}
	});
	el.addEventListener("touchmove", (ev) => {
		if(!moThrottle && ev.targetTouches.length == 2 && ev.changedTouches.length == 2) {
			ev.preventDefault();
			let pt1 = -1, pt2 = -1;
			for(let i = 0; i < moTouches.length; i++) {
				if(moTouches[i].identifier == ev.targetTouches[0].identifier) {pt1 = i}
				if(moTouches[i].identifier == ev.targetTouches[1].identifier) {pt2 = i}
			}
			if(pt1 >= 0 && pt2 >= 0) {
				let dist1 = Math.abs(moTouches[pt1].clientX - moTouches[pt2].clientX);
				let dist2 = Math.abs(ev.targetTouches[0].clientX - ev.targetTouches[1].clientX);
				console.log("OG: " + dist1);
				console.log("NEW: " + dist2);
				if(dist2 > dist1) {
					console.log("ZOOM IN"); document.querySelector("#MO-Plus").click()}
				else if(dist2 < dist1) {
					console.log("ZOOM OUT"); document.querySelector("#MO-Minus").click()}
				moTouches[pt1] = ev.targetTouches[0];
				moTouches[pt2] = ev.targetTouches[1];
				setTimeout(() => {moThrottle = false}, moThrottleTime.touch)
			}
			else {moTouches = []}
		}
	});
	el.addEventListener("touchend", (ev) => {touchEndHandler(ev)});
	el.addEventListener("touchcancel", (ev) => {touchEndHandler(ev)});
	function touchEndHandler(ev) {
		console.log(moTouches);
		if(moTouches[0] != undefined) {
			for(let i = 0; i < moTouches.length; i++) {
				if(moTouches[i].identifier == ev.identifier) {
					console.log("REMOVE");
					moTouches.splice(i, 1)}
			}
		}
		console.log(moTouches)
	}
}

// Zoom
function moZoom(x, y) {
	let s = -1;
	if(x == undefined) {x = moScale; y = true}
	if(y == undefined) {y = false}
	// slider
	if(!isNaN(x)) {
		x = Number(x);
		s = ((moScales[moScales.length - 1] - moScales[0]) * x) + moScales[0]
	}
	// scales
	else if(x != undefined) {
		let prev = moScales[0];
		let next = moScales[moScales.length - 1];
		moScales.every((scale, i) => {
			if(scale < moScale) {return true}
			else if(scale > moScale) {
				if(i - 1 > 0) {prev = moScales[i - 1]}
				if(i < moScales.length - 1) {next = moScales[i]}
				return false
			}
			else if(scale == moScale) {
				if(i - 1 > 0) {prev = moScales[i - 1]}
				if(i + 1 < moScales.length - 1) {next = moScales[i + 1]}
				return false
			}
			return true
		});
		if(x == "+") {s = next}
		else if(x == "-") {s = prev}
		y = true
	}
	// zoom
	if(y) {moCont.style.transitionDuration = moZSpeed}
	if(s < moScales[0]) {s = moScales[0]}
	else if(s > moScales[moScales.length - 1]) {s = moScales[moScales.length - 1]}
	moCont.style.transform = "scale(" + s + "," + s + ")"; moScale = s;
	if(y) {moSlider.value = (s - moScales[0]) / (moScales[moScales.length - 1] - moScales[0])}
	setTimeout(() => {moCont.style.removeProperty("transition-duration")},
		Number(moZSpeed.replace(/\D/g,'')))
}

// Setup
moZoom(); // Set zoom to default
moPointerZoom(moCont);
//moDrag(moCont); // Make draggable
moSlider.addEventListener("input", () => {moZoom(moSlider.value)});
// Keys
document.addEventListener("keydown", (ev) => {
	moKeys.forEach(el => {
		if(el.hasAttribute("data-mo-target")) {
			if(ev.keyCode == el.getAttribute("data-mo-key")) {
				document.querySelector(el.getAttribute("data-mo-target")).click()}}
	})
});
// Actions
document.querySelectorAll("[data-mo-action]").forEach(el => {
	// el = element // tr = trigger // ac = action // ta = target
	let tr, ac = el.getAttribute("data-mo-action"), ta;
	if(ac.includes("=")) {tr = ac.split("=")[0]; ac = ac.split("=")[1]}
	if(tr != undefined) {
		// Remote Click
		if(ac.includes("click") && ta != undefined) {
			el.addEventListener(tr, () => {ta.click()})}
		// Zoom
		else if(ac.includes("zoom")) {
			el.addEventListener(tr, () => {moZoom(ac.replace("zoom", ""))})}
		// Minmax
		else if(ac.includes("minmax")) {
			el.addEventListener(tr, () => {
				let x = 1; if(moScale == moScales[moScales.length - 1]) {x = 0}
				moZoom(x, true)})}
	}
});

</script>

