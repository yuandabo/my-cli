#!/usr/bin/env node
const inquirer = require("inquirer");
const fse = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const Handlebars = require("handlebars");
const shell = require("shelljs");
const simpleGit = require("simple-git");
const TEMPLATES = {
  react: {
    path: path.join(__dirname, "../templates/react"),
    files: ["package.json", "src/**/*"],
    repoUrl: "https://github.com/yuandabo/vue3-ts-template-simple",
  },
  vue: {
    path: path.join(__dirname, "../templates/vue"),
    files: ["vite.config.js", "src/components/*"],
    repoUrl: "https://github.com/yuandabo/vue3-ts-template-simple",
  },
};

/**
 * 从 gitlab 或者github 创建一个项目模板
 * @param {string} projectName - 项目名称
 * @returns {Promise<CreateProjectResult>}
 */
const createProject = async (projectName, repoUrl) => {
  const git = simpleGit();
  const targetPath = path.join(process.cwd(), projectName);

  try {
    console.log(`Cloning template from ${repoUrl}...`);
    await git.clone(repoUrl, targetPath);
    console.log("Template cloned successfully.");

    /**
     *  因为，通过simpleGit 的clone 命令， 下载下来的模板，git 信息是指向模板库的，
     *  所以我们需要通过 代码后处理 删除.git 目录并初始化为一个空的git 工程
     */
    await fs.remove(path.join(targetPath, ".git"));
    console.log(".git directory removed.");

    // 初始化成全新的git 项目
    await git.cwd(targetPath).init();
    console.log("Initialized a new git repository.");

    console.log(`Project created at ${targetPath}`);
    return { success: true, message: `Project created at ${targetPath}` };
  } catch (error) {
    console.error("Failed to clone template:", error);
    return { success: false, message: "Failed to clone template", error };
  }
};
const initAction = async (name, option) => {
  if (!shell.which("git")) {
    console.log("对不起，运行脚本必须先安装git!");
    shell.exit(1);
  }
};
const clone = (remote, name, option = false) => {
  console.log("正在拉取项目......");
  return new Promise((resolve, reject) => {
    download(remote, name, option, (err) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      console.log("拉取成功");
      resolve();
    });
  });
};

async function create(projectName) {
  try {
    // 步骤1：选择模板类型
    const { templateType } = await inquirer.prompt([
      {
        type: "list",
        name: "templateType",
        message: "Select template type:",
        choices: ["react", "vue"],
      },
    ]);

    // 步骤2：收集用户配置
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Project name:",
        default: projectName,
      },
      {
        type: "confirm",
        name: "useTypeScript",
        message: "Use TypeScript?",
      },
    ]);
    console.log(answers);

    // 步骤3：生成目标目录
    const targetDir = path.join(process.cwd(), projectName);
    if (fse.existsSync(targetDir)) {
      console.log(chalk.red("Error: Directory already exists!"));
      process.exit(1);
    }
    fse.ensureDirSync(targetDir);

    const template = TEMPLATES[templateType];

    // createProject(answers.projectName, template.repoUrl);
    // console.log(
    //   chalk.green(`\nSuccess! Created ${projectName} at ${targetDir}`)
    // );
    // 步骤4：复制模板文件
    fse.copySync(template.path, targetDir, {
      filter: (src) => !/node_modules/.test(src),
    });
    // 步骤5：动态替换内容
    const packageJsonPath = path.join(targetDir, "package.json");
    if (fse.existsSync(packageJsonPath)) {
      const content = fse.readFileSync(packageJsonPath, "utf-8");
      const compiled = Handlebars.compile(content)(answers);
      fse.writeFileSync(packageJsonPath, compiled);

      console.log(
        chalk.green(`\nSuccess! Created ${projectName} at ${targetDir}`)
      );
    }
  } catch (err) {
    console.error(chalk.red("Error:"), err);
  }
}

module.exports = (...args) => {
  return create(...args);
};
