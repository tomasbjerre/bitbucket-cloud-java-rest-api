#!/usr/bin/env node
//
// Patches known gaps in Atlassian's published OpenAPI 3.0 spec for Bitbucket
// Cloud (see get-swaggerjson.sh), applied in place to the given JSON file.
//
// Run as: node patch-swagger.js <path-to-swagger.json>

const fs = require("fs");

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node patch-swagger.js <path-to-swagger.json>");
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));

// The pull request activity log endpoint (GET .../pullrequests/{id}/activity)
// documents its 200 response with only a description, no content/schema -
// even though the endpoint genuinely returns a paginated list (the response
// description's own prose includes worked JSON examples of it). Without a
// schema the generator falls back to a void return type, so this client
// can't read the response at all. Restore the schema using the shape the
// older, now-deprecated api.bitbucket.org/swagger.json used to document for
// the same endpoint - the actual API response hasn't changed, only this
// newer spec's documentation of it is incomplete.
if (!spec.components.schemas.activity) {
  spec.components.schemas.activity = {
    properties: {
      comment: { $ref: "#/components/schemas/comment" },
    },
  };
}

if (!spec.components.schemas.paginated_activities) {
  spec.components.schemas.paginated_activities = {
    description: "A paged list of activities",
    type: "object",
    properties: {
      page: { type: "integer" },
      previous: { type: "string", format: "uri" },
      pagelen: { type: "integer" },
      size: { type: "integer" },
      next: { type: "string", format: "uri" },
      values: {
        type: "array",
        minItems: 0,
        items: { $ref: "#/components/schemas/activity" },
      },
    },
  };
}

const activityPath =
  spec.paths[
    "/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity"
  ];
const okResponse = activityPath && activityPath.get && activityPath.get.responses["200"];
if (okResponse && !okResponse.content) {
  okResponse.content = {
    "application/json": {
      schema: { $ref: "#/components/schemas/paginated_activities" },
    },
  };
}

fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
