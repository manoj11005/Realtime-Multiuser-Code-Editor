// const { spawn } = require("child_process");
// const fs = require("fs");
// const path = require("path");

// function runCpp(code, input = "") {
//     return new Promise((resolve, reject) => {
//         const tempDir = path.join(__dirname, "temp");

//         if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir);
//         }

//         const fileName = `code_${Date.now()}.cpp`;
//         const filePath = path.join(tempDir, fileName);

//         fs.writeFileSync(filePath, code);

//         const docker = spawn("docker", [
//             "run",
//             "--rm",
//             "-i",
//             "-v",
//             `${tempDir}:/app`,
//             "gcc:latest",
//             "bash",
//             "-c",
//             `
//             g++ /app/${fileName} -o /app/output &&
//             echo "${input}" | /app/output
//             `,
//         ]);

//         let output = "";
//         let error = "";

//         docker.stdout.on("data", (data) => {
//             output += data.toString();
//         });

//         docker.stderr.on("data", (data) => {
//             error += data.toString();
//         });

//        docker.on("close", () => {

//             if (fs.existsSync(filePath)) {
//                 fs.unlinkSync(filePath);
//             }

//             if (error.trim()) {
//                 resolve(error);   
//             } else {
//                 resolve(output || "No output");
//              }
//         });
//     });
// }

// module.exports = { runCpp };










const axios = require("axios");

// Free public Judge0 CE endpoint - no API key, no signup, no card required
const BASE_URL = "https://ce.judge0.com";

// Judge0 language id for C++ (GCC 9.2.0)
const CPP_LANGUAGE_ID = 54;

function base64Encode(str) {
    return Buffer.from(str || "", "utf-8").toString("base64");
}

function base64Decode(str) {
    return Buffer.from(str || "", "base64").toString("utf-8");
}

async function runCpp(code, input = "") {
    try {
        const submitResponse = await axios.post(
            `${BASE_URL}/submissions?base64_encoded=true&wait=true`,
            {
                source_code: base64Encode(code),
                language_id: CPP_LANGUAGE_ID,
                stdin: base64Encode(input),
            },
            {
                headers: {
                    "content-type": "application/json",
                },
            }
        );

        const result = submitResponse.data;

        // Compilation error
        if (result.compile_output) {
            return base64Decode(result.compile_output);
        }

        // Runtime error / stderr
        if (result.stderr) {
            return base64Decode(result.stderr);
        }

        // Normal output
        if (result.stdout) {
            return base64Decode(result.stdout);
        }

        // Other statuses (e.g. Time Limit Exceeded)
        if (result.status && result.status.description) {
            return result.status.description;
        }

        return "No output";
    } catch (err) {
        return JSON.stringify(
            err.response?.data || err.message
        );
    }
}

module.exports = { runCpp };