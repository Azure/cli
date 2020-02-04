import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as os from 'os';
import * as path from 'path';

import { createScriptFile, TEMP_DIRECTORY, NullOutstreamStringWritable, deleteFile, getCurrentTime, checkIfEnvironmentVariableIsOmitted } from './utils';

const START_SCRIPT_EXECUTION_MARKER: string = `Starting script execution via docker image mcr.microsoft.com/azure-cli:`;
const BASH_ARG: string = `bash --noprofile --norc -e `;
const CONTAINER_WORKSPACE: string = '/github/workspace';
const CONTAINER_TEMP_DIRECTORY: string = '/_temp';

const run = async () => {
    var scriptFileName: string = '';
    const CONTAINER_NAME = `MICROSOFT_AZURE_CLI_${getCurrentTime()}_CONTAINER`;
    try {
        if (process.env.RUNNER_OS != 'Linux') {
            core.setFailed('Please use Linux based OS as a runner.');
            return;
        }

        let inlineScript: string = core.getInput('inlineScript', { required: true });
        let azcliversion: string = core.getInput('azcliversion', { required: true }).trim().toLowerCase();

        if (!(await checkIfValidCLIVersion(azcliversion))) {
            core.setFailed('Please enter a valid azure cli version. \nSee available versions: https://github.com/Azure/azure-cli/releases.');
            return;
        }

        if (!inlineScript.trim()) {
            core.setFailed('Please enter a valid script.');
            return;
        }
        inlineScript = ` set -e >&2; echo '${START_SCRIPT_EXECUTION_MARKER}' >&2; ${inlineScript}`;
        scriptFileName = await createScriptFile(inlineScript);
        let startCommand: string = ` ${BASH_ARG}${CONTAINER_TEMP_DIRECTORY}/${scriptFileName} `;
        let environmentVariables = '';
        for (let key in process.env){
            if(!checkIfEnvironmentVariableIsOmitted(key) && process.env[key]){
                environmentVariables += ` -e "${key}=${process.env[key]}" `;
            }
        }
        /*
        For the docker run command, we are doing the following
        - Set the working directory for docker continer
        - volume mount the GITHUB_WORKSPACE env variable (path where users checkout code is present) to work directory of container
        - voulme mount .azure session token file between host and container,
        - volume mount temp directory between host and container, inline script file is created in temp directory
        */
        let command: string = `run --workdir ${CONTAINER_WORKSPACE} -v ${process.env.GITHUB_WORKSPACE}:${CONTAINER_WORKSPACE} `;
        command += ` -v ${process.env.HOME}/.azure:/root/.azure -v ${TEMP_DIRECTORY}:${CONTAINER_TEMP_DIRECTORY} `;
        command += ` ${environmentVariables} `;
        command += `-e GITHUB_WORKSPACE=${CONTAINER_WORKSPACE} `;
        command += `--name ${CONTAINER_NAME} `;
        command += ` mcr.microsoft.com/azure-cli:${azcliversion} ${startCommand}`;
        console.log(`${START_SCRIPT_EXECUTION_MARKER}${azcliversion}`);
        await executeDockerCommand(command);
        console.log("az script ran successfully.");
    } catch (error) {
        core.error(error);
        core.setFailed(error.stderr);
    }
    finally {
        // clean up
        const scriptFilePath: string = path.join(TEMP_DIRECTORY, scriptFileName);
        await deleteFile(scriptFilePath);
        console.log("cleaning up container...");
        await executeDockerCommand(` container rm --force ${CONTAINER_NAME} `, true);
    }
};

const checkIfValidCLIVersion = async (azcliversion: string): Promise<boolean> => {
    const allVersions: Array<string> = await getAllAzCliVersions();
    if (!allVersions || allVersions.length == 0) {
        return true;
    }
    return allVersions.some((eachVersion) => eachVersion.toLowerCase() === azcliversion);
}

const getAllAzCliVersions = async (): Promise<Array<string>> => {
    var outStream: string = '';
    var execOptions: any = {
        outStream: new NullOutstreamStringWritable({ decodeStrings: false }),
        listeners: {
            stdout: (data: any) => outStream += data.toString() + os.EOL, //outstream contains the list of all the az cli versions
        }
    };

    try {
        await exec.exec(`curl --location -s https://mcr.microsoft.com/v2/azure-cli/tags/list`, [], execOptions)
        if (outStream && JSON.parse(outStream).tags) {
            return JSON.parse(outStream).tags;
        }
    } catch (error) {
        // if output is 404 page not found, please verify the url
        core.warning(`Unable to fetch all az cli versions, please report it as an issue on https://github.com/Azure/CLI/issues. Output: ${outStream}, Error: ${error}`);
    }
    return [];
}

const executeDockerCommand = async (dockerCommand: string, continueOnError: boolean = false): Promise<void> => {

    const dockerTool: string = await io.which("docker", true);
    var errorStream: string = '';
    var shouldOutputErrorStream: boolean = false;
    var execOptions: any = {
        outStream: new NullOutstreamStringWritable({ decodeStrings: false }),
        listeners: {
            stdout: (data: any) => console.log(data.toString()), //to log the script output while the script is running.
            errline: (data: string) => {
                if (!shouldOutputErrorStream) {
                    errorStream += data + os.EOL;
                }
                else {
                    console.log(data);
                }
                if (data.trim() === START_SCRIPT_EXECUTION_MARKER) {
                    shouldOutputErrorStream = true;
                    errorStream = ''; // Flush the container logs. After this, script error logs will be tracked.
                }
            }
        }
    };
    var exitCode;
    try {
        exitCode = await exec.exec(`"${dockerTool}" ${dockerCommand}`, [], execOptions);
    } catch (error) {
        if (!continueOnError) {
            throw error;
        }
        core.warning(error);
    }
    finally {
        if (exitCode !== 0 && !continueOnError) {
            throw new Error(errorStream || 'az cli script failed.');
        }
        core.warning(errorStream)
    }
}

run();
