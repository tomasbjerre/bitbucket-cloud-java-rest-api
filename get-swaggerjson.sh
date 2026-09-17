#!/bin/bash
#
# Fetches Bitbucket Cloud's OpenAPI 3.0 spec, as published alongside
# https://developer.atlassian.com/cloud/bitbucket/rest/intro/, converts it
# from JSON to YAML, and overwrites openapi.yml with the result.
#
# This spec is more complete than the older, now-deprecated
# https://api.bitbucket.org/swagger.json (Swagger 2.0) this repo used to be
# generated from - e.g. it documents the pull request Tasks endpoints, which
# the old spec was missing entirely.
#
# Requires python3 with PyYAML (pip install pyyaml) for the JSON -> YAML
# conversion.
set -euo pipefail

curl -sSfL "https://dac-static.atlassian.com/cloud/bitbucket/swagger.v3.json" -o swagger.v3.json

python3 - <<'PYEOF'
import json
import yaml

with open("swagger.v3.json") as f:
    spec = json.load(f)

with open("openapi.yml", "w") as f:
    yaml.dump(spec, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=88)
PYEOF

rm swagger.v3.json
