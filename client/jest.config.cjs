module.exports = {
    transform: {
        '^.+\\.[t|j]sx?$': 'babel-jest',
    },
    moduleNameMapper: {
        '^react$': 'preact/compat',
        '^react-dom$': 'preact/compat',
        '^react-dom/test-utils$': 'preact/test-utils',
        '^react/jsx-runtime$': 'preact/jsx-runtime',
        '^react/jsx-dev-runtime$': 'preact/jsx-dev-runtime',
    },
};
