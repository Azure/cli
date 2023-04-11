import { main } from "../src/main";

// Unit Tests
async function runTestLocally(azCliVersion: string, inlineScript: string, expectedOutcome: string){
    process.env.RUNNER_OS = 'Linux';
    process.env.GITHUB_WORKSPACE = process.env.PWD;
    process.env.INPUT_AZCLIVERSION = azCliVersion;
    process.env.INPUT_INLINESCRIPT = inlineScript;
    process.env.EXPECTED_OUTCOME = expectedOutcome;

    try {
        await main();
        return 'pass';
    } catch (e) {
        console.error(JSON.stringify(e));
        return 'failed';
    }
}

async function runTestsLocally() {
    const tests = [
        {
            name: 'Azure CLI Version test',
            version: '2.0.72',
            inlineScript: `
                az account show
                az storage -h
            `,
            expectedOutcome: 'pass'
        },
        {
            name: 'Azure CLI Version test with invalid version',
            version: '0',
            inlineScript: `
                az account show
                az storage -h
            `,
            expectedOutcome: 'failed'
        },
        {
            name: 'Azure CLI InlineScript test with empty inlineScript',
            version: '2.0.72',
            inlineScript: undefined,
            expectedOutcome: 'failed'
        }
    ];

    for (const test of tests) {
        console.log(`\u001b[34mStart to run ${test.name}...\u001b[0m`);
        const outcome = await runTestLocally(test.version, test.inlineScript, test.expectedOutcome);
        if (outcome !== test.expectedOutcome) {
            console.error(`\u001b[31mExpected outcome did not meet the real outcome. Expected value: ${test.expectedOutcome}, actual value: ${outcome}.\u001b[0m`);
            process.exit(1);
        }
        else{
            console.log('\u001b[32mSuccess: Test passed.\u001b[0m');
        }
    }
}

runTestsLocally();
