// runScript.js
const { exec } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const path = require("path");

/**
 * Runs a bash script and logs whether it executed successfully.
 * @param {string} scriptPath - Path to the bash script file.
 */
const runBashScript = (scriptPath) => {
  return new Promise((resolve) => {
    if (!existsSync(scriptPath)) {
      console.error(`Script not found: ${scriptPath}`);
      process.exit(1);
    }

    const absolutePath = path.resolve(scriptPath);

    console.log(`\n▶ Running bash script: ${absolutePath}`);

    exec(`bash ${absolutePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        console.error(`Exit code: ${error.code}`);
        if (stderr) console.error(`stderr:\n${stderr}`);
        process.exit(1);
      } else {
        console.log(`Script executed successfully.`);
        if (stdout.trim()) console.log(`\nOutput:\n${stdout}`);
        resolve();
      }
    });
  });
}

module.exports = runBashScript;
