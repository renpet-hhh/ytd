/*interface ResolverOptions {
    basedir: string,
    browser: bool,
    defaultResolver: "function(request, options)",
    extensions: string[],
    moduleDirectory: string[],
    paths: string[],
    rootDir: string[]
}*/
const path = require('path');
module.exports = (modulePath, options) => {
    if (modulePath.startsWith("src/")) {
        modulePath = path.join(options.rootDir, modulePath);
    }
    return options.defaultResolver(modulePath, options);
}