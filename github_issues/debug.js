"use strict";

var failCases = {}, 
    style1 = { fillColor: null, strokeColor: new paper.Color(0,0,0) },
    style2 = { strokeColor: new paper.Color(1,0,0), fillColor: new paper.Color(1,0,0, 0.4) },
    style3 = { fillColor: null, strokeColor: new paper.Color(0,0,0, 0.4) },
    style4 = { fillColor: new paper.Color(0,0,0, 0.4), strokeColor: null },
    styleWindPath = { strokeColor: new paper.Color(0,0,0, 0.4) },
    stylePoints = {fillColor: new paper.Color(0, 0, 0)},
    styleHi = { strokeColor: new paper.Color(0,0,1), strokeWidth: 1.5 },
    mouseTarget, boolTarget, tmpTarget,
    oPath, bPath;

function makePath(v) {
    return new paper.Path(new paper.Segment([v[0], v[1]], null, [v[2]-v[0], v[3]-v[1]]),
                new paper.Segment([v[6], v[7]], [v[4]-v[6], v[5]-v[7]], null));
}

// window.onload = function(){
//     // __options.nativeContains = true;
//     // paper.install(window);
//     paper.setup(document.getElementById("cvs"));

//     mouseTarget =paper.project.layers[0];
//     boolTarget = new paper.Layer();
//     tmpTarget = new paper.Layer();

//     var list = document.getElementById('list'), liEl, aEl;

//     // loadJSON("out/intersection-fail.json", function(data){
//     loadJSON("out/union-fail.json", function(data){
//         for (var i = 0; i < data.cases.length; i++)
//             failCases[data.cases[i].name] = data.cases[i];

//         var names = Object.keys(failCases);
//         for (var i = 0; i < names.length; i++) {
//             aEl = document.createElement("A");
//             aEl.appendChild(document.createTextNode(names[i]));
//             liEl = document.createElement("LI");
//             liEl.appendChild(aEl);
//             list.appendChild(liEl);
//         }

//         list.addEventListener("click", listSelect, false);

//         listSelect(null, document.querySelectorAll("#list > li")[0]);
//     }, function(xhr){
//         console.error(xhr);
//     });

// };

// function listSelect(e, target){
//     var thisEl = e ? e.target : target.childNodes[0],
//         caseTag = thisEl.childNodes[0].nodeValue,
//         activeEl = document.querySelectorAll("li.active"), el;
//     for (el in activeEl)
//         activeEl[el].className = "";
//     thisEl.parentNode.className = "active";
//     thisEl.parentNode.scrollIntoViewIfNeeded();

//     doCase(failCases[caseTag]);
// }

// function doCase (fcase) {
//     drawSlopes(null, null, true);
//     mouseTarget.activate();
//     var ch = mouseTarget.children.concat(boolTarget.children);
//     for (var i = ch.length - 1; i >= 0; i--)
//         ch[i].remove();

//     boolTarget.activate();
//     var op1 = getPath(fcase.op1);
//     // markPoints(getSegments(op1), null, "#00f", 0.5);
//     var op2 = getPath(fcase.op2);
//     // markPoints(getSegments(op2), null, "#0f0", 0.5);
//     op1.style = op2.style = style3;
//     // var resOriginal = getPath(fcase.res);
//     // resOriginal.style = style4;
//     var fn = fcase.fn, res;
//     if(fn === "subtract")
//         res = op2[fn](op1);
//     else
//         res = op1[fn](op2);
//     res.style = style2;

//     tmpTarget.addChild(op1);
//     tmpTarget.addChild(op2);
//     var cp = op1[fn](op2, true);
//     tmpTarget.addChild(cp);
//     annotate2(cp, false, 0.1);
//     oPath = cp;

//     mouseTarget.activate();
//     // mouseTarget.addChild(op1);
//     // mouseTarget.addChild(op2);
//     cp = op1[fn](op2, true);
//     cp.style = style3;
//     boolTarget.addChild(cp);
//     annotate2(cp, false, 0.1);
//     bPath = cp;

//     op1.remove();
//     op2.remove();

//     paper.view.draw();
// }


function markWinding(p1, p2, fn) {
    p1 = p1.clone();
    p2 = p2.clone();
    p1.style = p2.style = null;
    p1.translate([300, 0]);
    p2.translate([300, 0]);
    var p = p1[fn](p2, true);
    p.style = styleWindPath;

    var crvs = p.getCurves();

    if(!annotateLayer){
        mainLayer = paper.project.layers[0];
        annotateLayer = new paper.Layer();
    }

    testWinding(p, p1);
}

// make a Path or a CompoundPath using an SVG style encoded path data
var getPath = function(data) {
    if (data === "")
        return new paper.Path();
    // Get the path data, and determine whether it is a compound path or a
    // normal path based on the amount of moveTo commands inside it.
    var path = data.match(/m/gi).length > 1
                ? new paper.CompoundPath()
                : new paper.Path();
    path.setPathData(data);
    return path;
};


function getSegments(p) {
    var paths = (p instanceof paper.CompoundPath)? p.children : [p], segments = [];
    paths.reduce(function(seg, a){ Array.prototype.push.apply(seg, a.getSegments()); return seg; }, segments);
    return segments;
}

// Scroll to zoom
window.onwheel = document.onwheel = scrollToZoom; // w3c, Gecko, IE9+
window.onmousewheel = document.onmousewheel = scrollToZoom; // Webkit, non-standard
function scrollToZoom(e) {
    if(e.target.nodeName.toLowerCase() !== 'canvas')
        return;
    e.preventDefault();
    var point = new paper.Point(e.clientX, e.clientY), 
        delta = (e.deltaY || (e.wheelDeltaY/3)) | 0,
        modDelta = Math.abs(delta),
        signDelta = delta < 0 ? -1 : 1,
        scale = 1 + signDelta * map(modDelta, 0, 10, 0, 0.1);
    mouseTarget.scale(scale, point);
    boolTarget.scale(scale, point);
    // tmpTarget.scale(scale, point);
    if(window.annotateLayer){
        annotateLayer.scale(scale, point);
        monCrvs.length = 0;
        annotate(pathMain, true);
    }
    paper.view.draw();
}

// Map val in range to domain
function map (val, minR, maxR, minD, maxD) {
    val = val > maxR ? maxR : (val < minR ? minR : val);
    return minD + (val - minR) * (maxD - minD) / (maxR - minR);
}


var moveTool = new paper.Tool(), currentItem;
moveTool.onMouseDown = function(event) {
    // var hr = mouseTarget.hitTest(event.point, {stroke: true, fill: true});
    var hr = bPath.hitTest(event.point, {stroke: true, fill: true});
    // var hr = boolTarget.hitTest(event.point, {stroke: true, fill: true});
    if(hr && hr.item){
        currentItem = hr.item;
        if(hr.location){
            var crvs = hr.location.curve._path._parent.curves,
                index = crvs.indexOf(hr.location.curve),
                crv = oPath.curves[index];
            window.__checkPoint = crv.getPointAt(0.5, true);
            window.__crv = crv.getValues();
            console.log(crv.getPointAt(0.5, true), crv.length, crv._getWinding());
            // console.log(crv.getValues(), crv.length, crv._getWinding());
        }
        if(currentItem.parent && currentItem.parent instanceof CompoundPath){
            currentItem = currentItem.parent;
        }
    }
}
moveTool.onMouseUp = function(event) {
    currentItem = null;
}

moveTool.onMouseDrag = function(event) {
    if(currentItem){
        currentItem.translate(event.delta);
    }
};

moveTool.onKeyDown = function(event) {
    event.event.preventDefault();
    switch(event.key){
        case 'up':
            var els = document.querySelectorAll("#list > li");
            if(els && els.length){
                for (var i = 0; i < els.length; i++)
                    if(els[i].className === 'active')
                        break;
                if(i > 0)
                    listSelect(null, els[i-1]);
            }
            break;
        case 'down':
            var els = document.querySelectorAll("li.active + li");
            if(els && els.length)
                listSelect(null, els[0]);
            break;
    }
};


// ================================================================
// Timing and debug

function markPoint(pnt, t, c, r) {
    if (!pnt) return;
    if (pnt.point) pnt = pnt.point;
    c = c || '#000';
    r = r || 0.05;
    var cir = new paper.Path.Circle(pnt, r);
    cir.style.fillColor = c;
    if (t !== undefined && t !== null) {
        var text = new paper.PointText();
        text.justification = 'center';
        text.fillColor = c;
        text.content = t;
        text.fontSize = 0.5;
        text.point = pnt.subtract([0, text.bounds.height]);
    }
}

function markPoints(pnts, t, c, r) {
    pnts.map(function(a){ markPoint(a, t, c, r) });
}

/**
 * http://stackoverflow.com/questions/6875625/does-javascript-provide-a-high-resolution-timer
 */
if (window.performance && window.performance.now) {
  console.log("Using high performance timer");
  window.getTimestamp = function() { return window.performance.now(); };
} else {
  if (window.performance && window.performance.webkitNow) {
    console.log("Using webkit high performance timer");
    window.getTimestamp = function() { return window.performance.webkitNow(); };
  } else {
    console.log("Using low performance timer");
    window.getTimestamp = function() { return new Date().getTime(); };
  }
}

function loadJSON(path, success, error)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 0) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

function valsEq(v1, v2){
    var eq = true;
    for (var i = 0; i < 8; i++) {
        eq = eq && (Math.abs(v1[i] - v2[i]) < 1);
    }
    return eq;
}


function annotate2(path, clear, r){
    clear = true;
    if (!path)
        return;
    r = r || 1;
    var crvs = path.getCurves(), i, li,
        segs = getSegments(path), p1,
        crv, ncrv, p, p2, n, windLeft = path.isClockwise() ? -1 : 1;

    // if(clear)
    //     for (i = mouseTarget.children.length - 1; i >= 0; i--)
    //         mouseTarget.children[i].remove();

    // console.time("wind");
    for (i = 0, li = crvs.length; i < li; i++) {
        crv = crvs[i];
        p1 = new paper.Path.Circle(crv.getSegment1().point, r);
        p1.style = stylePoints;

        // var crss = pathMain._getWinding(segs[i].getCurve().getSegment1().getPoint());
        var crss = crvs[i]._getWinding();
        // var crss = getWindingContribution(segs[i].getCurve(), crvs);

        p = crv.getPoint(0.55);
        n = crv.getNormal(0.5).normalize(windLeft);
        p2 = p.add(n);
        text(p2, crss);
        // n = crv.getNormal(0.5).normalize(windLeft * -5);
        // p2 = p.add(n).subtract([3.5, -3.5]);
        // text(p2, (crss-1));
    }
}

function pathFromCurve(crv) {
    mouseTarget.activate();
    var p = new paper.Path(crv.getSegment1(), crv.getSegment2());
    boolTarget.activate();
    return p;
}

function text(p, s, c){
    var txt = new paper.PointText([0,0]);
    txt.fillColor = c || new paper.Color(0,0,0,0.4);
    txt.content = s;
    txt.fontSize = 2;
    txt.point = p.subtract(txt.bounds.center);
    return txt;
}

function hilightCrv(c, dontClear){ 
    window.__Crvs = window.__Crvs || [];
    if (!dontClear)
        for (var i = window.__Crvs.length - 1; i >= 0; i--) {
            window.__Crvs[i].remove();
        }
    if(c) {
        if(c[0]){
            var v = c;
            c = new paper.Curve(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);
        }
        c = pathFromCurve(c);
        c.style = styleHi;
        window.__Crvs.push(c);
    }
    paper.view.draw();
}

function drawSlopes(pnt, vec, clear) {
    window.__slopes = window.__slopes || [];
    if (clear)
        for (var i = window.__slopes.length - 1; i >= 0; i--) {
            window.__slopes[i].remove();
        }
    if (pnt) {
        var l = new paper.Path.Line(pnt, pnt.add(vec));
        l.style = style1;
        window.__slopes.push(l);
    }
    paper.view.draw();
}