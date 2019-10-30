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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const os = __importStar(require("os"));
const utils_1 = require("./utils");
const START_SCRIPT_EXECUTION_MARKER = 'Azure CLI GitHub Action: Starting script execution';
const BASH_ARG = `bash --noprofile --norc -eo pipefail -c "echo '${START_SCRIPT_EXECUTION_MARKER}' >&2;`;
const CONTAINER_WORKSPACE = '/github/workspace';
const CONTAINER_TEMP_DIRECTORY = '/_temp';
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (process.env.RUNNER_OS != 'Linux') {
            core.setFailed('Please use Linux based OS as a runner.');
            return;
        }
        let inlineScript = core.getInput('inlineScript', { required: true });
        let azcliversion = core.getInput('azcliversion', { required: true }).trim().toLowerCase();
        if (!(yield checkIfValidCLIVersion(azcliversion))) {
            core.setFailed('Please enter a valid azure cli version. \nSee available versions: https://github.com/Azure/azure-cli/releases.');
            return;
        }
        if (!inlineScript.trim()) {
            core.setFailed('Please enter a valid script.');
            return;
        }
        const scriptFile = yield utils_1.createScriptFile(inlineScript);
        let startCommand = ` ${BASH_ARG}${CONTAINER_TEMP_DIRECTORY}/${scriptFile} `;
        /*
        For the docker run command, we are doing the following
        - Set the working directory for docker continer
        - volume mount the GITHUB_WORKSPACE env variable (path where users checkout code is present) to work directory of container
        - voulme mount .azure session token file between host and container,
        - volume mount temp directory between host and container, inline script file is created in temp directory
        */
        let command = `run --workdir ${CONTAINER_WORKSPACE} -v ${process.env.GITHUB_WORKSPACE}:${CONTAINER_WORKSPACE} `;
        command += ` -v ${process.env.HOME}/.azure:/root/.azure -v ${utils_1.TEMP_DIRECTORY}:${CONTAINER_TEMP_DIRECTORY} `;
        command += `-e GITHUB_WORKSPACE=${CONTAINER_WORKSPACE}`;
        command += ` mcr.microsoft.com/azure-cli:${azcliversion} ${startCommand}`;
        yield executeDockerScript(command);
        console.log("az script ran successfully.");
    }
    catch (error) {
        console.log("Azure CLI action failed.\n\n", error);
        core.setFailed(error.stderr);
    }
});
const checkIfValidCLIVersion = (azcliversion) => __awaiter(void 0, void 0, void 0, function* () {
    const allVersions = yield getAllAzCliVersions();
    if (!allVersions || allVersions.length == 0) {
        return true;
    }
    return allVersions.some((eachVersion) => eachVersion.toLowerCase() === azcliversion);
});
const getAllAzCliVersions = () => __awaiter(void 0, void 0, void 0, function* () {
    var outStream = '';
    var execOptions = {
        outStream: new utils_1.NullOutstreamStringWritable({ decodeStrings: false }),
        listeners: {
            stdout: (data) => outStream += data.toString() + os.EOL,
        }
    };
    try {
        yield exec.exec(`curl --location -s https://mcr.microsoft.com/v2/azure-cli/tags/list`, [], execOptions);
        if (outStream && JSON.parse(outStream).tags) {
            return JSON.parse(outStream).tags;
        }
    }
    catch (error) {
        // if output is 404 page not found, please verify the url
        core.warning(`Unable to fetch all az cli versions, please report it as an issue on https://github.com/Azure/CLI/issues. Output: ${outStream}, Error: ${error}`);
    }
    return [];
});
const executeDockerScript = (dockerCommand) => __awaiter(void 0, void 0, void 0, function* () {
    const dockerTool = yield io.which("docker", true);
    var errorStream = '';
    var execOptions = {
        outStream: new utils_1.NullOutstreamStringWritable({ decodeStrings: false }),
        listeners: {
            stdout: (data) => console.log(data.toString()),
            errline: (data) => {
                if (data.toString().trim() === START_SCRIPT_EXECUTION_MARKER) {
                    errorStream = ''; // Flush the container logs. After this, script error logs will be tracked.
                }
                else {
                    errorStream += data.toString() + os.EOL;
                }
            }
        }
    };
    try {
        yield exec.exec(`"${dockerTool}" ${dockerCommand}`, [], execOptions);
    }
    catch (error) {
        if (errorStream) {
            throw new Error(errorStream);
        }
        else {
            throw error;
        }
    }
});
run();
