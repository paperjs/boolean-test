
/**
 * Utilities singleton
 */
var Utils = function(){
    var fs = require("fs");
    var colors = require('colors');

    // a function to load json data from a file
    // from http://blog.gvm-it.eu/post/8175813806/node-js-0-5-2-load-json-files-with-require
    this.loadJSONfile = function(filename, encoding) {
        try {
            // default encoding is utf8
            if (typeof (encoding) == 'undefined') encoding = 'utf8';
            // read file synchroneously
            var contents = fs.readFileSync(filename, encoding);
            // parse contents as JSON
            return JSON.parse(contents);
        } catch (err) {
            // an error occurred
            throw err;
        }
    }

    this.log = function(msg, ns, status) {
        if(ns){
            if(status === "pass")
                ns = "[" + ns.green + "]";
            else if(status === "fail")
                ns = "[" + ns.red + "]";
            else
                ns = "[" + ns.yellow + "]";
        } else
            ns = "[" +  "test".blue + "]";
        console.log(ns, msg);
    };

    // A convenience object with nanosecond resolution timer
    this.timer = (function(){
        function Timer(){
            this._timers = {};

            this.start = function(name) {
                this._timers[name] = process.hrtime();
            };

            this.end = function(name, type){
                if(!name || !this._timers[name])
                    return 0;

                var diff = process.hrtime(this._timers[name]);

                type = type || "ns";
                var ns = diff[0] * 1e9 + diff[1], ret;
                if(type === "us")
                    ret = ns / 1e3;
                else if(type === "ms")
                    ret = ns / 1e6;
                else if(type === "s")
                    ret = ns / 1e9;
                else
                    ret = ns;

                this._timers[name] = undefined;
                return ret;
            };
        }

        return new Timer();
    }());

    this.progress = (function() {
        var readline = require('readline');

        function Progress() {
            var rl, _total, _name;
            // Setup a new progress bar
            this.setup = function(name, total) {
                rl = readline.createInterface({
                  input: process.stdin,
                  output: process.stdout
                });
                // Set a blank prompt
                rl.setPrompt("", 0);
                _total = total;
                _name = name;
                rl.write("[" + "0".yellow + "/" + _total.toString().yellow + "]");
            };
            // Update the progress display
            this.update = function(done, passed, failed){
                if(!process.stdout.isTTY)
                    return;
                var wid = 20,
                    progs = Math.floor(done * wid / _total),
                    str = "", i;
                // Prepare the progress
                for (i = 0; i < progs; i++)
                    str += "=";                
                for (i = progs; i < wid; i++)
                    str += " ";
                // Clear the line
                rl.write(null, {ctrl: true, name: 'u'});
                rl.write("[" + _name.yellow + "] " + passed.toString().green + ", " +
                        failed.toString().red + " [" + str.yellow + "] " +
                        done.toString().yellow + "/" + _total.toString().yellow);
            };
            // Call this function to finish up and free stdin & stdout
            this.close = function(){
                rl.resume();
                rl.write(null, {ctrl: true, name: 'u'});
                rl.close();
            };
        }

        return new Progress();
    }());

    // make a Path or a CompoundPath using an SVG style encoded path data
    this.getPath = function(paper, data) {
        if(!data) return new paper.Path();
        // Get the path data, and determine whether it is a compound path or a
        // normal path based on the amount of moveTo commands inside it.
        var path = data.match(/m/gi).length > 1
                    ? new paper.CompoundPath()
                    : new paper.Path();
        path.setPathData(data);
        return path;
    };
};


exports.Utils = new Utils();