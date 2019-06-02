# Bitbucket Cloud Java REST Client
[![Build Status](https://travis-ci.org/tomasbjerre/bitbucket-cloud-java-rest-client.svg?branch=master)](https://travis-ci.org/tomasbjerre/bitbucket-cloud-java-rest-client)
[![Maven Central](https://maven-badges.herokuapp.com/maven-central/se.bjurr.bitbucketcloud/bitbucket-cloud-java-rest-client/badge.svg)](https://maven-badges.herokuapp.com/maven-central/se.bjurr.bitbucketcloud/bitbucket-cloud-java-rest-client) 
[![Bintray](https://api.bintray.com/packages/tomasbjerre/tomasbjerre/se.bjurr.bitbucketcloud%3Abitbucket-cloud-java-rest-client/images/download.svg) ](https://bintray.com/tomasbjerre/tomasbjerre/se.bjurr.bitbucketcloud%3Abitbucket-cloud-java-rest-client/_latestVersion)

A REST client for Bitbucket Cloud in Java.

Generated from the `swagger.json` spec at https://api.bitbucket.org/swagger.json

**Note:** `swagger.json` is committed in the repo! Because I needed som minor adjustments to get it working.

 * Removed some chars from documentation in the *swagger.json*. `Mercurial does not support \"octopus\nmerges\"`
 * Changed `pipeline_selector` to String because of conflict with `getType`.
