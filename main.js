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
const CompileOnRun = false;

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
	        fs.writeFile(RootDir + "\\" + CssOutDir + "\\" + path.basename(file).split(".")[0] + ".css", compressedCss, (err) => {
	            if (err)
	                throw err;
	            console.log("	Updated ", (SassDir[SassDir.length - 1] == "\\" ? SassDir : SassDir + "\\") + path.basename(file), ">", (CssOutDir[CssOutDir.length - 1] == "\\" ? CssOutDir : CssOutDir + "\\") + path.basename(file).split(".")[0] + ".css");
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
	        console.log("\t" + err);
	        return;
	    }
	    fs.writeFile(RootDir + "\\" + JsOutDir + "\\" + path.basename(file).split(".")[0] + ".js.map", JSON.stringify(compiled.map), (err) => {
	        if (err)
	            throw err;
	    });
	    fs.writeFile(RootDir + "\\" + JsOutDir + "\\" + path.basename(file).split(".")[0] + ".js", compiled.code + "\n//# sourceMappingURL=" + path.basename(file).split(".")[0] + ".js.map", (err) => {
	        if (err)
	            throw err;
	        console.log("    Updated ", (BabelDir[BabelDir.length - 1] == "\\" ? BabelDir : BabelDir + "\\") + path.basename(file), ">", (JsOutDir[JsOutDir.length - 1] == "\\" ? JsOutDir : JsOutDir + "\\") + path.basename(file).split(".")[0] + ".js");
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
	        conservativeCollapse: true, // This is because of a bug where two <nobr> tags back to back like '...</nobr><nobr>...' still don't break
	        keepClosingSlash: true,
	        minifyCSS: true,
	        minifyJS: true,
	        preventAttributesEscaping: true,
	        removeAttributeQuotes: true,
	        removeComments: true,
	        removeScriptTypeAttributes: true,
	        removeStyleLinkTypeAttribute: true
	    });
	    fs.writeFile(path.dirname(file) + "\\" + (path.basename(file).replace(".max", "")), comp, (err) => {
	        if (err)
	            throw err;
	        console.log("    Updated ",
	                    (HtmlDir[HtmlDir.length - 1] == "\\" ?
	                        HtmlDir :
	                        HtmlDir + "\\") + path.basename(file),
	                    ">",
	                    (path.dirname(file) + "\\" + (path.basename(file).replace(".max", ""))).indexOf(path.resolve(HtmlDir), "") == 0 ?
	                    (path.dirname(file) + "\\" + (path.basename(file).replace(".max", ""))).substr(path.resolve(HtmlDir).length).replace(/^\\+/gi, "") :
	                    (path.dirname(file) + "\\" + (path.basename(file).replace(".max", ""))));
	    });
	}
	// Find files
	findFiles(ext, dir, updater){
		let fileWalker = walk.walk(Root + dir, { followLinks: false }),
			files = [];
		fileWalker.on('file', (root, stat, next) => {
	        let fExt = path.extname(stat.name).toLowerCase();
	        if(ext.indexOf(fExt) > -1){
	            files.push((root + '/' + stat.name).replace(/\//, "\\"));
	        }
	        next();
	    });
		fileWalker.on('end', () => {
			console.log(files);
			return;
			for(let file of files){
				let watcher = chokidar.watch(hfile);
	            watcher.on('change', (path) => {
	                console.log("> Change detected to: ", path);
	                updater(path);
	            });
	            if(compileOnRun){
	                updater(hfile);
	            }
			}
		});
	}
	// Initialize
	constructor(){
		console.log("> constructor start");
		// Find files
		this.findFiles(
			[".max.html", ".max.htm"],
			Params.length == 1 ? Params[0] : (Params.length == 3 ? Params[0] : /*else length = 5*/ Params[0]),
			(file) => { this.htmlUpdate(file); });*/
		this.findFiles(
			[".babl"],
			Params.length == 1 ? Params[0] : (Params.length == 3 ? Params[1] : /*else length = 5*/ Params[2]),
			(file) => { this.jsUpdate(file); });
		this.findFiles(
			[".scss"],
			Params.length == 1 ? Params[0] : (Params.length == 3 ? Params[2] : /*else length = 5*/ Params[4]),
			(file) => { this.sassUpdate(file); });*/
	}
}
function init(){
	let timeout = () => {
	    setTimeout(timeout, 5000);
	};
	if(Params.length == 1){

	} else if(Params.length == 3){

	} else if(Params.length == 5){

	} else {
		console.log("Improper arguments");
		process.exit(1);
	}
	console.log("> Init");
	console.log(Params);
	let sc = new stackCompiler();
	// TODO: Check for new files every 10 seconds or so?
	// Timeout keeps the code running
	setTimeout(timeout, 5000);
}
init();
// TODO: --ignore dir dir dir dir
// TODO: --Check
//			stop or change how often the program scans for new files
