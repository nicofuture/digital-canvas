/////////////////
// MEDIA MODAL //
/////////////////

if(!String.prototype.includes) {
	String.prototype.includes = (search, start) => {
		"use strict";
		if(search instanceof RegExp) {
			throw TypeError("first argument must not be a RegExp")}
		if(start === undefined) {start = 0}
		return this.indexOf(search, start) !== -1
	}
}

function moTransform(mo, zm, pt, tr, sn) {
	if(mo === undefined) {return}
	// scale
	let sc = mo.scale;
	if(zm === undefined) {
		zm = (mo.scale - mo.scales[0]) / (mo.scales[mo.scales.length - 1] - mo.scales[0])}
	if(!isNaN(zm)) {
		zm = Number(zm);
		sc = ((mo.scales[mo.scales.length - 1] - mo.scales[0]) * zm) + mo.scales[0]}
	else {
		let prev = mo.scales[0], next = mo.scales[mo.scales.length - 1];
		mo.scales.every((s, i) => {
			if(s < mo.scale) {return true}
			else if(s > mo.scale) {
				if(i - 1 > 0) {prev = mo.scales[i - 1]}
				if(i < mo.scales.length - 1) {next = mo.scales[i]}
				return false
			}
			else if(s == mo.scale) {
				if(i - 1 > 0) {prev = mo.scales[i - 1]}
				if(i + 1 < mo.scales.length - 1) {next = mo.scales[i + 1]}
				return false
			}
			return true
		});
		if(zm == "+") {sc = next}
		else if(zm == "-") {sc = prev}
		tr = true
	}
	if(sc < mo.scales[0]) {sc = mo.scales[0]}
	else if(sc > mo.scales[mo.scales.length - 1]) {sc = mo.scales[mo.scales.length - 1]}
	// translate
	let vp = mo.viewport.getBoundingClientRect(), cn = [vp.width / 2, vp.height / 2];
	if(Array.isArray(pt) && pt.length >= 2) {
		if(Array.isArray(pt[0]) && Array.isArray(pt[1])) {
			pt = [
				(pt[0][0] - pt[1][0]) / 2 + pt[1][0],
				(pt[0][1] - pt[1][1]) / 2 + pt[1][1]
			]}
		pt.forEach((p, i) => {pt[i] = Math.round(pt[i] - cn[i])})
	}
	else {pt = mo.center}
	// snap
	if(sn !== false) {
		let me = mo.media.getBoundingClientRect(), co = mo.cont.getBoundingClientRect();
		let ogpt = [pt[0] + cn[0], pt[1] + cn[1]], scme = [(me.width / mo.scale) * sc, (me.height / mo.scale) * sc];
		if(scme[0] <= vp.width) {pt[0] = 0}
		else if(ogpt[0] - (scme[0] / 2) > vp.left) {
			pt[0] = cn[0] + Math.abs((cn[0] * sc) - cn[0]) - Math.abs(co.left - me.left) - cn[0]}
		else if(ogpt[0] + (scme[0] / 2) < vp.right) {
			pt[0] = cn[0] - Math.abs((cn[0] * sc) - cn[0]) + Math.abs(co.right - me.right) - cn[0]}
		if(scme[1] <= vp.height) {pt[1] = 0}
		else if(ogpt[1] - (scme[1] / 2) > vp.top) {
			pt[1] = cn[1] + Math.abs((cn[1] * sc) - cn[1]) - Math.abs(co.top - me.top) - cn[1]}
		else if(ogpt[1] + (scme[1] / 2) < vp.bottom) {
			pt[1] = cn[1] - Math.abs((cn[1] * sc) - cn[1]) + Math.abs(co.bottom - me.bottom) - cn[1]}
	}
	// transform
	if(tr !== false) {
		mo.cont.style.transitionDuration = mo.zspeed;
		//mo.controls.sliders.forEach(sl => {
		//	sl.value = (sc - mo.scales[0]) / (mo.scales[mo.scales.length - 1] - mo.scales[0])});
	}
	mo.controls.sliders.forEach(sl => {
		sl.value = (sc - mo.scales[0]) / (mo.scales[mo.scales.length - 1] - mo.scales[0])});
	mo.cont.style.transform = "translate(" + pt[0] + "px, " + pt[1] + "px) scale(" + sc + ")";
	mo.center = pt; mo.scale = sc;
	setTimeout(() => {mo.cont.style.removeProperty("transition")}, mo.zspeed)
}

function moGestures(mo) {
	if(mo === undefined) {return}
	// mouse
	let pt = [0, 0], pt0 = [0, 0], vp;
	mo.cont.addEventListener("mousedown", (ev) => {
		// drag
		vp = mo.viewport.getBoundingClientRect();
		vp = [vp.width / 2, vp.height / 2];
		pt0[0] = ev.clientX;
		pt0[1] = ev.clientY;
		mo.cont.addEventListener("mousemove", dragMove);
		mo.cont.addEventListener("mouseup", dragEnd);
		mo.cont.addEventListener("mouseout", dragEnd);
		ev.preventDefault()
	});
	// touch
	mo.cont.addEventListener("touchstart", (ev) => {
		// pinch
		if(ev.targetTouches.length == 2) {
			ev.preventDefault();
			for(let i = 0; i < ev.targetTouches.length; i++) {
				mo.evcache.push(ev.targetTouches[i])}
			mo.cont.removeEventListener("mousemove", dragMove);
			mo.cont.removeEventListener("mouseup", dragEnd);
			mo.cont.removeEventListener("mouseout", dragEnd)
		}
		// drag
		else if(ev.targetTouches.length == 1) {
			vp = mo.viewport.getBoundingClientRect();
			vp = [vp.width / 2, vp.height / 2];
			pt0[0] = ev.targetTouches[0].clientX;
			pt0[1] = ev.targetTouches[0].clientY;
			mo.cont.addEventListener("touchmove", dragMove);
			mo.cont.addEventListener("touchend", dragEnd);
			mo.cont.addEventListener("touchcancel", dragEnd)
		}
	});
	mo.cont.addEventListener("touchmove", (ev) => {
		if(mo.throttle.active !== true && ev.targetTouches.length == 2) {
			ev.preventDefault();
			mo.throttle.active = true;
			let ppt1 = -1, ppt2 = -1;
			mo.evcache.forEach((p, i) => {
				if(p.identifier == ev.targetTouches[0].identifier) {ppt1 = i}
				if(p.identifier == ev.targetTouches[1].identifier) {ppt2 = i}
			});
			if(ppt1 >= 0 && ppt2 >= 0) {
				let d1 = Math.abs(mo.evcache[ppt1].clientX - mo.evcache[ppt2].clientX);
				let d2 = Math.abs(ev.targetTouches[0].clientX - ev.targetTouches[1].clientX);
				if(d2 > d1) {moTransform(mo, "+", [
						[ev.targetTouches[0].clientX, ev.targetTouches[0].clientY],
						[ev.targetTouches[1].clientX, ev.targetTouches[1].clientY]])}
				else if(d2 < d1) {moTransform(mo, "-")}
				mo.evcache[ppt1] = ev.targetTouches[0];
				mo.evcache[ppt2] = ev.targetTouches[1];
				setTimeout(() => {mo.throttle.active = false}, mo.throttle.touch)
			}
			else {mo.evcache = []}
		}
	});
	mo.cont.addEventListener("touchend", tPinchEnd);
	mo.cont.addEventListener("touchcancel", tPinchEnd);
	// drag // pinch
	function dragMove(ev) {
		ev.preventDefault(); let int = ev;
		if(ev.type == "touchmove") {int = ev.targetTouches[0]}
		pt[0] = mo.center[0] + (int.clientX - pt0[0]) + vp[0];
		pt[1] = mo.center[1] + (int.clientY - pt0[1]) + vp[1];
		pt0[0] = int.clientX; pt0[1] = int.clientY;
		moTransform(mo, undefined, pt, false, false);
	}
	function dragEnd(ev) {
		moTransform(mo);
		let ev1 = "touchmove", ev2 = "touchend", ev3 = "touchcancel";
		if(ev.type == "mouseup" || ev.type == "mouseout") {
			ev1 = "mousemove"; ev2 = "mouseup"; ev3 = "mouseout"}
		mo.cont.removeEventListener(ev1, dragMove);
		mo.cont.removeEventListener(ev2, dragEnd);
		mo.cont.removeEventListener(ev3, dragEnd)
	}
	function tPinchEnd(ev) {
		if(mo.evcache[0] != undefined) {mo.evcache.forEach((p, i) => {
			if(p.identifier == ev.identifier) {mo.evcache.splice(i, 1)}})}
	}
	// scroll
	mo.cont.addEventListener("wheel", (ev) => {
		if(mo.throttle.active !== true) {
			mo.throttle.active = true;
			if(ev.deltaY > 0) {moTransform(mo, "-")}
			if(ev.deltaY < 0) {moTransform(mo, "+")}
			setTimeout(() => {mo.throttle.active = false}, mo.throttle.scroll)
		}
		ev.preventDefault()
	});
	// gestures
	mo.cont.addEventListener("gesturestart", (ev) => {ev.preventDefault()});
	mo.cont.addEventListener("gesturechange", (ev) => {
		if(mo.throttle.active !== true) {
			mo.throttle.active = true;
			if(ev.scale < 1) {moTransform(mo, "-")}
			if(ev.scale > 1) {moTransform(mo, "+")}
			setTimeout(() => {mo.throttle.active = false}, mo.throttle.gesture)
		}
		ev.preventDefault()
	});
	mo.cont.addEventListener("gestureend", (ev) => {ev.preventDefault()});
}

function moActions(mo) {
	let x = moToArray(mo.mo.querySelectorAll("[data-mo-action]"));
	x.forEach(y => {
		let tr, ac = y.getAttribute("data-mo-action"), ta;
		if(ac.includes("=")) {tr = ac.split("=")[0]; ac = ac.split("=")[1]}
		if(y.hasAttribute("data-mo-target")) {
			ta = mo.mo.querySelector(y.getAttribute("data-mo-target"))}
		if(tr !== undefined) {
			// remote click
			if(ac == "click" && ta !== undefined) {
				y.addEventListener(tr, () => {ta.click()})
			}
			// minmax
			else if(ac == "minmax") {
				y.addEventListener(tr, (ev) => {
					let z = 1; if(mo.scale == mo.scales[mo.scales.length - 1]) {z = 0}
					moTransform(mo, z)
				})
			}
			// body scroll
			else if(ac == "bodyscrollstop" || ac == "bodyscrollgo") {
				y.addEventListener(tr, () => {
					if(ac.includes("stop")) {document.body.style.overflowY = "hidden"}
					if(ac.includes("go")) {document.body.style.removeProperty("overflow-y")}
				})
			}
		}
	})
}

function moKeydown(ev) {
	moRef.forEach(mo => {
		if(mo.active === true && mo.hasOwnProperty("keys")) {
			mo.keys.forEach(x => {
				if(ev.keyCode == x.key) {
					if(x.preventdefault === true) {ev.preventDefault()}
					if(x.target != "") {mo.mo.querySelector(x.target).click()}
				}
			})
		}
	})
}

function moUIFade(mo) {
	if(window.innerWidth <= 767) {return}
	if(mo !== undefined && mo.hasOwnProperty("ui")) {
		mo.ui.t = new Date();
		//mo.mo.addEventListener("pointermove", UIFadeIn);
		//mo.mo.addEventListener("touchstart", UIFadeIn);
		mo.viewport.addEventListener("pointermove", UIFadeIn);
		mo.viewport.addEventListener("touchstart", UIFadeIn);
		function UIFadeIn() {
			if(mo.active === true) {
				mo.ui.t = new Date();
				//document.body.style.removeProperty("cursor");
				mo.viewport.style.removeProperty("cursor");
				mo.ui.els.forEach(el => {el.style.removeProperty("opacity")})
			}
		}
		setInterval(() => {
			if(mo.active === true) {
				let x = new Date();
				if(mo.ui.t.getTime() + 1000 < x.getTime()) {
					//document.body.style.cursor = "none";
					mo.viewport.style.cursor = "none";
					mo.ui.els.forEach(el => {el.style.opacity = "0"})
				}
			}
		}, 1000)
	}
}

function moToArray(x) {
	let y = [];
	for(let i = 0; i < x.length; i++) {y.push(x[i])}
	return y
}

// Setup
let moRef = [];
let modals = document.querySelectorAll("[data-mo='modal']");
for(let i = 0; i < modals.length; i++) {
	// defaults
	moRef.push({
		"mo": modals[i],
		"id": i,
		"active": true,
		"scale": 0,
		"scales": [0.9, 1, 1.2, 1.6, 2.2, 3],
		"defaultscale": 0.9,
		"center": [0, 0],
		"zspeed": 200,
		"throttle": {"scroll": 0, "gesture": 0, "touch": 0, "active": false},
		"evcache": [],
		"controls": {}
	})
}
moRef.forEach(mo => {
	// scales
	if(mo.mo.hasAttribute("data-mo-scales")) {
		let x = [], y = mo.mo.getAttribute("data-mo-scales").split(",");
		y.forEach(z => {if(!isNaN(z)) {x.push(Number(z))}});
		if(x.length >= 2) {mo.scales = x}
	}
	// default scale
	if(mo.mo.hasAttribute("data-mo-defaultscale")) {
		let x = mo.mo.getAttribute("data-mo-defaultscale");
		if(!isNaN(x)) {
			mo.defaultscale = Number(x);
			//mo.scale = (mo.defaultscale - mo.scales[0]) / (mo.scales[mo.scales.length - 1] - mo.scales[0])
			mo.scale = mo.defaultscale
		}
	}
	// zoom speed
	if(mo.mo.hasAttribute("data-mo-zoomspeed")) {
		let x = mo.mo.getAttribute("data-mo-zoomspeed");
		if(!isNaN(x)) {x = x + "ms"}
		mo.zspeed = x
	}
	// throttle
	if(mo.mo.hasAttribute("data-mo-throttle")) {
		let x = mo.mo.getAttribute("data-mo-throttle").split(",");
		x.forEach(y => {
			y = y.split("=");
			if(!isNaN(y[1])) {mo.throttle[y[0]] = Number(y[1])}
		})
	}
	// viewport
	if(mo.mo.querySelector("[data-mo='viewport']")) {
		mo.viewport = mo.mo.querySelector("[data-mo='viewport']");
	}
	// container
	if(mo.mo.querySelector("[data-mo='container']")) {
		mo.cont = mo.mo.querySelector("[data-mo='container']");
		if(mo.cont.querySelector("[data-mo='media']")) {
			mo.media = mo.cont.querySelector("[data-mo='media']")
		}
	}
	// ui
	if(mo.mo.querySelector("[data-mo='ui']")) {
		mo.ui = {"t": 0, "els": moToArray(mo.mo.querySelectorAll("[data-mo='ui']"))}
	}
	// controls
	if(mo.mo.querySelector("[data-mo='-']")) {
		mo.controls.minus = moToArray(mo.mo.querySelectorAll("[data-mo='-']"));
		mo.controls.minus.forEach(x => {x.addEventListener("click", () => {moTransform(mo, "-")})})
	}
	if(mo.mo.querySelector("[data-mo='+']")) {
		mo.controls.plus = moToArray(mo.mo.querySelectorAll("[data-mo='+']"));
		mo.controls.plus.forEach(x => {x.addEventListener("click", () => {moTransform(mo, "+")})})
	}
	if(mo.mo.querySelector("[data-mo='slider']")) {
		mo.controls.sliders = moToArray(mo.mo.querySelectorAll("[data-mo='slider']"));
		mo.controls.sliders.forEach(x => {x.addEventListener("input", () => {
			moTransform(mo, x.value, undefined, false)})})
	}
	// keys
	if(mo.mo.querySelector("[data-mo-key]")) {
		mo.keys = [];
		let x = moToArray(mo.mo.querySelectorAll("[data-mo-key]"));
		x.forEach(y => {
			let z = {"key": y.getAttribute("data-mo-key"), "preventdefault": false, "target": ""}
			if(z.key.includes("*")) {z.key = z.key.replace("*", ""); z.preventdefault = true}
			if(y.hasAttribute("data-mo-target")) {z.target = y.getAttribute("data-mo-target")}
			mo.keys.push(z)
		})
	}
	// setup
	if(mo.hasOwnProperty("cont")) {
		moTransform(mo, undefined, undefined, false);
		moGestures(mo);
	}
	if(mo.hasOwnProperty("ui")) {moUIFade(mo)}
	if(mo.mo.querySelector("[data-mo-action]")) {moActions(mo)}
});
document.addEventListener("keydown", moKeydown);
document.body.style.overflowY = "hidden";

console.log(moRef);