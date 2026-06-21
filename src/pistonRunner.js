const axios = require("axios");

async function runCpp(code, input = "") {
    try {
        const response = await axios.post(
            "https://emkc.org/api/v2/piston/execute",
            {
                language: "cpp",
                version: "10.2.0",
                files: [
                    {
                        content: code,
                    },
                ],
                stdin: input,
            }
        );

        return response.data.run.output;
    }catch (err) {
        return JSON.stringify(
            err.response?.data || err.message
        );
    }
}

module.exports = { runCpp };