"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var exec = require("@actions/exec");
var io = require("@actions/io");
var os = require("os");
var path = require("path");
var cs = require("credscan-pkg");
var config = require("./config.json");
var utils_1 = require("./utils");
var START_SCRIPT_EXECUTION_MARKER = "Starting script execution via docker image mcr.microsoft.com/azure-cli:";
var BASH_ARG = "bash --noprofile --norc -e ";
var CONTAINER_WORKSPACE = '/github/workspace';
var CONTAINER_TEMP_DIRECTORY = '/_temp';
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var scriptFileName, CONTAINER_NAME, inlineScript, azcliversion, startCommand, command, error_1, scriptFilePath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                scriptFileName = '';
                CONTAINER_NAME = "MICROSOFT_AZURE_CLI_" + utils_1.getCurrentTime() + "_CONTAINER";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, 6, 9]);
                if (process.env.RUNNER_OS != 'Linux') {
                    core.setFailed('Please use Linux based OS as a runner.');
                    return [2 /*return*/];
                }
                inlineScript = core.getInput('inlineScript', { required: true });
                azcliversion = core.getInput('azcliversion', { required: true }).trim().toLowerCase();
                return [4 /*yield*/, checkIfValidCLIVersion(azcliversion)];
            case 2:
                if (!(_a.sent())) {
                    core.setFailed('Please enter a valid azure cli version. \nSee available versions: https://github.com/Azure/azure-cli/releases.');
                    return [2 /*return*/];
                }
                if (!inlineScript.trim()) {
                    core.setFailed('Please enter a valid script.');
                    return [2 /*return*/];
                }
                inlineScript = " set -e >&2; echo '" + START_SCRIPT_EXECUTION_MARKER + "' >&2; " + inlineScript;
                return [4 /*yield*/, utils_1.createScriptFile(inlineScript)];
            case 3:
                scriptFileName = _a.sent();
                startCommand = " " + BASH_ARG + CONTAINER_TEMP_DIRECTORY + "/" + scriptFileName + " ";
                command = "run --workdir " + CONTAINER_WORKSPACE + " -v " + process.env.GITHUB_WORKSPACE + ":" + CONTAINER_WORKSPACE + " ";
                command += " -v " + process.env.HOME + "/.azure:/root/.azure -v " + utils_1.TEMP_DIRECTORY + ":" + CONTAINER_TEMP_DIRECTORY + " ";
                command += "-e GITHUB_WORKSPACE=" + CONTAINER_WORKSPACE + " --name " + CONTAINER_NAME;
                command += " mcr.microsoft.com/azure-cli:" + azcliversion + " " + startCommand;
                console.log("" + START_SCRIPT_EXECUTION_MARKER + azcliversion);
                return [4 /*yield*/, executeDockerCommand(command)];
            case 4:
                _a.sent();
                console.log("az script ran successfully.");
                return [3 /*break*/, 9];
            case 5:
                error_1 = _a.sent();
                core.error(error_1);
                core.setFailed(error_1.stderr);
                return [3 /*break*/, 9];
            case 6:
                scriptFilePath = path.join(utils_1.TEMP_DIRECTORY, scriptFileName);
                return [4 /*yield*/, utils_1.deleteFile(scriptFilePath)];
            case 7:
                _a.sent();
                console.log("cleaning up container...");
                return [4 /*yield*/, executeDockerCommand(" container rm --force " + CONTAINER_NAME + " ", true)];
            case 8:
                _a.sent();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
var checkIfValidCLIVersion = function (azcliversion) { return __awaiter(void 0, void 0, void 0, function () {
    var allVersions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getAllAzCliVersions()];
            case 1:
                allVersions = _a.sent();
                if (!allVersions || allVersions.length == 0) {
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, allVersions.some(function (eachVersion) { return eachVersion.toLowerCase() === azcliversion; })];
        }
    });
}); };
var getAllAzCliVersions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var outStream, execOptions, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                outStream = '';
                execOptions = {
                    outStream: new utils_1.NullOutstreamStringWritable({ decodeStrings: false }),
                    listeners: {
                        stdout: function (data) { return outStream += data.toString() + os.EOL; }
                    }
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, exec.exec("curl --location -s https://mcr.microsoft.com/v2/azure-cli/tags/list", [], execOptions)];
            case 2:
                _a.sent();
                if (outStream && JSON.parse(outStream).tags) {
                    return [2 /*return*/, JSON.parse(outStream).tags];
                }
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                // if output is 404 page not found, please verify the url
                core.warning("Unable to fetch all az cli versions, please report it as an issue on https://github.com/Azure/CLI/issues. Output: " + outStream + ", Error: " + error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, []];
        }
    });
}); };
var printWithCredScan = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var scannedResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                scannedResult = { result: null };
                if (!!config.credScanEnable) return [3 /*break*/, 1];
                console.log(data);
                return [3 /*break*/, 4];
            case 1:
                if (!!process.env.CREDSCAN) return [3 /*break*/, 2];
                console.log(data);
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, cs.credscan(data, scannedResult, 0)];
            case 3:
                _a.sent();
                if (scannedResult.result) {
                    console.log(scannedResult.result);
                }
                else {
                    console.log(data);
                }
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
var executeDockerCommand = function (dockerCommand, continueOnError) {
    if (continueOnError === void 0) { continueOnError = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var dockerTool, errorStream, shouldOutputErrorStream, execOptions, exitCode, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, io.which("docker", true)];
                case 1:
                    dockerTool = _a.sent();
                    errorStream = '';
                    shouldOutputErrorStream = false;
                    execOptions = {
                        outStream: new utils_1.NullOutstreamStringWritable({ decodeStrings: false }),
                        listeners: {
                            stdout: function (data) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    printWithCredScan(data.toString());
                                    return [2 /*return*/];
                                });
                            }); },
                            errline: function (data) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    if (!shouldOutputErrorStream) {
                                        errorStream += data + os.EOL;
                                    }
                                    else {
                                        printWithCredScan(data);
                                    }
                                    if (data.trim() === START_SCRIPT_EXECUTION_MARKER) {
                                        shouldOutputErrorStream = true;
                                        errorStream = ''; // Flush the container logs. After this, script error logs will be tracked.
                                    }
                                    return [2 /*return*/];
                                });
                            }); }
                        }
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 6]);
                    return [4 /*yield*/, exec.exec("\"" + dockerTool + "\" " + dockerCommand, [], execOptions)];
                case 3:
                    exitCode = _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_3 = _a.sent();
                    if (!continueOnError) {
                        throw error_3;
                    }
                    core.warning(error_3);
                    return [3 /*break*/, 6];
                case 5:
                    if (exitCode !== 0 && !continueOnError) {
                        throw new Error(errorStream || 'az cli script failed.');
                    }
                    core.warning(errorStream);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
};
run();
