# Felis Stack Compiler

----
The Felis Stack Compiler is a stack compiler for front web development.
It's a simple and easy way to manage, compress, and compile Sass, Ec6, and Html.

- Html code is compressed down to optimize load time
- Scss is compiled to CSS, auto-prefixed, and then compressed
- And thanks to Babel, Ec6 Js is compiled to cross-browser friendly Js

----
## Ussage

```
npm install -g felis-stack-compiler
felis-stack w \
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
	".js" and ".ec6" files are compressed
	".scss" files are compressed
```

----
## What's compiled

`.scss` files are compiled and compressed

`.js` and `.ec6` files are compiled and compressed

`.max.html` and `.max.htm` files are compressed

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
