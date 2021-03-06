var fs = require('file');

exports.resolveTechModule = function (path) {
    // Попробовать получить модуль технологии по имени
    try {
        return require('./techs/' + path);
    } catch (ignore) {}

    // Попробовать получить модуль технологии по относительному
    // или абсолютному пути
    try {
        // NOTE: символические ссылки не разворачиваются
        return require(fs.absolute(path));
    } catch (ignore) {}

    // Попробовать получить модуль технологии по пути относительно
    // require.paths
    try {
        return require(path);
    } catch (ignore) {}

    return {
        // FIXME: Подумать, что возвращать вместо фейка объекта модуля
        techModule: {
            id: fs.basename(path, '.js'),
            path: ''
        }
    };
};

exports.Tech = function (path) {
    this.path = path;

    var tech = exports.resolveTechModule(path);
    for (var name in tech) {
        if (Object.prototype.hasOwnProperty.call(tech, name)) {
            this[name] = tech[name];
        }
    }
};

exports.Tech.prototype.bemBuild = function (prefixes, outputDir, outputName) {
    var _this = this,
        content = '';
    this.filterExists(prefixes)
        .map(function (file) {
            return file.from(outputDir);
        })
        .forEach(function (file) {
            content += _this.outFile(file);
        });
    outputDir.join(outputName + '.' + this.getTechName()).write(content);
    return this;
};

exports.Tech.prototype.bemCreate = function (prefix, vars) {
    var file = this.fileByPrefix(prefix);
    file.exists()?
        print('Уже существует ' + file) :
        file.write(this.newFileContent(vars));
    return this;
};

exports.Tech.prototype.filterExists = function (prefixes) {
    var _this = this,
        res = [];
    prefixes.forEach(function (prefix) {
        var file = _this.fileByPrefix(prefix);
        file.exists() && res.push(file);
    });
    return res;
};

exports.Tech.prototype.fileByPrefix = function (prefix) {
    return fs.path(prefix + '.' + this.getTechName());
};

exports.Tech.prototype.outFile = function (file) {
    return file + '\n';
};

exports.Tech.prototype.newFileContent = function () {
    return '';
};

exports.Tech.prototype.getTechName = function () {
    return fs.basename(this.techModule.id, '.js');
};

exports.Tech.prototype.getTechRelativePath = function (bemPath) {
    var bemPath = fs.path(bemPath).join('/'),
        absPath = this.getTechPath();

    // NOTE: Если путь до технологии пустой, значит используется
    // реализация технологии по-умолчанию, и путь надо оставить пустым
    if (absPath == '') {
        return '';
    }

    // FIXME: лучше искать «короткий путь», обдумать критерии такого пути
    var shortestPath = fs.relative(bemPath, absPath);
    require.paths.forEach(function (reqPath) {
        var relPath = fs.relative(fs.path(reqPath).join('/'), absPath);
        if (relPath.length < shortestPath.length) {
            shortestPath = relPath;
        }
    });

    return shortestPath;
};

exports.Tech.prototype.getTechPath = function () {
    return this.techModule.path;
};
