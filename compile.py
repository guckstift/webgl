#!/usr/bin/env python3

import os.path

thisDir = os.path.dirname(__file__)

res = "var webgl = (function() {\n\n"

res += open(thisDir + "/src/webgl.js").read()
res += open(thisDir + "/src/buffer.js").read()
res += open(thisDir + "/src/shader.js").read()
res += open(thisDir + "/src/texture.js").read()

res += "\nreturn webgl;})();"

open(thisDir + "/webgl.js", "w").write(res);
