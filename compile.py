#!/usr/bin/env python3

res = "var webgl = (function() {\n\n"

res += open("src/webgl.js").read()
res += open("src/buffer.js").read()
res += open("src/shader.js").read()
res += open("src/texture.js").read()

res += "\nreturn webgl;})();"

open("webgl.js", "w").write(res);
