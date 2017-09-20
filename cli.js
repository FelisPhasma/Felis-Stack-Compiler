#!/usr/bin/env node
"use strict";
const path = require("path");
const appPath = path.dirname(process.argv[1]);
const exec = require('child_process').exec;
const packageInfo = require('./package.json');
class ChildProcess {
	onData(data){
		console.log(data.toString().replace(/\n/gi, ""));
	}
	onClose(code){
		console.log("felis-stack exited with code ", code);
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
	    return arg.replace(/\//gi, "\\").replace(/\\/gi, "\\\\").replace(/\"/gi, "\\\"");
	}

	static help(){
	    console.log(`
    Usage: felis-stack <verb> [<args>]

    The verbs are:

        h, help       Dispalys help
        w, watch      Watches for changes and compiles. Arguments:
					       <Dir>
					       <SassDir> <BabelDir> <HtmlDir>
					       <SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>
		c, compile    Compiles, doesn't listen.
					       <Dir>
					       <SassDir> <BabelDir> <HtmlDir>
					       <SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>

	The args are:

		--debug <level>
				Prints debug information while code is running. Level (0 - 2)
				indicates how much debug info to print. 0(default) is least, 2 is most
		--ignore [dir, dir, ...]
				Ignores certian dirs
		--check <n>
				Checks for new files every n seconds.
				0 = don't check
				Default = 0
		--compileOnRun
				Compile files initially when felis-stack is called

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
	    let command = `node \"${appPath}\\src\\main.js\" watch "${path.resolve(".")}" "${args.join(`" "`)}"`;
		let child = new ChildProcess(command);
	}
	static compile(args){
	    for(let i = 0, l = args.length; i < l; i++){
	        args[i] = Cli._escapeArg(args[i]);
	    }
	    let command = `node \"${appPath}\\src\\main.js\" compile "${path.resolve(".")}" "${args.join(`" "`)}"`;
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
~function init(){
	console.log(`${packageInfo.name} version ${packageInfo.version}`);
	let verb;
	if(process.argv.length < 3){
	    verb = "h";
	} else {
	    verb = (process.argv[2][0] == "-" ? process.argv[2].substr(1) : process.argv[2]).toLowerCase();
	}
	if(verbs[verb] == undefined){
		console.log("Error: Unknown verb \"" + verb + "\"");
		verb = "h";
	}
	verbs[verb](Array.prototype.slice.call(process.argv, 3));
}();
// TODO: Fix bug with help message display
// TODO: Colors?
// TODO: Console management in cli.js?
