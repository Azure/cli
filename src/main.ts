import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as os from 'os';

import { createScriptFile, TEMP_DIRECTORY, START_SCRIPT_EXECUTION, NullOutstreamStringWritable } from './utils';

const BASH_ARG: string = `bash --noprofile --norc -eo pipefail -c "echo '${START_SCRIPT_EXECUTION}' >&2;`;
const CONTAINER_WORKSPACE: string = '/github/workspace';
const CONTAINER_TEMP_DIRECTORY: string = '/_temp';

const run = async () => {

    try {
        if (process.env.RUNNER_OS != 'Linux') {
            core.setFailed('Please use Linux based OS as a runner.');
            return;
        }

        let inlineScript: string = core.getInput('inlineScript', { required: true });
        let azcliversion: string = core.getInput('azcliversion', { required: true }).trim();

        if (!(await checkIfValidCLIVersion(azcliversion))) {
            core.setFailed('Please enter a valid azure cli version. \nSee available versions: https://github.com/Azure/azure-cli/releases.');
            return;
        }

        if (!inlineScript.trim()) {
            core.setFailed('Please enter a valid script.');
            return;
        }
        const scriptFile: string = await createScriptFile(inlineScript);
        let bashCommand: string = ` ${BASH_ARG}${CONTAINER_TEMP_DIRECTORY}/${scriptFile} `;

        /*
        For the docker run command, we are doing the following
        - Set the working directory for docker continer
        - volume mount the GITHUB_WORKSPACE env variable (path where users checkout code is present) to work directory of container
        - voulme mount .azure session token file between host and container,
        - volume mount temp directory between host and container, inline script file is created in temp directory
        */
        let command: string = `run --workdir ${CONTAINER_WORKSPACE} -v ${process.env.GITHUB_WORKSPACE}:${CONTAINER_WORKSPACE} `;
        command += ` -v ${process.env.HOME}/.azure:/root/.azure -v ${TEMP_DIRECTORY}:${CONTAINER_TEMP_DIRECTORY} `;
        command += `-e GITHUB_WORKSPACE=${CONTAINER_WORKSPACE}`;
        command += ` mcr.microsoft.com/azure-cli:${azcliversion} ${bashCommand}`;

        await executeDockerScript(command);
        console.log("az script ran successfully.");
    } catch (error) {
        console.log("Azure CLI action failed.\n\n", error);
        core.setFailed(error.stderr);
    }
};

const checkIfValidCLIVersion = async (azcliversion: string): Promise<boolean> => {
    const allVersions: Array<string> = await getAllAzCliVersions();
    if (!allVersions) {
        return true;
    }
    return allVersions.some((eachVersion) => eachVersion === azcliversion);
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
        throw new Error(`Unable to fetch all az cli versions, please report it as an issue on https://github.com/Azure/CLI/issues. Output: ${outStream}, Error: ${error}`);
    }
    return [];
}

const executeDockerScript = async (dockerCommand: string): Promise<void> => {

    const dockerTool: string = await io.which("docker", true);
    var errorStream: string = '';
    var execOptions: any = {
        outStream: new NullOutstreamStringWritable({ decodeStrings: false }),
        listeners: {
            stdout: (data: any) => console.log(data.toString()), //to log the script output while the script is running.
            errline: (data: any) => {
                if (data.toString().trim() === START_SCRIPT_EXECUTION) {
                    errorStream = ''; // Flush the container logs. After this, script error logs will be tracked.
                }
                else {
                    errorStream += data.toString() + os.EOL;
                }
            }
        }
    };

    try {
        await exec.exec(`"${dockerTool}" ${dockerCommand}`, [], execOptions)
    } catch (error) {
        if (errorStream) {
            throw new Error(errorStream);
        } else {
            throw error;
        }
    }
}

run();