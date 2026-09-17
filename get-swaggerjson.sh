#!/bin/bash
#
# Fetches Bitbucket Cloud's OpenAPI 3.0 spec, as published alongside
# https://developer.atlassian.com/cloud/bitbucket/rest/intro/, patches known
# gaps in it (see patch-swagger.js), converts it from JSON to YAML, and
# overwrites openapi.yml with the result.
#
# This spec is more complete than the older, now-deprecated
# https://api.bitbucket.org/swagger.json (Swagger 2.0) this repo used to be
# generated from - e.g. it documents the pull request Tasks endpoints, which
# the old spec was missing entirely.
#
# Requires node/npx for the patching and the JSON -> YAML conversion
# (json2yaml).
set -euo pipefail

curl -sSfL "https://dac-static.atlassian.com/cloud/bitbucket/swagger.v3.json" -o swagger.v3.json

node patch-swagger.js swagger.v3.json

npx --yes json2yaml swagger.v3.json > openapi.yml

rm swagger.v3.json
