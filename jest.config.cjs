const config =
    {
        "rootDir": (__dirname + "/__tests__/"),
        reporters: [
            "default",
            ["jest-ctrf-json-reporter", {}],
        ]
    };

module.exports = config;
