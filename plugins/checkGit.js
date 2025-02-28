const fs = require("fs");
const { execSync } = require("child_process");

function checkAndInitGit() {
  const gitDir = ".git";
  if (!fs.existsSync(gitDir)) {
    try {
      execSync("git init");
      console.log("Initialized a new Git repository.");
    } catch (error) {
      console.error("Failed to initialize Git:", error);
    }
  } else {
    console.log("Existing Git repository detected.");
  }
}

module.exports = {
  checkAndInitGit,
};
