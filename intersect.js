"use strict";

var failCases = {},
    style1 = { fillColor: null, strokeColor: new paper.Color(0,0,0) },
    style2 = { strokeColor: new paper.Color(1,0,0), fillColor: new paper.Color(1,0,0, 0.4) },
    style3 = { fillColor: null, strokeColor: new paper.Color(0,0,0, 0.4) },
    mouseTarget, boolTarget;

var cases = [
    {
        name: "cuvLine1" ,
        op1: [359, 227.2, 359, 227.2, 317.8, 227.2, 317.8, 227.2],
        op2 : [329.8, 227.2, 333.76, 224.65333333333334, 338.2633333333333, 222.63666666666666, 343.31, 221.15]
    },{ 
        name: "cuvLine2" ,
        op1: [359, 227.2, 359, 227.2, 317.8, 227.2, 317.8, 227.2],
        op2 : [320.55, 236.51, 322.75, 232.85, 325.83333333333337, 229.74666666666667, 329.8, 227.2]
    },{
        name: "cuvCrv1" ,
        op1: [336.2, 283, 329.8, 284.73333333333335, 322.40000000000003, 286.06666666666666, 314, 287],
        op2: [337.03, 302.3, 335.65, 291.99333333333334, 335.37333333333333, 281.87666666666667, 336.2, 271.95]
    },{
        name: "cuvCrv2" ,
        op1: [380.3, 340.47, 377.09333333333336, 340.47, 373.6333333333333, 340.09000000000003, 369.92, 339.33],
        op2: [375.4, 340.4, 375.4, 331.3333333333333, 374.3333333333333, 322.40000000000003, 372.2, 313.6]
    },{
        name: "cuvLine3" ,
        op1: [283.8, 257.2, 283.8, 257.2, 283.8, 388.8, 283.8, 388.8] ,
        op2: [283.8, 369.27, 281.31333333333333, 369.27, 278.55, 369.08666666666664, 275.51, 368.72]
    },{
        name: "cuvLine4" ,
        op1: [283.8, 257.2, 283.8, 257.2, 283.8, 388.8, 283.8, 388.8] ,
        op2: [290.81, 368.65, 288.78999999999996, 369.06333333333333, 286.4533333333333, 369.27, 283.8, 369.27]
    },{
        name: "crvCrv5" ,
        op1: [65, 84.01923788646684, 41.85647706742884, 70.60896681634848, 46.06357670187707, 9.9097745066403, 50, 10],
        op2: [50, 10, 53.93642329812293, 10.0902254933597, 57.70738560935264, 70.88568726997896, 34.999999999999986, 84.01923788646684]
    }
];

window.onload = function(){
    if (__options)
        __options.nativeContains = true;
    // paper.install(window);
    paper.setup(document.getElementById("cvs"));

    mouseTarget =paper.project.layers[0];
    boolTarget = new paper.Layer();

    var list = document.getElementById('list'), liEl, aEl;

    for (var i = 0; i < cases.length; i++)
        failCases[cases[i].name] = cases[i];
    
    var names = Object.keys(failCases);
    for (var i = 0; i < names.length; i++) {
        aEl = document.createElement("A");
        aEl.appendChild(document.createTextNode(names[i]));
        liEl = document.createElement("LI");
        liEl.appendChild(aEl);
        list.appendChild(liEl);
    }

    list.addEventListener("click", function(e){
        var thisEl = e.target, caseTag = thisEl.childNodes[0].nodeValue;
        var activeEl = document.querySelectorAll("a.active"), el;
        for (el in activeEl)
            activeEl[el].className = "";
        thisEl.className = "active";

        doCase(failCases[caseTag]);
    }, false);

};


function doCase (fcase) {
    var ch = mouseTarget.children.concat(boolTarget.children);
    for (var i = ch.length - 1; i >= 0; i--)
        ch[i].remove();

    mouseTarget.activate();
    var op1 = makePath(fcase.op1);
    // op1.reverse()
    markPoints(getSegments(op1), null, "#00f", 0.5);
    var op2 = makePath(fcase.op2);
    // op2.reverse()
    markPoints(getSegments(op2), null, "#0f0", 0.5);
    op1.style = op2.style = style3;
    boolTarget.activate();
    var res = [];
    Curve.getIntersections(op1.curves[0].getValues(), op2.curves[0].getValues(), op1.curves[0], op2.curves[0], res);
    // Curve.getIntersections(fcase.op1, fcase.op2, op1.curves[0], op2.curves[0], res);
    res.map(function(a) {console.log(a._parameter, a._parameter2)});
    markPoints(res, null, "#f00", 2);
    paper.view.draw();
}

// make a Path or a CompoundPath using an SVG style encoded path data
var getPath = function(data) {
    // Get the path data, and determine whether it is a compound path or a
    // normal path based on the amount of moveTo commands inside it.
    var path = data.match(/m/gi).length > 1
                ? new paper.CompoundPath()
                : new paper.Path();
    path.setPathData(data);
    return path;
};

function makePath(v) {
    return new paper.Path(new paper.Segment([v[0], v[1]], null, [v[2]-v[0], v[3]-v[1]]),
                new paper.Segment([v[6], v[7]], [v[4]-v[6], v[5]-v[7]], null));
}


function getSegments(p) {
    var paths = (p instanceof CompoundPath)? p.children : [p], segments = [];
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
    var point = new Point(e.clientX, e.clientY), 
        delta = (e.deltaY || (e.wheelDeltaY/3)) | 0,
        modDelta = Math.abs(delta),
        signDelta = delta < 0 ? -1 : 1,
        scale = 1 + signDelta * map(modDelta, 0, 10, 0, 0.1);
    mouseTarget.scale(scale, point);
    boolTarget.scale(scale, point);
    paper.view.draw();
}

// Map val in range to domain
function map (val, minR, maxR, minD, maxD) {
    val = val > maxR ? maxR : (val < minR ? minR : val);
    return minD + (val - minR) * (maxD - minD) / (maxR - minR);
}


var moveTool = new Tool(), currentItem;
moveTool.onMouseDown = function(event) {
    var hr = mouseTarget.hitTest(event.point, {stroke: true, fill: true});
    if(hr && hr.item){
        currentItem = hr.item;
        if(hr.location){
            console.log(hr.location.curve.getValues());
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

    // console.log(event);

    switch(event.key){
        case 'a':
        case 'e':
            currentItem = mouseTarget.children[0].children[event.key];
            break;
        case 'space':
            operation = ops[operation];
            doBoolean();
            break;
        case 'enter':
            console.log(glyA.parent.exportJSON());

        case 'shift':
            break;
    }
};


// ================================================================
// Timing and debug

function markPoint(pnt, t, c, r) {
    if (!pnt) return;
    if (pnt.point) pnt = pnt.point;
    c = c || '#000';
    r = r || 1;
    var cir = new Path.Circle(pnt, r);
    cir.style.fillColor = c;
    if (t !== undefined && t !== null) {
        var text = new PointText(pnt.add([0, -3]));
        text.justification = 'center';
        text.fillColor = c;
        text.content = t;
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

