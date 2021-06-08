# README

name = {{ name }}

description = {{description}}

test = {{ test }}

nested = {{ a.b }}
nested2 = {{ a.c }}

skip = {% raw %}{{ skip }}{% endraw %}

empty = _{{ empty }}_
