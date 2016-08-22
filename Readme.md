# Felis Stack Compiler

----
The Felis Stack Compiler is a stack compiler for front end languages such as HTML, Scss, and Ec6.

This compiler automatically auto prefixes, compiles scss, and minifes css. Compiles ec6 to browser friendly JS, then minifies it. And minifies the HTML.

----
## Ussage

```
npm install -g felis-stack-compiler
felis-stack-compiler ScssDir CssDir BabelDir JsDir ScriptsDir HtmlDir
```
That's it!
The compiler will automatically watch for changes in the files and re-compile when they are changed.

You probably want to stick that last line in a batch or bash file that you can easily re-run  when you start working on the project.

----
## What's compiled

All `.scss` files in the `ScssDir` are compiled into the `CssDir`.
All the `.js` files in the `BabelDir` are compiled into the `JsDir`. 
All files within the `HtmlDir` with a file extension of `.max.html` or `.max.htm` are compiled within their respective sub directory of the `HtmlDir`

---
## Technical notes

`chokidar` is used to monitor files for changes

`node-sass` is used to compile the Scss.
`postcss` and `autoprefixer` are used to auto-prefix the CSS.
`crass` is used to minify the css.

`babel-core` is used to compile ec6 and minify .

`html-minifier` is used to minify the html.