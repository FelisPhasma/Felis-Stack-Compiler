#!/usr/bin/env node
"use strict";
let path = require("path"),
    appPath = path.dirname(process.argv[1]),
    exec = require('child_process').exec,
    pkg = require( path.join(__dirname, 'package.json') ),
    walk = require('walk');
function help(){
    console.log(`
    Usage: felis-stack <verb> [<args>]
    
    The verbs are:
    
        help    Dispalys help
        watch   Watches for changes and compiles. Arguments:
                    <SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>
`);
}
function escapeArg(arg){
    return arg.replace(/\\/gi, "\\\\").replace(/"/gi, "\\\"");
}
function watch(args){
    for(let i = 0, l = args.length; i < l; i++){
        args[i] = escapeArg(args[i]);
    }
    let command = `node ${appPath}\\main.js watch "${path.resolve(".")}" "${args.join(`" "`)}"`;
    console.log(command);
    let child = exec(command, function(error, stdout, stderr){
        console.log(stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
    child.stdout.on('data', function(data) {
        console.log(data.toString().replace(/\n/gi, "")); 
    });
    child.on('close', function (code) {
        console.log("Felis-stack exited with code ", code);
        process.exit(code);
    });
}
const verbs = {
    "h": help,
    "help": help,
    "w": watch,
    "watch": watch
};
let verb;
if(process.argv.length < 3){
    verb = "h";
} else {
    verb = process.argv[2][0] == "-" ? process.argv[2].substr(1) : process.argv[2];
}
verbs[verb.toLowerCase()](Array.prototype.slice.call(process.argv, 3));