"use strict";
var DEBUG = false,
	debugLevel = 0;
const Verb = process.argv[2];
const Root = process.argv[3].replace("/", "\\") + "\\";
const Params = process.argv.slice(4);
var chokidar = require('chokidar'),
    autoprefixer = require('autoprefixer'),
    postcss = require('postcss'),
    nodeSass = require('node-sass'),
    babel = require('babel-core'),
    htmlminify = require('html-minifier').minify,
    fs = require('fs'),
    walk = require('walk'),
    path = require('path');
var DirParams = [],
	IgnoredDirs = [],
	CompileOnRun = false,
	WatchedFiles = [],
	CheckNewFiles = 0;
var sc;
const flags = {
	"ignore": (args) => {
		Array.prototype.push.apply(IgnoredDirs, args);
	},
	"check": (args) => {
		CheckNewFiles = 1000 * parseInt(args[0]);
	},
	"debug": (args) => {
		DEBUG = true;
		debugLevel = parseInt(args[0]) || 0;
	},
	"compileonrun": () => {
		CompileOnRun = true;
	}
}
// ObjectClone
function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}
// Simple console manager class so that console.log doesn't print ontop of
// another console log when multiple lines of asyncronous code are logging shit
// to the console
class ConsoleManager {
	log() {
		// Log the message as it's given, not as it will be once logged
		let args = [];
		for(let a of arguments){
			args.push(clone(a));
		}
		this.queue.push(args);
	}
	flush() {
		if(this.flushLock)
			return;
		this.flushLock = true;
		this.pauseInterval = true;
		for(let i = 0, l = this.queue.length; i < l; i++){
			console.log.apply(this, this.queue[i]);
		}
		this.queue = [];
		this.flushLock = false;
		this.pauseInterval = false;
	}
	flushSlow(cb){
		if(this.flushLock)
			return;
		this.flushLock = true;
		this.pauseInterval = true;
		let f = () => {
			if(this.queue.length > 0){
				console.log.apply(this, this.queue[0]);
				this.queue.shift();
				setTimeout(f, 20);
			} else {
				this.flushLock = false;
				this.pauseInterval = false;
				cb();
			}
		}
		setTimeout(f, 40); // 20 still sometimes prints 2 messages on the same line, 40 is better
	}
	warn(){
		let args = [];
		args.push(Color.TextBlack + Color.BgYellow + " Warning " + Color.Reset + Color.TextYellow);
		for(let a of arguments){
			args.push(clone(a));
		}
		args.push(Color.Reset);
		this.queue.push(args);
	}
	constructor(interval){
		this.queue = [];
		this.pauseInterval = false;
		setInterval(()=>{
			if(this.pauseInterval)
				return;
			if(this.queue.length > 0){
				console.log.apply(this, this.queue[0]);
				this.queue.shift();
			}
		}, interval ? interval : 40);
	}
}
const Console = new ConsoleManager();
// Simple class to change the colors for command prompt, need to add bash support at some point
class ConsoleColor {
	constructor() {
		this.Reset = "\x1b[0m";
		this.Bright = "\x1b[1m";
		this.Dim = "\x1b[2m";
		this.Underscore = "\x1b[4m";
		this.Blink = "\x1b[5m";
		this.Reverse = "\x1b[7m";
		this.Hidden = "\x1b[8m";

		this.TextBlack = "\x1b[30m";
		this.TextRed = "\x1b[31m";
		this.TextGreen = "\x1b[32m";
		this.TextYellow = "\x1b[33m";
		this.TextBlue = "\x1b[34m";
		this.TextMagenta = "\x1b[35m";
		this.TextCyan = "\x1b[36m";
		this.TextWhite = "\x1b[37m";

		this.BgBlack = "\x1b[40m";
		this.BgRed = "\x1b[41m";
		this.BgGreen = "\x1b[42m";
		this.BgYellow = "\x1b[43m";
		this.BgBlue = "\x1b[44m";
		this.BgMagenta = "\x1b[45m";
		this.BgCyan = "\x1b[46m";
		this.BgWhite = "\x1b[47m";
	}
}
const Color = new ConsoleColor();
class stackCompiler{
	// File Updating
	sassUpdate(file, callback) {
		// TODO: Coordinate sync...
	    // compile sass
	    let sass = fs.readFileSync(file, 'utf8');
		if (/^\s+$/.test(sass) || sass == "")
		{
			// string contains only whitespace
			// prevent bug with feeding node-sass empty strings
			let out = DirParams.length == 5 ? Root + "\\" + DirParams[1] + "\\" : path.dirname(file) + "\\";
			fs.writeFile(out + path.basename(file).split(".")[0] + ".css", "", (err) => {
				if (err){
					callback(err);
					throw err;
				}
				Console.log(Color.TextGreen + Color.Bright + "\tUpdated" + Color.Reset, file.replace(Root, "").replace(/\\+/gi, "\\"), ">", (out + path.basename(file).split(".")[0] + ".css").replace(Root, "").replace(/\\+/gi, "\\").replace(/^\\/i,""));
				Console.log(Color.TextYellow + "\t\tNotice: Empty file" + Color.Reset);
				callback();
			});
		} else {
			// procede normally
			let css;
			try {
				css = nodeSass.renderSync({
					data: sass,
					outputStyle: "compressed"
				});
			} catch(err) {
		        Console.log("\t" + Console.BgRed + Console.TextBlack + err);
				callback();
		        return;
		    }
		    // auto-prefix
		    postcss([autoprefixer]).process(css.css.toString()).then((result) => {
		        result.warnings().forEach((warn) => {
		            Console.warn(warn.toString());
		        });
				let compressedCss = result.css;
		        // write
				// If it's 5-args, then output to the out dir. Otherwise output to the same dir as the file
				let out = DirParams.length == 5 ? Root + "\\" + DirParams[1] + "\\" : path.dirname(file) + "\\";
		        fs.writeFile(out + path.basename(file).split(".")[0] + ".css", compressedCss, (err) => {
					if (err){
						callback(err);
						throw err;
					}
		            Console.log(Color.TextGreen + Color.Bright + "\tUpdated" + Color.Reset, file.replace(Root, "").replace(/\\+/gi, "\\"), ">", (out + path.basename(file).split(".")[0] + ".css").replace(Root, "").replace(/\\+/gi, "\\").replace(/^\\/i,""));
					callback();
		        });
		    });
		}
	}
	jsUpdate(file, callback) {
		let sourceMap = Verb == "compile" ? false : true;
	    let code = fs.readFileSync(file, 'utf8');
	    let compiled = NaN;
	    try {
	        compiled = babel.transform(code, {
	            presets: ["es2015", "babili"],
	            babelrc: false,
	            minified: true,
	            comments: false,
	            sourceMaps: sourceMap,
	            filename: path.basename(file).split(".")[0] + ".js"
	        });
	    } catch(err) {
			callback();
	        Console.log("\t" + err);
	        return;
	    }
		// If it's 5-args, then output to the out dir. Otherwise output to the same dir as the file
		let out = DirParams.length == 5 ? Root + "\\" + DirParams[3] + "\\" : path.dirname(file) + "\\";
		if(sourceMap) {
			fs.writeFile(out + path.basename(file).split(".")[0] + ".js.map", JSON.stringify(compiled.map), (err) => {
				if (err){
					callback();
					throw err;
				}
			});
		}
	    fs.writeFile(out + path.basename(file).split(".")[0] + ".min.js", compiled.code + (sourceMap ? ("\n//# sourceMappingURL=" + path.basename(file).split(".")[0] + ".js.map") : ""), (err) => {
			if (err){
				callback();
				throw err;
			}
	        Console.log(Color.TextGreen + Color.Bright + "\tUpdated" + Color.Reset, file.replace(Root, "").replace(/\\+/gi, "\\"), ">", (out + path.basename(file).split(".")[0] + ".min.js").replace(Root, "").replace(/\\+/gi, "\\").replace(/^\\/i,""));
			callback();
	    });
	}
	htmlUpdate(file, callback){
		// TODO: Babel in html??
	    let code = fs.readFileSync(file, 'utf8');
	    let comp = htmlminify(code, {
	        caseSensitive: true,
	        collapseBooleanAttributes: true,
	        collapseInlineTagWhitespace: true,
	        collapseWhitespace: true,
	        keepClosingSlash: true,
	        minifyCSS: true,
	        minifyJS: true,
	        preventAttributesEscaping: true,
	        removeAttributeQuotes: true,
	        removeComments: true,
	        removeScriptTypeAttributes: true,
	        removeStyleLinkTypeAttribute: true
	    });
		// If it's 5-args, then output to the out dir. Otherwise output to the same dir as the file
		let out = path.dirname(file) + "\\";
	    fs.writeFile(out + (path.basename(file).replace(".max", "")), comp, (err) => {
			if (err){
				callback();
				throw err;
			}
	        Console.log(Color.TextGreen + Color.Bright + "\tUpdated" + Color.Reset, file.replace(Root, "").replace(/\\+/gi, "\\"), ">", (out + path.basename(file).split(".")[0] + ".html").replace(Root, "").replace(/\\+/gi, "\\").replace(/^\\/i,""));
			callback();
		});
	}
	// Find files
	findFiles(ext, dir, updater, extExclude){
		if(DEBUG) {
			Console.log(Color.BgYellow + Color.TextBlack, ext, Color.Reset);
			Console.log(Color.BgYellow + Color.TextBlack, Root + dir, Color.Reset);
		}
		let fileWalker = walk.walk(Root + dir, { followLinks: false }),
			files = [];
		fileWalker.on('file', (root, stat, next) => {
			let toPush = false,
				name = (root + '/' + stat.name).replace(/\//, "\\");
			if(DEBUG && debugLevel == 2){
				Console.log("");
				Console.log(Color.TextCyan, stat.name);
				Console.log(Color.TextCyan, name);
				Console.log(Color.TextCyan, Root + dir + "\\" + IgnoredDirs[0]);
				Console.log(Color.TextCyan, name.replace(/\\+/gi, "\\").indexOf((Root + dir + "\\" + IgnoredDirs[0]).replace(/\\+/gi, "\\")));
			}

			// Because html code looks for .max.html this code has to be used instead of just checking path.extname() against the extentions
			for(let e of ext) {
				let i = stat.name.indexOf(e);
				if(i > -1 && i == stat.name.length - e.length){
					toPush = true;
				}
			}

			// Only need to try exclusions if the file is of the proper extention
			if(toPush){
				// TODO: Optimize indexOf?
				// Don't watch if already being watched
				if(WatchedFiles.indexOf(name) > -1){
					toPush = false;
				}
				// If we're still clear to push then try to exclude more!
				if(toPush){
					// TODO: Optimize indexOf?
					for(let ig of IgnoredDirs){
						if(name.replace(/\\+/gi, "\\").indexOf((Root + dir + "\\" + ig).replace(/\\+/gi, "\\")) > -1){
							// It's in an excluded directory!
							toPush = false;
							break;
						}
					}

					// If we're still clear to push then try to exclude more!
					if(toPush){
						// Excluded extentions
						if(extExclude){
							for(let e of extExclude) {
								let i = stat.name.indexOf(e);
								if(i > -1 && i == stat.name.length - e.length){
									toPush = false;
								}
							}
						}
						// If we're still clear to push then set us to watch the file.
						if(toPush){
							WatchedFiles.push(name);
							files.push(name);
						}
					}
				}
			}
			next();
	    });
		fileWalker.on('end', () => {
			if(DEBUG)
				Console.warn(Color.TextYellow, files, Color.Reset);
			// For ending after all files are compiled
			this.fileFindersCompleted++;
			this.totalFiles += files.length;
			if(DEBUG && debugLevel == 1)
				Console.warn(this.totalFiles);
			for(let file of files){
				if(Verb == "watch") {
					let watcher = chokidar.watch(file);
		            watcher.on('change', (path) => {
		                Console.log("> Change detected to: ", path.replace(Root, "").replace(/\\+/gi, "\\").replace(/^\\/i,""));
		                updater(path, ()=>{});
		            });
				}
	            if(CompileOnRun){
	                updater(file, () => {
						if(Verb == "compile"){
							this.filesInitiallyUpdated++;
							if(this.fileFindersCompleted == this.totalFileFinders && this.filesInitiallyUpdated == this.totalFiles){
								Console.log(Color.TextMagenta + Color.Bright + "\nCompleted Compilation" + Color.Reset);
								// Can afford to flush slowly because since no files will be watched for and no other processes are going on, just waiting to flush
								// I need to slow flush here because of a glitch where new lines aren't printed after console.logs. Could just be a bug on my computer?
								Console.flushSlow(() => {
									// Later, yo
									process.exit(0);
								});
							}
						}
					});
	            }
			}
		});
	}
	checkFiles(){
		// For the compile verb, doesn't matter for watch
		this.totalFiles = 0;
		this.filesInitiallyUpdated = 0;
		this.fileFindersCompleted = 0;
		this.totalFileFinders = 3;
		// Find files
		this.findFiles(
			[".scss"],
			DirParams.length == 1 ? DirParams[0] : (DirParams.length == 3 ? DirParams[0] : /*else length = 5*/ DirParams[0]),
			(file, callback) => { this.sassUpdate(file, callback); });
		this.findFiles(
			[".js", ".ec6"],
			DirParams.length == 1 ? DirParams[0] : (DirParams.length == 3 ? DirParams[1] : /*else length = 5*/ DirParams[2]),
			(file, callback) => { this.jsUpdate(file, callback); }, [".min.js"]);
		this.findFiles(
			[".max.html", ".max.htm"],
			DirParams.length == 1 ? DirParams[0] : (DirParams.length == 3 ? DirParams[2] : /*else length = 5*/ DirParams[4]),
			(file, callback) => { this.htmlUpdate(file, callback); });
	}
	// Initialize
	constructor(){
		// Check for files
		this.checkFiles();
	}
}
function aliveTimeout() {
	// if check then check
	if(CheckNewFiles != 0) {
		sc.checkFiles();
	}
	setTimeout(aliveTimeout, CheckNewFiles || 5000);
}
~function(){
	Console.log(Color.Reverse + " > Init " + Color.Reset);
	// Parse Params
	// First params are dir args, and will be until either there are no more params or the param starts with a '--'
	let i = 0, l = Params.length, p;
	for( ; i < l; i++){
		p = Params[i];
		if(p.indexOf("--") == 0){
			break;
		}
		DirParams.push(p);
	}
	// Add an empty flag to Params to ensure the last flag is invoked
	Params.push("--");
	l++;
	let flag = null;
	let flagArgs = [];
	for(; i < l; i++){
		p = Params[i].toLowerCase();
		if(p.indexOf("--") == 0){
			if(flag != null){
				// Then run last flag with its args
				if(flags[flag] != undefined){
					(flags[flag])(flagArgs); // I would use Function.prototype.apply here however I was running into problems while itterating the arguments inside the function
				}
				// Reset flag Args
				flagArgs = [];
			}
			flag = p.substr(2);
		} else {
			flagArgs.push(p);
		}
	}
	if(Verb == "compile"){
		// Force the CompileOnRun flag
		CompileOnRun = true;
		// If it's a straight compile, then don't check for new files ever
		CheckNewFiles = 0;
	}
	if(DEBUG){
		Console.log(Color.TextCyan, Params, Color.Reset);
		if(IgnoredDirs.length > 0)
			Console.log(Color.TextCyan + "Ignoring:", IgnoredDirs, Color.Reset);
	}

	// Nothing needs to be done, but I'm leaving in the if-else constructs anyway in case I need them in the future
	if(DirParams.length == 1){

	} else if(DirParams.length == 3){

	} else if(DirParams.length == 5){

	} else {
		Console.log(Color.BgRed + Color.TextBlack + "Error:" + Color.Reset + Color.TextRed + " Improper arguments" + Color.Reset);
		Console.flushSlow(() => {
			process.exit(1);
		});
		return; // prevent any further method execution
	}
	sc = new stackCompiler();
	// Timeout keeps the code running, and also checks for new files if enabled
	setTimeout(aliveTimeout, CheckNewFiles || 5000);
}();
// TODO: Soruce maps for everything
// TODO: More Js Optimization?
// TODO: More args and utility
// TODO: PHP?
// TODO: Proper error handling
// TODO: Get rid of unnecessary escapes and reg-exing
