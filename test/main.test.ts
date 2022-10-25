import { main } from "../src/main";
import * as core from '@actions/core';

// Unit Tests
export async function runTests() {
    try {
        let result = await main()
        return 'pass'
    } catch (e) {
        core.error(JSON.stringify(e))
        return 'fail'
    }
}

runTests().then(outcome => {
    if(outcome != process.env.EXPECTED_TO){
        core.error(`Expected outcome did not meet the real outcome. Expected value: ${process.env.EXPECTED_TO}, actual value: ${outcome}`)
        process.exit(1)
    }
})
