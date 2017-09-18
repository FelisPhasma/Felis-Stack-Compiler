"use strict";
// TODO: Soruce maps
// TODO: Js Optimization
// TODO: More args and diversity
let chokidar = require('chokidar'),
    autoprefixer = require('autoprefixer'),
    postcss = require('postcss'),
    crass = require('crass'),
    nodeSass = require('node-sass'),
    babel = require('babel-core'),
    htmlminify = require('html-minifier').minify,
    fs = require('fs'),
    walk = require('walk'),
    path = require('path');

const Verb = process.argv[2];
const Root = process.argv[3].replace("/", "\\") + "\\";
const Params = process.argv.slice(4);
const CompileOnRun = true;

// Simple console manager class so that console.log doesn't print ontop of
// another console log when multiple lines of asyncronous code are logging shit
// to the console
class ConsoleManager {
	log() {
		this.queue.push(arguments);
	}
	constructor(interval){
		this.queue = [];
		setInterval(()=>{
			if(this.queue.length > 0){
				console.log.apply(this, this.queue[0]);
				this.queue.shift();
			}
		}, interval ? interval : 100);
	}
}
const Console = new ConsoleManager();
class stackCompiler{
	// File Updating
	sassUpdate(file) {
		// TODO: Coordinate sync...
	    // compile sass
	    let sass = fs.readFileSync(file, 'utf8');
	    let css = nodeSass.renderSync({
	        data: sass
	    });
	    // auto-prefix
	    postcss([autoprefixer]).process(css.css.toString()).then((result) => {
	        result.warnings().forEach((warn) => {
	            console.warn(warn.toString());
	        });
	        // minify
	        let parsed = crass.parse(result.css),
	            compressedCss = parsed.toString();
	        // write
			// If it's 5-args, then output to the out dir. Otherwise output to the same dir as the file
			let out = Params.length == 5 ? Root + "\\" + Params[1] + "\\" : path.dirname(file) + "\\";
	        fs.writeFile(out + path.basename(file).split(".")[0] + ".css", compressedCss, (err) => {
	            if (err)
	                throw err;
	            Console.log("\tUpdated ", file, ">", out + path.basename(file).split(".")[0] + ".css");
	        });
	    });
	}
	jsUpdate(file) {
	    let code = fs.readFileSync(file, 'utf8');
	    let compiled = NaN;
	    try {
	        compiled = babel.transform(code, {
	            presets: ["es2015", "babili"],
	            babelrc: false,
	            minified: true,
	            comments: false,
	            sourceMaps: true, //"both",
	            filename: path.basename(file).split(".")[0] + ".js"
	        });
	    } catch(err) {
	        Console.log("\t" + err);
	        return;
	    }
		// If it's 5-args, then output to the out dir. Otherwise output to the same dir as the file
		let out = Params.length == 5 ? Root + "\\" + Params[3] + "\\" : path.dirname(file) + "\\";
	    fs.writeFile(out + path.basename(file).split(".")[0] + ".js.map", JSON.stringify(compiled.map), (err) => {
	        if (err)
	            throw err;
	    });
	    fs.writeFile(out + path.basename(file).split(".")[0] + ".js", compiled.code + "\n//# sourceMappingURL=" + path.basename(file).split(".")[0] + ".js.map", (err) => {
	        if (err)
	            throw err;
	        Console.log("\tUpdated ", file, ">", out + path.basename(file).split(".")[0] + ".js");
	    });
	}
	htmlUpdate(file){
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
		let out = Params.length == 5 ? Root + "\\" + Params[3] + "\\" : path.dirname(file) + "\\";
	    fs.writeFile(out + (path.basename(file).replace(".max", "")), comp, (err) => {
	        if (err)
	            throw err;
	        Console.log("\tUpdated ",
	                    file,
	                    ">",
	                    out + path.basename(file).split(".")[0] + ".html");
	    });
	}
	// Find files
	findFiles(ext, dir, updater){
		let fileWalker = walk.walk(Root + dir, { followLinks: false }),
			files = [];
		fileWalker.on('file', (root, stat, next) => {
			// Because html code looks for .max.html this code has to be used instead of just checking path.extname() against the extentions
			for(let e of ext) {
				let i = stat.name.indexOf(e);
				if(i > -1 && i == stat.name.length - e.length){
					files.push((root + '/' + stat.name).replace(/\//, "\\"));
				}
			}
	        next();
	    });
		fileWalker.on('end', () => {
			console.log(files);
			for(let file of files){
				let watcher = chokidar.watch(file);
	            watcher.on('change', (path) => {
	                Console.log("> Change detected to: ", path);
	                updater(path);
	            });
	            if(CompileOnRun){
	                updater(file);
	            }
			}
		});
	}
	// Initialize
	constructor(){
		Console.log("> constructor start");
		// Find files
		this.findFiles(
			[".max.html", ".max.htm"],
			Params.length == 1 ? Params[0] : (Params.length == 3 ? Params[0] : /*else length = 5*/ Params[0]),
			(file) => { this.htmlUpdate(file); });
		this.findFiles(
			[".babl"],
			Params.length == 1 ? Params[0] : (Params.length == 3 ? Params[1] : /*else length = 5*/ Params[2]),
			(file) => { this.jsUpdate(file); });
		this.findFiles(
			[".scss"],
			Params.length == 1 ? Params[0] : (Params.length == 3 ? Params[2] : /*else length = 5*/ Params[4]),
			(file) => { this.sassUpdate(file); });
	}
}
~function(){
	let timeout = () => {
	    setTimeout(timeout, 5000);
	};
	if(Params.length == 1){

	} else if(Params.length == 3){

	} else if(Params.length == 5){

	} else {
		Console.log("Improper arguments");
		process.exit(1);
	}
	Console.log("> Init");
	let sc = new stackCompiler();
	// TODO: Check for new files every 10 seconds or so?
	// Timeout keeps the code running
	setTimeout(timeout, 5000);
}();
// TODO: --ignore dir dir dir dir
// TODO: --Check
//			stop or change how often the program scans for new files
// TODO: PHP
// Chocidar watch newfile
// TODO: Error handling
