#!/usr/bin/env node
"use strict";
const path = require("path");
const appPath = path.dirname(process.argv[1]);
const exec = require('child_process').exec;
class ChildProcess {
	onData(data){
		console.log(data.toString().replace(/\n/gi, ""));
	}
	onClose(code){
		console.log("Felis-stack exited with code ", code);
		process.exit(code);
	}
	constructor(command){
		let child = exec(command, function(error, stdout, stderr){
	        console.log(stderr);
	        if (error !== null) {
	            console.log('exec error: ' + error);
	        }
	    });
	    child.stdout.on('data', this.onData);
	    child.on('close', this.onClose);
	}
}
class Cli {
	static _escapeArg(arg){
	    return arg.replace(/\\/gi, "\\\\").replace(/"/gi, "\\\"");
	}

	static help(){
	    console.log(`
    Usage: felis-stack <verb> [<args>]

    The verbs are:

        help    Dispalys help
        watch   Watches for changes and compiles. Arguments:
					<Dir>
					<SassDir> <BabelDir> <HtmlDir>
					<SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>
		compile	Compiles, doesn't listen.
					<Dir>
					<SassDir> <BabelDir> <HtmlDir>
					<SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>

	Extentions:
		".max.htm" and ".max.html" files are compressed
		".babl" files are compressed
		".scss" files are compressed
`);
	}
	static watch(args){
	    for(let i = 0, l = args.length; i < l; i++){
	        args[i] = Cli._escapeArg(args[i]);
	    }
	    let command = `node \"${appPath}\\main.js\" watch "${path.resolve(".")}" "${args.join(`" "`)}"`;
	    console.log(command);
		let child = new ChildProcess(command);
	}
	static compile(args){
	    for(let i = 0, l = args.length; i < l; i++){
	        args[i] = Cli._escapeArg(args[i]);
	    }
	    let command = `node \"${appPath}\\main.js\" compile "${path.resolve(".")}" "${args.join(`" "`)}"`;
	    //console.log(command);
		let child = new ChildProcess(command);
	}
}
const verbs = {
    "help": Cli.help,
	"h": Cli.help,
    "watch": Cli.watch,
	"w": Cli.watch,
	"compile": Cli.compile,
	"c": Cli.compile
};
!function init(){
	let verb;
	if(process.argv.length < 3){
	    verb = "h";
	} else {
	    verb = process.argv[2][0] == "-" ? process.argv[2].substr(1) : process.argv[2];
	}
	if(verbs[verb] == undefined)
		verb = "h";
	verbs[verb.toLowerCase()](Array.prototype.slice.call(process.argv, 3));
}();
