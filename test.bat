@Echo off
start cmd /c "node cli.js -w test\1arg & pause"
start cmd /c "node cli.js -w test\3arg\styles test\3arg\scripts test\3arg\ & pause"
start cmd /c "node cli.js -w test\5arg\styles test\5arg\stylesOut test\5arg\scripts test\5arg\scriptsOut test\5arg & pause"
pause
