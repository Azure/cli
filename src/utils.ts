import stream = require('stream');
import * as exec from '@actions/exec';
import * as core from '@actions/core';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export const TEMP_DIRECTORY: string = process.env.RUNNER_TEMP || os.tmpdir();

export const createScriptFile = async (inlineScript: string): Promise<string> => {
    const fileName: string = `AZ_CLI_GITHUB_ACTION_${getCurrentTime().toString()}.sh`;
    const filePath: string = path.join(TEMP_DIRECTORY, fileName);
    try {
        fs.writeFileSync(filePath, `${inlineScript}`);
        console.log(`Script file created at ${filePath}`);
    }
    catch (err) {
        throw new Error(`Unable to write script to file. Error: ${err}`);
    }
    if (fs.existsSync(filePath))
        console.log(`The file: '${filePath}' exists.`);
    try {
        fs.accessSync(filePath);
        console.log(`Access to the script file is available.`);
    }
    catch (err) {
        throw new Error(`Unable to access the script file. Error: ${err}`);
    }
    try {
        await giveExecutablePermissionsToFile(filePath);
        console.log(`Executable permissions given to the script file.`);
    }
    catch (err) {
        throw new Error(`Unable to give executable permissions to the script file. Error: ${err}`);
    }
    return fileName;
}


export const deleteFile = async (filePath: string) => {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        }
        catch (err) {
            core.warning(err.toString());
        }
    }
}

export const giveExecutablePermissionsToFile = async (filePath: string): Promise<number> => await exec.exec('chmod', ['+x', filePath])

export const getCurrentTime = (): number => {
    return new Date().getTime();
}

export class NullOutstreamStringWritable extends stream.Writable {

    constructor(options: any) {
        super(options);
    }

    _write(data: any, encoding: string, callback: Function): void {
        if (callback) {
            callback();
        }
    }
};

export const checkIfEnvironmentVariableIsOmitted = (key: string): boolean => {

    const omitEnvironmentVariables: string [] = [
        'LANG',
        'HOSTNAME',
        'PWD',
        'HOME',
        'PYTHON_VERSION',
        'PYTHON_PIP_VERSION',
        'SHLVL',
        'PATH',
        'GPG_KEY',
        'CONDA',
        'AGENT_TOOLSDIRECTORY',
        'RUNNER_PERFLOG',
        'RUNNER_WORKSPACE',
        'RUNNER_TEMP',
        'RUNNER_TRACKING_ID',
        'RUNNER_TOOL_CACHE',
        'DOTNET_SKIP_FIRST_TIME_EXPERIENCE',
        'JOURNAL_STREAM',
        'DEPLOYMENT_BASEPATH',
        'VCPKG_INSTALLATION_ROOT',
        'PERFLOG_LOCATION_SETTING'
    ];

    const omitEnvironmentVariablesWithPrefix: string [] = [
        'JAVA_',
        'LEIN_',
        'M2_',
        'BOOST_',
        'GOROOT',
        'ANDROID_',
        'GRADLE_',
        'ANT_',
        'CHROME',
        'SELENIUM_',
        'INPUT_'
    ];
    for (let i = 0; i < omitEnvironmentVariables.length; i++){
        if (omitEnvironmentVariables[i] === key.toUpperCase()){
            return true;
        }
    }

    return omitEnvironmentVariablesWithPrefix.some((prefix: string) => key.toUpperCase().startsWith(prefix));
}
