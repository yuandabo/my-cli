const { program } = require('commander')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const chalk = require('chalk')
const execa = require('execa')
const { checkAndInitGit } = require('../plugins/checkGit')
const ora = require('ora')
// 配置 Lint
async function setupLint() {
  checkAndInitGit()
  // 生成配置文件
  if (!fs.existsSync('.eslintrc.js')) {
    const spinner = ora('正在生成 ESLint 配置文件...').start()

    await fs.writeFileSync(
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

    spinner.succeed('ESLint 配置文件生成完成')
  }

  if (!fs.existsSync('.prettierrc')) {
    const spinner = ora('正在生成 .prettierrc 文件...').start()

    await fs.writeFileSync(
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
    spinner.succeed('ESLint 配置文件生成完成')
  }

  const spinner2 = ora('正在安装依赖...').start()

  // 安装依赖
  await execa('npm', [
    'install',
    '-D',
    'eslint',
    'prettier',
    'eslint-plugin-prettier',
    'eslint-config-prettier',
  ])
  spinner2.succeed('安装依赖完成')
}

// 配置提交规范
async function setupCommit() {
  const spinner = ora('正在生成 Commitlint 配置...').start()

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
  spinner.succeed('生成 Commitlint 配置完成')

  const spinner2 = ora('安装依赖并初始化 Husky、配置 Lint-Staged...').start()

  // 安装依赖并初始化 Husky
  await execa('npm', [
    'install',
    '-D',
    'husky',
    '@commitlint/cli',
    'lint-staged',
    '@commitlint/config-conventional',
  ])
  // await execa('npx', ['husky', 'init'])
  await execa('npx', [
    'husky',
    'init',
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

  spinner2.succeed('安装依赖并初始化 Husky、配置 Lint-Staged 完成')
}

async function setupTs() {
  const spinner = ora('正在生成 tsconfig.json...').start()

  const tsConfig = {
    compilerOptions: {
      target: 'es6',
      module: 'commonjs',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', '**/*.spec.ts'],
  }

  const filePath = 'tsconfig.json'

  fs.writeFileSync(filePath, JSON.stringify(tsConfig, null, 2))

  spinner.succeed('tsconfig.json 生成完成')

  const spinner2 = ora('安装 typescript...').start()

  await execa('npm', ['install', '-D', 'typescript'])

  spinner2.succeed('typescript 安装完成')

  // 修改 package.json 加入 typescript 的启动命令
  const pkgPath = 'package.json'
  const pkg = require(`../${pkgPath}`)
  pkg.scripts.start = 'tsc && node ./dist/index.js'
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2)) // 保存 package.json
  console.log(chalk.green('✅ package.json 修改完成')) // 提示 package.json 修改完成
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
          { name: 'Typescript', value: 'ts' },
        ],
      },
    ])

    // 根据选择执行操作
    if (features.includes('lint')) await setupLint()
    if (features.includes('commit')) await setupCommit()
    if (features.includes('ts')) await setupTs()

    console.log(chalk.green('✅ 配置完成! 请检查并提交变更'))
  } catch (err) {
    console.error(chalk.red('Error:'), err)
  }
}

module.exports = () => {
  return add()
}
