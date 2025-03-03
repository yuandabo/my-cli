const { program } = require('commander')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const chalk = require('chalk')
const execa = require('execa')
const { checkAndInitGit } = require('../plugins/checkGit')
// 配置 Lint
async function setupLint() {
  checkAndInitGit()
  // 生成配置文件
  if (!fs.existsSync('.eslintrc.js')) {
    fs.writeFileSync(
      '.eslintrc.js',
      `
  module.exports = {
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    rules: {
      'no-console': 'warn'
    }
  };
      `,
    )
  }

  if (!fs.existsSync('.prettierrc')) {
    fs.writeFileSync(
      '.prettierrc',
      JSON.stringify(
        {
          semi: false,
          singleQuote: true,
        },
        null,
        2,
      ),
    )
  }

  // 安装依赖
  await execa('npm', [
    'install',
    '-D',
    'eslint',
    'prettier',
    'eslint-plugin-prettier',
    'eslint-config-prettier',
    '@commitlint/config-conventional',
  ])
}

// 配置提交规范
async function setupCommit() {
  // 生成 Commitlint 配置
  if (!fs.existsSync('.commitlintrc.js')) {
    fs.writeFileSync(
      '.commitlintrc.js',
      `
  module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']]
    }
  };
      `,
    )
  }

  // 安装依赖并初始化 Husky
  await execa('npm', [
    'install',
    '-D',
    'husky',
    '@commitlint/cli',
    'lint-staged',
  ])
  await execa('npx', ['husky', 'install'])
  await execa('npx', [
    'husky',
    'add',
    '.husky/commit-msg',
    'npx commitlint --edit "$1"',
  ])

  // 配置 Lint-Staged
  if (!fs.existsSync('lint-staged.config.js')) {
    fs.writeFileSync(
      'lint-staged.config.js',
      `
  module.exports = {
    '*.{js,jsx}': ['eslint --fix', 'prettier --write']
  };
      `,
    )
  }
}

async function add() {
  try {
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: '选择要集成的规范:',
        choices: [
          { name: 'ESLint + Prettier', value: 'lint' },
          { name: 'Commitlint (提交规范)', value: 'commit' },
        ],
      },
    ])

    // 根据选择执行操作
    if (features.includes('lint')) await setupLint()
    if (features.includes('commit')) await setupCommit()

    console.log(chalk.green('✅ 配置完成! 请检查并提交变更'))
  } catch (err) {
    console.error(chalk.red('Error:'), err)
  }
}

module.exports = () => {
  return add()
}
