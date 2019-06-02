#!/bin/bash
rm swagger.*
wget https://api.bitbucket.org/swagger.json
cat swagger.json | json_pp -f json -t json > swagger.json.pretty
rm swagger.json
mv swagger.json.pretty swagger.json

