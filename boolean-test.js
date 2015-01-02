
var utils = require("./utils.js").Utils;
var paper = require("./paperjs/src/load.js");
var colors = require('colors');
var fs = require("fs");

var precision = {
    point: 0.01,
    area: 20,
    bitmap: 20
};

var testModes = {
    paths: false,
    curves: false,
    area: true,
    bitmap: true
};

var width = 600, height = 600;
var canvas = new paper.Canvas(width, height);
var ctx = canvas.getContext("2d");

paper.setup(canvas);

var fname = "", fSplit = /(\\|\/)?(.*(\\|\/))*(.*).json/i,
    testName, suit, testCount, timeDiff, fn,
    casesDone = 0, casesPassed = 0, casesFailed = 0,
    i, j, li, lj, cases, tCase, op1, op2, res, resOriginal,
    testResult = {}, testRunCount = 0, boolTime = 0, txt,
    // Define styles for previewing
    style1 = { fillColor: null, strokeColor: new paper.Color(0,0,0) },
    style2 = { strokeColor: new paper.Color(1,0,0), fillColor: new paper.Color(1,0,0, 0.4) },
    styleBlack = { strokeColor: null, fillColor: new paper.Color(0,0,0) },
    styleNull = { strokeColor: null, fillColor: null },
    // Export failed cases
    failCases = { cases: [] };

// Process args
if(process.argv.length < 3){
    console.log("Usage : node boolean-test.js <filename> [options]")
    return;
}

var fname = "/" + process.argv[2];
testName = fSplit.exec(fname)[4];

// Load the test suit
utils.log("Loading test suit \"" + testName + "\"...");
utils.timer.start("load");
suit = utils.loadJSONfile(__dirname + fname);
fn = suit.fn;
suit = suit.tests;
timeDiff = utils.timer.end("load", "ms").toFixed(1);
// Find the cumulative test count
testCount = suit.reduce(function(sum, a){ return sum + a.cases.length }, 0);
utils.log(testCount + " tests loaded from test suit \"" + testName + "\"; in " + timeDiff + " ms.");

console.log();
utils.log("Testing paperjs " + fn + " operator.", testName);


// begin the actual test
// TODO: modularize!
utils.progress.setup(testName, testCount);
utils.timer.start("test");
var vectorTest, rasterTest;
for (i = 0, li = suit.length; i < li; i++) {
    op1 = utils.getPath(paper, suit[i].op1);
    cases = suit[i].cases;
    // console.log(suit[i].name);
    for (j = 0, lj = cases.length; j < lj; j++) {
            // DEBUG:============================================================
            // console.log(cases[j].name);
            // DEBUG:============================================================
        tCase = cases[j];
        op2 = utils.getPath(paper, tCase.op2);
        resOriginal = utils.getPath(paper, tCase.res);

        // Perform the paperjs boolean op
        utils.timer.start("bool");
        if(fn === "subtract")
            res = op2[fn](op1);
        else
            res = op1[fn](op2);
        boolTime += utils.timer.end("bool", "ms");

        ++casesDone;
        vectorTest = compare(res, resOriginal, precision, testResult);
        rasterTest = testRasterArea();
        if(vectorTest && rasterTest)
            ++casesPassed;
        else{
            ++casesFailed;
            // Save this failed cases
            failCases.cases.push({
                "name" : suit[i].name + "_" + tCase.name,
                "fn" : fn,
                "op1" : suit[i].op1,
                "op2" : tCase.op2,
                "res" : tCase.res,
            });
            // Save a preview file of the failed case
            resOriginal.style = style1;
            res.style = style2;
            txt = new paper.PointText([10, 20]);
            txt.content = (testModes.paths ? "children: " + testResult.child + "(" + testResult.ch1 + ", " + testResult.ch2 + ")" : "") +
                    (testModes.curves ? ", curves: " + testResult.curves : "") +
                    (testModes.area ? ", area: " + testResult.area : "");
            txt.fillColor = "#000";
            paper.view.draw();
            fs.writeFileSync(__dirname + "/out/test_" + testName + "_" + suit[i].name + "_" + tCase.name + ".png", canvas.toBuffer());
            if(testModes.bitmap)
                testRasterArea(__dirname + "/out/test_" + testName + "_" + suit[i].name + "_" + tCase.name + "_v.png", canvas.toBuffer());
            txt.remove();
        }
        // console.log(testResult);

        ++testRunCount;
        op1.remove();
        op2.remove();
        res.remove();
        resOriginal.remove();
        utils.progress.update(casesDone, casesPassed, casesFailed);
    }
}
timeDiff = formatTimeIvl(utils.timer.end("test", "ms"));
utils.progress.close();

// Save the failed cases to disk, if any.
if(failCases.cases.length){
    if(testName)
        fs.writeFileSync(__dirname + "/out/" + testName + "-fail.json", JSON.stringify(failCases));
}

// Print the test report
console.log();
console.log("  Test Report         [" + testName + "]");
console.log("----------------------------------------------------");
console.log("  Tests run         - " + testRunCount.toString());
console.log("  Tests passed      - " + casesPassed.toString().green + " " + (casesPassed * 100.0/testRunCount).toFixed(1) + "%");
console.log("  Tests failed      - " + casesFailed.toString().red + " " + (casesFailed * 100.0/testRunCount).toFixed(1) + "%");
console.log();
console.log("  Elapsed           - " + timeDiff);
console.log("  Boolean op. time  - " + formatTimeIvl(boolTime));
console.log("  Boolean avg. time - " + formatTimeIvl(boolTime / testRunCount));
console.log();
// --END--

// Compare raster
function testRasterArea(saveFileName) {
    if (!testModes.bitmap)
        return true;

    res.style = resOriginal.style = styleNull;
    paper.view.draw();
    ctx.antialias = 'none';
    resOriginal.style = res.style = styleBlack;
    res.blendMode = 'xor';
    paper.view.draw();
    // Accumulated pixels
    var cumul = 0;
    // Run the test
    if(!saveFileName){
        var image = ctx.getImageData(0, 0, width, height),
            pixels = image.data, cw = image.width * 4, ch = image.height,
            imgi, imgj;
        for (imgj = 0; imgj < ch; imgj++) {
            var pixrow = imgj * cw;
            for (imgi = 0; imgi < cw; imgi += 4) {
                if(pixrow[pixrow + imgi])
                    ++cumul;
            }
        }
    } else
        // Save the bitmap
        fs.writeFileSync(saveFileName, canvas.toBuffer());

    // Reset the default values
    ctx.antialias = 'default';
    res.blendMode = 'normal';

    return cumul < precision.bitmap;
}

// Compare two paths
function compare(p1, p2, precision, results) {
    var eqChild = false, eqCurves = false, eqArea = false,
        ch1 = p1 instanceof paper.CompoundPath ? p1.children.length : 1,
        ch2 = p2 instanceof paper.CompoundPath ? p2.children.length : 1,
        crv1 = p1.getCurves(), crv2 = p2.getCurves(),
        a1 = Math.abs(p1.getArea()) | 0, a2 = Math.abs(p2.getArea()) | 0;

    eqChild = ch1 === ch2;
    eqCurves = crv1.length === crv2.length;
    eqArea = Math.abs(a1 - a2) < precision.area;

    if (results){
        results.child = eqChild;
        results.ch1 = ch1;
        results.ch2 = ch2;
        results.curves = eqCurves;
        results.area = eqArea;
    }

    return (!testModes.paths || eqChild) && (!testModes.curves || eqCurves) && (!testModes.area || eqArea);
}

function formatTimeIvl(tms) {
    var ts = 0, tm = 0;
    if (tms > 1000){
        ts = (tms / 1000.0) | 0;
        tms -= ts * 1000;
    }
    if (ts > 60){
        tm = (ts / 60.0) | 0;
        ts -= tm * 60;
    }
    return tm + " : " + ts + " : " + tms.toFixed(1);
}
