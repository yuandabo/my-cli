#!/usr/bin/env node
const { program } = require("commander");
const pkg = require("../package.json");
const create = require("../lib/create");
const add = require("../lib/add");

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

program
  .command("standard")
  .alias("sd")
  .description("向当前项目添加代码规范与提交规范")
  .action(async (options, command) => {
    // console.log(options, command);
    // 交互式选择功能
    add();
  });

program.parse(process.argv);
