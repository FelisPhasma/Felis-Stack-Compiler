"use strict";
/*
Arguments
felisStack  SassDir CssOutDir
            BabelDir JsOutDir
*/
const compileOnRun = true;
let argvI = 2, // Args start at 2
    SassDir = process.argv[argvI++],
    CssOutDir = process.argv[argvI++],
    BabelDir = process.argv[argvI++],
    JsOutDir = process.argv[argvI++];
let chokidar = require('chokidar'),
    autoprefixer = require('autoprefixer'),
    postcss = require('postcss'),
    cssshrink = require('cssshrink'),
    nodeSass = require('node-sass'),
    babel = require("babel-core"),
    fs = require('fs'),
    walk = require('walk'),
    path = require('path');
let SassFiles = [],
    JsFiles = [];

function sassUpdate(file) {
    let css = fs.readFileSync(file, 'utf8');
    postcss([autoprefixer]).process(css).then(function (result) {
        result.warnings().forEach(function (warn) {
            console.warn(warn.toString());
        });
        var compressedCss = cssMinfier.shrink(result.css);
        fs.writeFile(FILEout, compressedCss, (err) => {
            if (err)
                throw err;
            console.log("    Updated ", FILEout);
        });
    });
}

function initSASS(callback){
    // Walk every file in the SassDir
    let fileWalker = walk.walk(__dirname + (SassDir[0] == "\\" || SassDir[0] == "/" ? SassDir.substring(1) : "\\" + SassDir), { followLinks: false });
    // For each file in dir, add to Sass Files if it is a sass/scss file
    fileWalker.on('file', (root, stat, next) => {
        let fExt = path.extname(stat.name).toLowerCase();
        if([".scss", ".sass"].indexOf(fExt) > -1)
            SassFiles.push(root + '/' + stat.name);
        next();
    });
    // When everything is walked, watch the file, and re-compile if compileOnRun == true
    fileWalker.on('end', () => {
        for(sfile of SassFiles){
            let watcher = chokidar.watch(sfile);
            watcher.on('change', (path) => {
                console.log("> Change detected to: ", path);
                updateFile(path);
            });
            if(compileOnRun)
                sassUpdate(root + '/' + stat.name);
        }
        // Call the callback
        callback();
    });
}
function initBABEL(callback){
    // Almost identical to the initSASS
    
    // Walk every file in the SassDir
    let fileWalker = walk.walk(__dirname + (SassDir[0] == "\\" || SassDir[0] == "/" ? SassDir.substring(1) : "\\" + SassDir), { followLinks: false });
    // For each file in dir, add to Sass Files if it is a sass/scss file
    fileWalker.on('file', (root, stat, next) => {
        let fExt = path.extname(stat.name).toLowerCase();
        if([".scss", ".sass"].indexOf(fExt) > -1)
            SassFiles.push(root + '/' + stat.name);
        next();
    });
    // When everything is walked, watch the file, and re-compile if compileOnRun == true
    fileWalker.on('end', () => {
        for(sfile of SassFiles){
            let watcher = chokidar.watch(sfile);
            watcher.on('change', (path) => {
                console.log("> Change detected to: ", path);
                updateFile(path);
            });
            if(compileOnRun)
                sassUpdate(root + '/' + stat.name);
        }
        // Call the callback
        callback();
    });
}
function init(){
    // init SASS, then Babel
    initSASS(initBABEL);
}
init();
