"use strict";

// KashMetrix Universal Finance Engine (UFE)
// Central entry point for the backend PDF ingestion architecture.

const layout = require("./layout");
const interpreters = require("./interpreters");
const validation = require("./validation");

module.exports = {
  layout,
  interpreters,
  validation,
};
