#!/usr/bin/env node
const { program } = require("commander");
const pkg = require("../package.json");
const create = require("../lib/create");

program
  .name("my-cli")
  .description("Custom Scaffolding Generator")
  .version(pkg.version, "-v, --version");
program
  .command("create <project-name>")
  .description("Create a new project")
  .action(async (projectName) => {
    create(projectName);
  });

program.parse(process.argv);
