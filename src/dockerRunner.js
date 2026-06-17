const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function runCpp(code, input = "") {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(__dirname, "temp");

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const fileName = `code_${Date.now()}.cpp`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, code);

        const docker = spawn("docker", [
            "run",
            "--rm",
            "-i",
            "-v",
            `${tempDir}:/app`,
            "gcc:latest",
            "bash",
            "-c",
            `
            g++ /app/${fileName} -o /app/output &&
            echo "${input}" | /app/output
            `,
        ]);

        let output = "";
        let error = "";

        docker.stdout.on("data", (data) => {
            output += data.toString();
        });

        docker.stderr.on("data", (data) => {
            error += data.toString();
        });

       docker.on("close", () => {

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (error.trim()) {
                resolve(error);
            } else {
                resolve(output || "No output");
             }
        });
    });
}

module.exports = { runCpp };