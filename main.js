"use strict";
/*
Arguments
felisStack  SassDir CssOutDir
            BabelDir JsOutDir
            HtmlDir
*/
// TODO: multiple dirs as arg
// TODO: Source maps
// TODO: JS Optimization
const compileOnRun = true;
let argvI = 2, // Args start at 2
    LaunchVerb = process.argv[argvI++],
    RootDir = process.argv[argvI++].replace("/", "\\"),
    
    SassDir = process.argv[argvI++].replace("/", "\\"),
    CssOutDir = process.argv[argvI++].replace("/", "\\"),
    BabelDir = process.argv[argvI++].replace("/", "\\"),
    JsOutDir = process.argv[argvI++].replace("/", "\\"),
    HtmlDir = process.argv[argvI++].replace("/", "\\");
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
let SassFiles = [],
    JsFiles = [],
    HtmlFiles = [];
/*
 _____  ___   _____ _____ 
/  ___|/ _ \ /  ___/  ___|
\ `--./ /_\ \\ `--.\ `--. 
 `--. \  _  | `--. \`--. \
/\__/ / | | |/\__/ /\__/ /
\____/\_| |_/\____/\____/ 
*/
function sassUpdate(file) {
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
        fs.writeFile(__dirname + "\\" + CssOutDir + "\\" + path.basename(file).split(".")[0] + ".css", compressedCss, (err) => {
            if (err)
                throw err;
            console.log("    Updated ", (SassDir[SassDir.length - 1] == "\\" ? SassDir : SassDir + "\\") + path.basename(file), ">", (CssOutDir[CssOutDir.length - 1] == "\\" ? CssOutDir : CssOutDir + "\\") + path.basename(file).split(".")[0] + ".css");
        });
    });
}

function initSASS(callback){
    // Walk every file in the SassDir
    let fileWalker = walk.walk(__dirname + (SassDir[0] == "\\" || SassDir[0] == "/" ? SassDir.substring(1) : "\\" + SassDir), { followLinks: false });
    // For each file in dir, add to Sass Files if it is a sass/scss file
    fileWalker.on('file', (root, stat, next) => {
        let fExt = path.extname(stat.name).toLowerCase();
        // Aparently node-sass can't compile sass, lol
        if([".scss"].indexOf(fExt) > -1){
            SassFiles.push((root + '/' + stat.name).replace(/\//, "\\"));
        }
        next();
    });
    // When everything is walked, watch the file, and re-compile if compileOnRun == true
    fileWalker.on('end', () => {
        for(let sfile of SassFiles){
            let watcher = chokidar.watch(sfile);
            watcher.on('change', (path) => {
                console.log("> Change detected to: ", path);
                sassFile(path);
            });
            if(compileOnRun)
                sassUpdate(sfile);
        }
        // Call the callback
        callback && callback();
    });
}

/*
  ____        _          _ 
 |  _ \      | |        | |
 | |_) | __ _| |__   ___| |
 |  _ < / _` | '_ \ / _ \ |
 | |_) | (_| | |_) |  __/ |
 |____/ \__,_|_.__/ \___|_|
*/
function jsUpdate(file) {
    let code = fs.readFileSync(file, 'utf8');
    let compiled = babel.transform(code, {
        presets: ["es2015", "babili"],
        babelrc: false,
        minified: true,
        comments: false,
        sourceMaps: true, //"both",
        filename: path.basename(file).split(".")[0] + ".js"
    });
    fs.writeFile(__dirname + "\\" + JsOutDir + "\\" + path.basename(file).split(".")[0] + ".js.map", JSON.stringify(compiled.map), (err) => {
        if (err)
            throw err;
    });
    fs.writeFile(__dirname + "\\" + JsOutDir + "\\" + path.basename(file).split(".")[0] + ".js", compiled.code + "\n//# sourceMappingURL=" + path.basename(file).split(".")[0] + ".js.map", (err) => {
        if (err)
            throw err;
        console.log("    Updated ", (BabelDir[BabelDir.length - 1] == "\\" ? BabelDir : BabelDir + "\\") + path.basename(file), ">", (JsOutDir[JsOutDir.length - 1] == "\\" ? JsOutDir : JsOutDir + "\\") + path.basename(file).split(".")[0] + ".js");
    });
}

function initBABEL(callback){
    // Almost identical to the initSASS. Probably could just make it into something reusable, but that isn't nessesary...
    // Walk every file in the BabelDir
    let fileWalker = walk.walk(__dirname + (BabelDir[0] == "\\" || BabelDir[0] == "/" ? BabelDir.substring(1) : "\\" + BabelDir), { followLinks: false });
    // For each file in dir, add to Babel Files if it is a sass/scss file
    fileWalker.on('file', (root, stat, next) => {
        let fExt = path.extname(stat.name).toLowerCase();
        if([".js"].indexOf(fExt) > -1)
            JsFiles.push((root + '/' + stat.name).replace(/\//, "\\"));
        next();
    });
    // When everything is walked, watch the file, and re-compile if compileOnRun == true
    fileWalker.on('end', () => {
        for(let bfile of JsFiles){
            let watcher = chokidar.watch(bfile);
            watcher.on('change', (path) => {
                console.log("> Change detected to: ", path);
                jsUpdate(path);
            });
            if(compileOnRun)
                jsUpdate(bfile);
        }
        // Call the callback
        callback && callback();
    });
}

/*
                                     .---. 
   .                  __  __   ___   |   | 
 .'|                 |  |/  `.'   `. |   | 
<  |             .|  |   .-.  .-.   '|   | 
 | |           .' |_ |  |  |  |  |  ||   | 
 | | .'''-.  .'     ||  |  |  |  |  ||   | 
 | |/.'''. \'--.  .-'|  |  |  |  |  ||   | 
 |  /    | |   |  |  |  |  |  |  |  ||   | 
 | |     | |   |  |  |__|  |__|  |__||   | 
 | |     | |   |  '.'                '---' 
 | '.    | '.  |   /                       
 '---'   '---' `'-'                        
*/
function htmlUpdate(file){
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
function initHTML(callback){
    // Compile all files that end in foobar.max.html
    // Walk every file in the HtmlDir
    console.log(__dirname + (HtmlDir[0] == "\\" || HtmlDir[0] == "/" ? HtmlDir.substring(1) : "\\" + HtmlDir));
    let fileWalker = walk.walk(__dirname + (HtmlDir[0] == "\\" || HtmlDir[0] == "/" ? HtmlDir.substring(1) : "\\" + HtmlDir), { followLinks: false });
    // For each file in dir, add to Babel Files if it is a sass/scss file
    fileWalker.on('file', (root, stat, next) => {
        let fExt = path.extname(stat.name).toLowerCase();
        if([".html", ".htm"].indexOf(fExt) > -1){
            let bName = path.basename(stat.name, fExt);
            if(bName.endsWith(".max"))
                HtmlFiles.push((root + '/' + stat.name).replace("/", "\\"));
        }
        next();
    });
    fileWalker.on('end', () => {
        for(let hfile of HtmlFiles){
            let watcher = chokidar.watch(hfile);
            watcher.on('change', (path) => {
                console.log("> Change detected to: ", path);
                htmlUpdate(path);
            });
            if(compileOnRun)
                htmlUpdate(hfile);
        }
        // Call the callback
        callback && callback();
    });
}

!function init(){
    console.log("> Init");
    initSASS();
    initBABEL();
    initHTML();
}();
// Chokidar will keep the program running, however if there are no files initially, this will keep it running.
function timeout(){
    setTimeout(timeout, 5000);
}
setTimeout(timeout, 5000);
