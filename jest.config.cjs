const config =
    {
        rootDir: __dirname,
        projects: ["<rootDir>/packages/**/__tests__/*.test.js"],
        reporters: [
            "default",
            ["jest-ctrf-json-reporter", {}],
        ]
    };

module.exports = config;
