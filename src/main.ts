import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as io from '@actions/io';
import { getScriptFileName, giveExecutablePermissionsToFile, executeScript, pathToTempDirectory, ExecuteScriptModel, FileNameModel } from './utils';

const bashArg = 'bash --noprofile --norc -eo pipefail';

const run = async () => {

    try {
        if (process.env.RUNNER_OS != 'Linux') {
            core.setFailed('Please use Linux OS as a runner.');
            return;
        }
        let inlineScript: string = core.getInput('inlineScript');
        let azcliversion: string = core.getInput('azcliversion').trim();

        if (!(await checkIfValidVersion(azcliversion))) {
            core.setFailed('Please enter a valid azure cli version.');
            return;
        }
        if (!inlineScript.trim()) {
            core.setFailed('Please enter a valid script.');
            return;
        }
        const { fileName, fullPath } = <FileNameModel>getScriptFileName();
        fs.writeFileSync(path.join(fullPath), `${inlineScript}`);
        await giveExecutablePermissionsToFile(fullPath);

        let bashCommand: string = ` ${bashArg} /_temp/${fileName} `;
        let command: string = `run --workdir /github/workspace -v ${process.env.GITHUB_WORKSPACE}:/github/workspace `;
        command += ` -v /home/runner/.azure:/root/.azure -v ${pathToTempDirectory}:/_temp `;
        command += ` mcr.microsoft.com/azure-cli:${azcliversion} ${bashCommand}`;
        await executeDockerScript(command);
        console.log("az script ran successfully.");
    } catch (error) {
        console.log("az CLI GitHub action failed.\n\n",error);
        core.setFailed(error.stderr);
    }
};

const checkIfValidVersion = async (azcliversion: string): Promise<boolean> => {
    const allVersions: Array<string> = await getAllAzCliVersions();
    for (let i: number = allVersions.length - 1; i >= 0; i--) {
        if (allVersions[i].trim() === azcliversion) {
            return true;
        }
    }
    return false;
}

const getAllAzCliVersions = async (): Promise<Array<string>> => {

    const { outStream, errorStream, errorCaught } = <ExecuteScriptModel>await executeScript(`curl --location -s https://mcr.microsoft.com/v2/azure-cli/tags/list`);
    try{
        if (outStream && JSON.parse(outStream).tags) {
            return JSON.parse(outStream).tags;
        }
    } catch (error) {
        throw new Error(`Unable to fetch all az cli versions, please report it as a issue. outputstream contains ${outStream}, error = ${errorStream}\n${errorCaught}`);
    }
    return [];
}

const executeDockerScript = async (dockerCommand: string): Promise<void> => {
    const dockerPath: string = await io.which("docker", true);
    const { outStream, errorStream, errorCaught } = <ExecuteScriptModel>await executeScript(dockerCommand, dockerPath);
    console.log(outStream);
    if (errorCaught) {
        throw new Error(`az CLI script failed, Please check the script.\nPlease refer the script error at the end after docker logs.\n\nDocker logs...\n${errorStream}.`);
    }
}

run();