import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
const util = require('util');
const cpExec = util.promisify(require('child_process').exec);

import { createScriptFile, TEMP_DIRECTORY, NullOutstreamStringWritable, deleteFile, getCurrentTime, checkIfEnvironmentVariableIsOmitted } from './utils';

const START_SCRIPT_EXECUTION_MARKER: string = "Starting script execution via docker image mcr.microsoft.com/azure-cli:";
const AZ_CLI_VERSION_DEFAULT_VALUE = 'agentazcliversion'
const prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
const AZ_CLI_TAG_lIST_URL = "https://mcr.microsoft.com/v2/azure-cli/tags/list";

export async function main() {
    let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
    let actionName = 'AzureCLIAction';
    let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS/${actionName}@v2_${usrAgentRepo}_${process.env.RUNNER_ENVIRONMENT}_${process.env.GITHUB_RUN_ID}`;
    process.env.AZURE_HTTP_USER_AGENT = userAgentString;

    var scriptFileName: string = '';
    const CONTAINER_NAME = `MICROSOFT_AZURE_CLI_${getCurrentTime()}_CONTAINER`;
    try {
        if (process.env.RUNNER_OS != 'Linux') {
            throw new Error('Please use Linux-based OS as a runner.');
        }

        let inlineScript: string = core.getInput('inlineScript', { required: true });
        let azcliversion: string = core.getInput('azcliversion', { required: false }).trim().toLowerCase();

        if (azcliversion == AZ_CLI_VERSION_DEFAULT_VALUE) {
            try {
                const { stdout } = await cpExec('az version');
                azcliversion = JSON.parse(stdout)["azure-cli"]
            } catch (err) {
                console.log('Failed to fetch az cli version from agent. Reverting back to latest.')
                azcliversion = 'latest'
            }
        }

        if (!(await checkIfValidCLIVersion(azcliversion))) {
            core.error('Please enter a valid azure cli version. \nSee available versions: https://github.com/Azure/azure-cli/releases.');
            throw new Error('Please enter a valid azure cli version. \nSee available versions: https://github.com/Azure/azure-cli/releases.')
        }

        if (!inlineScript.trim()) {
            core.error('Please enter a valid script.');
            throw new Error('Please enter a valid script.')
        }
        inlineScript = ` set -e >&2; echo '${START_SCRIPT_EXECUTION_MARKER}' >&2; ${inlineScript}`;
        scriptFileName = await createScriptFile(inlineScript);

        const hostAzureConfigDir = process.env.AZURE_CONFIG_DIR || path.join(process.env.HOME, '.azure');
        const containerAzureConfigDir = '/root/.azure';
        
        /*
        For the docker run command, we are doing the following
        - Set the working directory for docker continer
        - volume mount the GITHUB_WORKSPACE env variable (path where users checkout code is present) to work directory of container
        - volume mount Azure config directory between host and container,
        - volume mount temp directory between host and container, inline script file is created in temp directory
        */
        let args: string[] = ["run", "--workdir", `${process.env.GITHUB_WORKSPACE}`,
            "-v", `${process.env.GITHUB_WORKSPACE}:${process.env.GITHUB_WORKSPACE}`,
            "-v", `${hostAzureConfigDir}:${containerAzureConfigDir}`,
            "-v", `${TEMP_DIRECTORY}:${TEMP_DIRECTORY}`
        ];
        for (let key in process.env) {
            if (!checkIfEnvironmentVariableIsOmitted(key) && process.env[key]) {
                args.push("-e", `${key}=${process.env[key]}`);
            }
        }
        args.push("--name", CONTAINER_NAME,
            `mcr.microsoft.com/azure-cli:${azcliversion}`,
            "bash", "--noprofile", "--norc", "-e", `${TEMP_DIRECTORY}/${scriptFileName}`);

        console.log(`${START_SCRIPT_EXECUTION_MARKER}${azcliversion}`);
        await executeDockerCommand(args);
        console.log("az script ran successfully.");
    }
    catch (error) {
        core.error(error);
        throw error;
    }
    finally {
        // clean up
        const scriptFilePath: string = path.join(TEMP_DIRECTORY, scriptFileName);
        await deleteFile(scriptFilePath);
        console.log("cleaning up container...");
        await executeDockerCommand(["rm", "--force", CONTAINER_NAME], true);
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
    try {
        const response = await fetch(AZ_CLI_TAG_lIST_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, errorText: ${errorText}`);
        }
        const data = await response.json();
        if (data && data.tags) {
            return data.tags;
        }
        else {
            throw new Error('Response data does not contain tags.');
        }
    }
    catch (error) {
        core.warning(`Unable to fetch all az cli versions with Error: ${error}. Skipping the version check.`);
    }
    return [];
};

const executeDockerCommand = async (args: string[], continueOnError: boolean = false): Promise<void> => {
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
        exitCode = await exec.exec(dockerTool, args, execOptions);
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
