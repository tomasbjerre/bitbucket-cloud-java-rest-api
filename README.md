# Bitbucket Cloud Java REST API
[![Build Status](https://travis-ci.org/tomasbjerre/bitbucket-cloud-java-rest-api.svg?branch=master)](https://travis-ci.org/tomasbjerre/bitbucket-cloud-java-rest-api)
[![Maven Central](https://maven-badges.herokuapp.com/maven-central/se.bjurr.bitbucketcloud/bitbucket-cloud-java-rest-api/badge.svg)](https://maven-badges.herokuapp.com/maven-central/se.bjurr.bitbucketcloud/bitbucket-cloud-java-rest-api) 
[![Bintray](https://api.bintray.com/packages/tomasbjerre/tomasbjerre/se.bjurr.bitbucketcloud%3Abitbucket-cloud-java-rest-api/images/download.svg) ](https://bintray.com/tomasbjerre/tomasbjerre/se.bjurr.bitbucketcloud%3Abitbucket-cloud-java-rest-api/_latestVersion)

REST API generated from the `swagger.json` spec at https://api.bitbucket.org/swagger.json

**Note:** `swagger.json` is committed in the repo! Because I needed some minor adjustments to get code generation working:

 * Removed some chars from description. `Mercurial does not support \"octopus\nmerges\"`
 * Changed `pipeline_selector` to `string` because of conflict with `getType` in `Object`.

**Note:** JAX-RS is just an API! You will need an implementation to create a client. Example [here](https://github.com/tomasbjerre/violation-comments-to-bitbucket-cloud-lib). See: https://en.wikipedia.org/wiki/Java_API_for_RESTful_Web_Services
