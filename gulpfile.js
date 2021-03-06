'use strict';

var babel = require("gulp-babel"),
    babelify = require("babelify"),
    Browserify = require('browserify'),
    Config = require('./gulpfile.config'),
    conventionalChangelog = require('gulp-conventional-changelog'),
    del = require('del'),
    electron = require('gulp-electron'),
    fs = require('fs'),
    git = require('gulp-git'),
    glob = require('glob'),
    gulp = require('gulp'),
    inject = require('gulp-inject'),
    inno = require('gulp-inno'),
    insert = require('gulp-insert'),
    jasmine = require('gulp-jasmine'),
    less = require('gulp-less'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename'),
    replace = require('gulp-batch-replace'),
    runSequence = require('run-sequence'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    spawn = require('child_process').spawn,
    SpecReporter = require('jasmine-spec-reporter'),
    tsc = require('gulp-typescript'),
    transform = require('vinyl-transform'),
    typescript = require('typescript');
//zip = require('gulp-zip');

var config = new Config();
var tsconfig = tsc.createProject('tsconfig.json', { typescript: typescript });
var packageJson = require('./package.json');

gulp.task('copy-jsx-test', function () {
    return gulp.src("./src/**/*.jsx")
        .pipe(babel({ stage: 0 }))
        .pipe(gulp.dest("./tests/out/src/"));
});

gulp.task('compile-test', ['copy-jsx-test'], function () {
    var sourceTsFiles = ["./tests/specs/**/*.{ts,tsx}",
        "./tools/typings/**/*.ts",
        "./src/**/*.{ts,tsx}",
        config.appTypeScriptReferences];

    var tsResult = gulp.src(sourceTsFiles)
        .pipe(tsc(tsconfig));

    tsResult.dts.pipe(gulp.dest("./tests/out/"));

    return tsResult.js
        .pipe(babel({ stage: 0 }))
        .pipe(gulp.dest("./tests/out/"))
});

gulp.task('test', ['compile-test'], function (done) {
    process.env.NODE_ENV = 'development';
    global.electronRequire = require;
    var child = require('child_process').fork('./tests/run.js', [], { stdio: [null, null, null, 'ipc'] });

    child.on('exit', function (code) {
        if (code > 0) {
            done('Unit test failed');
        } else {
            done();
        }
    });
    // return gulp.src('./tests/out/tests/specs/**/*.js')
    //     .pipe(jasmine({ includeStackTrace: true, reporter: new SpecReporter() }));
});

/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */
gulp.task('clean-ts', function (cb) {
    var typeScriptGenFiles = [config.tsOutputPath + '**/*.*'];

    // delete the files
    del(typeScriptGenFiles, cb);
    cb();
});

/**
 * Generates the app.d.ts references file dynamically from all application *.ts files.
 */
gulp.task('gen-ts-refs', ['clean-ts'], function () {
    var target = gulp.src(config.appTypeScriptReferences);
    var sources = gulp.src(config.allTypeScript, { read: false });
    return target.pipe(inject(sources, {
        starttag: '//{',
        endtag: '//}',
        transform: function (filepath) {
            return '/// <reference path="../..' + filepath + '" />';
        }
    })).pipe(gulp.dest(config.typings));
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', ['gen-ts-refs'], function () {
    var sourceTsFiles = [config.allTypeScript,                //path to typescript files
        config.libraryTypeScriptDefinitions, //reference to library .d.ts files
        config.appTypeScriptReferences];     //reference to app.d.ts files

    var tsResult = gulp.src(sourceTsFiles)
        .pipe(sourcemaps.init())
        .pipe(tsc(tsconfig));

    tsResult.dts.pipe(gulp.dest(config.tsOutputPath));

    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.tsOutputPath))
});

// gulp.task('append-runner', ['compile-ts'], function () {
//     return gulp.src(config.tsOutputPath + "program.js")
//         .pipe(insert.append('\n\ndocument.addEventListener("DOMContentLoaded", function(e){require("./Program").main();});'))
//         .pipe(gulp.dest(config.tsOutputPath))
// });

gulp.task('copy-jsx', function () {
    return gulp.src(config.source + '**/*.jsx')
        .pipe(babel({ stage: 0 }))
        .pipe(gulp.dest(config.tsOutputPath))
});

gulp.on('err', function (e) {
    console.log(e.err.stack);
});

gulp.task('browserify-bundle', ['copy-jsx', 'compile-ts'], function (cb) {
    var babelifyStep = babelify.configure({ stage: 0 });

    var allFiles = glob.sync(config.tsOutputPath + "**/*.{js,jsx}", { ignore: [config.tsOutputPath + 'index.js', config.tsOutputPath + 'stdio-redirect.js'] });
    var bundler = new Browserify({
        entries: allFiles,
        transform: [babelifyStep]
    });
    return bundler
        .bundle()
        .pipe(source('program.js'))
        .pipe(gulp.dest(config.compiled));
});

gulp.task('browserify-copy_node_modules', function () {
    var modules = ["ansi", "are-we-there-yet", "asn1", "assert-plus", "assert-plus", "async", "aws-sign2",
        "bl", "bluebird", "boolbase", "boom",
        "caseless", "cheerio", "combined-stream", "core-util-is", "cryptiles", "css-select", "css-what",
        "dashdash", "delayed-stream", "delegates", "dom-serializer", "domelementtype", "domhandler", "domutils",
        "ecc-jsbn", "entities", "extend", "extsprintf",
        "facebook-chat-api", "fast-download", "forever-agent", "form-data", "form-data-rc3",
        "gauge", "generate-function",
        "generate-object-property",
        "har-validator", "has-unicode", "hawk", "hoek", "htmlparser2", "http-signature",
        "inherits", "isarray", "is-my-json-valid", "is-property", "is-typedarray", "isstream",
        "jodid25519", "jsbn", "json-schema", "json-stringify-safe", "jsonpointer", "jsprim",
        "lodash", "lodash._basetostring", "lodash._createpadding", "lodash._getnative", "lodash.debounce", "lodash.pad", "lodash.padleft", "lodash.padright", "lodash.repeat",
        "mime-db", "mime-types",
        "node-uuid", "npmlog", "nth-check",
        "oauth-sign",
        "pinkie-promise", "process-nextick-args",
        "qs",
        "readable-stream", "request",
        "sntp", "sshpk", "string_decoder", "stringstream",
        "tough-cookie", "tunnel-agent", "tweetnacl",
        "util-deprecate",
        "verror",
        "xtend"]
        .map(function (x) { return './node_modules/' + x + '/**/*'; });
    return gulp.src(modules, { "base": "." })
        .pipe(gulp.dest('./out/compile/'));
});

gulp.task('browserify', function (cb) {
    return runSequence('browserify-bundle', 'browserify-copy_node_modules', cb);
});

gulp.task('less', function () {
    return gulp.src(config.source + 'styles/**/*.less')
        .pipe(less())
        .pipe(gulp.dest(config.compiled + '/styles'));
});

gulp.task('font-awesome', function () {
    return gulp.src(config.source + 'styles/font-awesome/**/*.*')
        .pipe(gulp.dest(config.compiled + '/styles/font-awesome'));
});

gulp.task('min-emoji', function () {
    return gulp.src(config.source + 'styles/min-emoji/**/*.*')
        .pipe(gulp.dest(config.compiled + '/styles/min-emoji'));
});

gulp.task('3rd-party-assets', ['font-awesome', 'min-emoji']);

gulp.task('copy-static', function () {
    gulp.src('./out/js/index.js')
        .pipe(babel({ stage: 0 }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.compiled));

    gulp.src('./out/js/stdio-redirect.js')
        .pipe(babel({ stage: 0 }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.compiled));

    return gulp.src(['./src/index.html', './package.json'])
        .pipe(gulp.dest(config.compiled));
});

var electronVersion = 'v0.35.0';

gulp.task('atom-kill', function (cb) {
    if (process.platform == 'win32') {
        spawn('taskkill', ["/im", "fb-messenger.exe", "/f", "/t"]);
    } else {
        spawn('killall', ['-I', '-w', 'fb-messenger.exe']);
    }
    cb();
});

gulp.task('atom-clean', function (cb) {
    return del('./electron/build/**/*.*', cb);
});

gulp.task('atom-create', ['atom-clean', 'browserify', 'copy-static'], function () {
    return gulp.src("")
        .pipe(electron({
            src: './out/compile',
            packageJson: packageJson,
            release: './electron/build',
            cache: './electron/cache',
            version: electronVersion,
            packaging: false,
            asar: true,
            platforms: ['win32-ia32'],//, 'darwin-x64'],
            platformResources: {
                // darwin: {
                //     CFBundleDisplayName: packageJson.name,
                //     CFBundleIdentifier: packageJson.name,
                //     CFBundleName: packageJson.name,
                //     CFBundleVersion: packageJson.version,
                //     icon: 'fb-messenger.icns'
                // },
                win: {
                    "version-string": packageJson.version,
                    "file-version": packageJson.version,
                    "product-version": packageJson.version,
                    "icon": 'fb-messenger.ico'
                }
            }
        }))
        .pipe(gulp.dest(""));
});

gulp.task("atom-copy", function () {
    var curOutputPath = "./electron/build/" + electronVersion + "/win32-ia32/**/*";
    var dest = "./electron/fb-messenger/" + packageJson.version;
    gulp.src(curOutputPath).pipe(gulp.dest(dest));
    gulp.src("./restart.bat").pipe(gulp.dest("./electron/fb-messenger/"));
});

gulp.task('atom', ['less', '3rd-party-assets'], function (cb) {
    return runSequence('atom-clean', 'atom-create', cb);
});

gulp.task('atom-run', function (cb) {
    runSequence('atom-kill', 'atom', 'atom-copy', function () {
        setTimeout(function () {
            var child = spawn("./electron/fb-messenger/" + packageJson.version + "/fb-messenger.exe", [], { detached: true });
            child.on('error', function (err) {
                console.log('Failed to start child process.%o', err);
            });
            child.unref();
            cb();
        }, 1500);
    });
});

gulp.task('watch', function () {
    gulp.watch([config.allTypeScript, config.source + '**/*.jsx'], ['atom-run']);
});

gulp.task('inno-script-transform', function () {
    return gulp.src('./installer_script.iss').pipe(replace([
        ["{{appname}}", packageJson.name],
        ["{{appver}}", packageJson.version],
        ["{{outputfilename}}", packageJson.name + "-setup"],
        ["{{OutputDir}}", "./installer"],
        ["{{PackageFiles}}", "./electron/build/" + electronVersion + "/win32-ia32/*.*"]
    ]))
        .pipe(rename("installer_script.temp.iss"))
        .pipe(gulp.dest('./'));
});

gulp.task('inno-script-exec', function () {
    return gulp.src('./installer_script.temp.iss')
        .pipe(inno());
});

gulp.task('build', function (cb) {
    return runSequence('test', 'browserify', 'copy-static', 'less', '3rd-party-assets', cb);
});

gulp.task('package-win32', ['build'], function (cb) {
    return runSequence('atom', 'inno-script-transform', 'inno-script-exec', function () {
        console.log("deleting temporary installer_script...");
        del('./installer_script.temp.iss');

        if (cb) cb();
    });
});

gulp.task('run', function (cb) {
    return runSequence('atom-run', 'watch', cb);
});

gulp.task('release-notes', function () {
    return gulp.src("./release-notes.md").pipe(insert.transform(function (contents, file) {
        return "";
    })).pipe(conventionalChangelog({
        preset: 'angular',
        releaseCount: 1
    }))
        .pipe(insert.prepend('#Release :' + packageJson.version + "\n"))
        .pipe(gulp.dest('./'));
});

gulp.task("change-logs", function () {
    return gulp.src("./CHANGELOG.md").pipe(conventionalChangelog({
        preset: 'angular',
        releaseCount: 1
    }))
        .pipe(gulp.dest('./'));
});

gulp.task("commit-and-push", function (callback) {
    console.log("after run sequence");
    git.exec({ args: 'commit -a -m "Generated release-notes and change-logs"' }, function (err, stdout) {
        console.log(stdout);
        if (err) throw err;
        console.log("after commit");
        fs.readFile("./Release-notes.md", 'utf8', function (err, data) {
            if (err) throw err;
            git.exec({ args: "tag -a " + packageJson.version + " -F ./release-notes.md" }, function (err, stdout) {
                if (err) {
                    git.reset("HEAD~1", { args: "--hard" }, function () {
                        throw err;
                    });
                } else {
                    git.push("origin", "master", { args: "--follow-tags" }, function (err) {
                        if (err) throw err;
                        git.checkout("develop", function (err) {
                            if (err) throw err;
                            git.merge("master", function (err) {
                                if (err) throw err;
                                git.push("origin", "develop", function (err) {
                                    if (err) throw err;
                                    git.checkout("master", function (err) {
                                        if (err) throw err;
                                        git.checkout("release-" + packageJson.version, { args: "-b" }, function (err) {
                                            if (err) throw err;
                                            callback();
                                        });
                                    });
                                })
                            });
                        });
                    });
                }
            });
        });
    });
});

gulp.task("release", function (callback) {
    git.checkout("master", function (err) {
        if (err) throw err;
        git.merge('develop', function (err) {
            if (err) throw err;
            runSequence(["release-notes", "change-logs"], "commit-and-push", callback);
        });
    });
});

gulp.task('default', ['build']);
