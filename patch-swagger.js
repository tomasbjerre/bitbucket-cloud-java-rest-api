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
const activityOkResponse =
  activityPath && activityPath.get && activityPath.get.responses["200"];
if (activityOkResponse && !activityOkResponse.content) {
  activityOkResponse.content = {
    "application/json": {
      schema: { $ref: "#/components/schemas/paginated_activities" },
    },
  };
}

// GET .../diff/{spec} - returns the raw unified diff as plain text, not JSON.
// Same gap as the activity endpoint above: documented with a description
// only, no content/schema, so the generator falls back to void.
const diffPath = spec.paths["/repositories/{workspace}/{repo_slug}/diff/{spec}"];
const diffOkResponse = diffPath && diffPath.get && diffPath.get.responses["200"];
if (diffOkResponse && !diffOkResponse.content) {
  diffOkResponse.content = { "text/plain": { schema: { type: "string" } } };
}

// GET .../pullrequests/{id}/commits - same gap again: genuinely returns a
// paginated list of commits (the old, now-deprecated spec documented it),
// but this spec's 200 response has no schema.
if (!spec.components.schemas.paginated_pullrequests_commits) {
  spec.components.schemas.paginated_pullrequests_commits = {
    type: "object",
    properties: {
      next: { type: "string", format: "uri" },
      pagelen: { type: "integer", minimum: 1 },
      page: { type: "integer", minimum: 1 },
      previous: { type: "string", format: "uri" },
      values: {
        type: "array",
        minItems: 0,
        uniqueItems: true,
        items: { $ref: "#/components/schemas/commit" },
      },
      size: { type: "integer", minimum: 0 },
    },
  };
}
const commitsPath =
  spec.paths[
    "/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/commits"
  ];
const commitsOkResponse =
  commitsPath && commitsPath.get && commitsPath.get.responses["200"];
if (commitsOkResponse && !commitsOkResponse.content) {
  commitsOkResponse.content = {
    "application/json": {
      schema: { $ref: "#/components/schemas/paginated_pullrequests_commits" },
    },
  };
}

// The `object` schema declares the polymorphic discriminator
// (`propertyName: "type"`) that every resource, including `comment` and its
// subtypes like `pullrequest_comment`, inherits without an explicit
// `mapping` - so the generator auto-registers each subtype under its own
// schema name (e.g. "pullrequest_comment"). But Bitbucket Cloud's actual
// pull request comment responses always carry `"type": "comment"`, never
// "pullrequest_comment" - so a field/parameter typed as the generated
// `PullrequestComment` class can never actually deserialize (Jackson
// rejects "comment" as a type id for a `PullrequestComment`-typed value,
// since `Comment` is the supertype, not a subtype). Point these PR-comment
// endpoints at the base `comment` schema instead, which matches what the
// API actually sends/expects and is all this client uses anyway.
function repointCommentSchema(path, methods) {
  const pathItem = spec.paths[path];
  if (!pathItem) return;
  for (const method of methods) {
    const op = pathItem[method];
    if (!op) continue;
    const bodies = [];
    if (op.requestBody) bodies.push(op.requestBody.content);
    for (const response of Object.values(op.responses || {})) {
      if (response.content) bodies.push(response.content);
    }
    for (const content of bodies) {
      const schema = content && content["application/json"] && content["application/json"].schema;
      if (schema && schema.$ref === "#/components/schemas/pullrequest_comment") {
        schema.$ref = "#/components/schemas/comment";
      }
    }
  }
}
if (
  spec.components.schemas.paginated_pullrequest_comments &&
  spec.components.schemas.paginated_pullrequest_comments.properties.values.items.$ref ===
    "#/components/schemas/pullrequest_comment"
) {
  spec.components.schemas.paginated_pullrequest_comments.properties.values.items.$ref =
    "#/components/schemas/comment";
}
repointCommentSchema(
  "/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments",
  ["post"]
);
repointCommentSchema(
  "/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}",
  ["get", "put"]
);

// pullrequest_comment_task.comment: Bitbucket Cloud's task responses embed the comment a task
// is anchored to as a minimal, un-typed reference - just `id` and `links` (confirmed against a
// real task on https://bitbucket.org/tomasbjerre/violations-test/pull-requests/1: {"id":
// 865602816, "links": {"self": {...}, "html": {...}}} - no "type" at all). The spec points this
// field at the full, abstract `comment` schema instead, which inherits a required `type` from
// the shared `object` base (see the discriminator patch above) - a constraint no real response
// for this field can ever satisfy. Generators that turn required properties into constructor
// arguments (like jaxrs-spec here) then produce a model this field's real payload can never
// construct, so it fails to deserialize at all. Give the field its own minimal schema matching
// what's actually sent, instead of the full (and here, unsatisfiable) `comment` schema.
if (spec.components.schemas.pullrequest_comment_task) {
  spec.components.schemas.pullrequest_comment_task_comment_ref = {
    type: "object",
    title: "Pull Request Task Comment Reference",
    description:
      'A minimal reference to the comment a pull request task is anchored to - its id and links only, without the "type" discriminator other comment representations carry.',
    properties: {
      id: { type: "integer", format: "int64" },
      links: {
        type: "object",
        properties: {
          self: {
            type: "object",
            title: "Link",
            description: "A link to a resource related to this object.",
            properties: {
              href: { type: "string", format: "uri" },
              name: { type: "string" },
            },
          },
          html: {
            type: "object",
            title: "Link",
            description: "A link to a resource related to this object.",
            properties: {
              href: { type: "string", format: "uri" },
              name: { type: "string" },
            },
          },
        },
      },
    },
  };
  const objectPart = spec.components.schemas.pullrequest_comment_task.allOf.find(
    (part) => part.properties && part.properties.comment
  );
  if (objectPart) {
    objectPart.properties.comment = {
      $ref: "#/components/schemas/pullrequest_comment_task_comment_ref",
    };
  }
}

fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
