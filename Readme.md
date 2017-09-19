# Felis Stack Compiler

----
The Felis Stack Compiler is a stack compiler for front end languages such as HTML, Scss, and Ec6.

This compiler automatically auto prefixes, compiles scss, and minifes css. Compiles ec6 to browser friendly JS, then minifies it. And minifies the HTML.

----
## Ussage

```
npm install -g felis-stack-compiler
felis-stack watch \
```
That's it!
The compiler will automatically watch for changes in the files and compile sources when they are changed.

---
## Command syntax

```
Usage: felis-stack <verb> [<args>]

The verbs are:

	help    Dispalys help
	watch   Watches for changes and compiles. Arguments:
				<Dir>
				<SassDir> <BabelDir> <HtmlDir>
				<SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>
	compile Compiles, doesn't listen.
				<Dir>
				<SassDir> <BabelDir> <HtmlDir>
				<SassDir> <CssOutDir> <BabelDir> <JsOutDir> <HtmlDir>

Extentions:
	".max.htm" and ".max.html" files are compressed
	".babl" files are compressed
	".scss" files are compressed
```

----
## What's compiled

`.scss` files are compiled
`.babl` files are compiled
`.max.html` or `.max.htm` files are compiled

---
## Technical notes

`walk` is used to find files
`chokidar` is used to monitor files for changes

`node-sass` is used to compile the Scss.
`postcss` and `autoprefixer` are used to auto-prefix the CSS.
`crass` is used to minify the css.

`babel-core` is used to compile ec6 and the `babili` preset is used to minify.

`html-minifier` is used to minify the html.

---

## License

... undecided
