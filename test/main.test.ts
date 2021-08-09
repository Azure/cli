import { run } from "../src/main";
import * as core from '@actions/core';

run()
    .then(() => {
        checkOutcome('pass')
    })
    .catch((e) => {
        core.error(e)
        checkOutcome('fail')
    });

function checkOutcome(outcome){
    if(outcome != process.env.EXPECTED_TO){
        core.error(`Expected outcome did not meet the real outcome. Expected value: ${process.env.EXPECTED_TO}, actual value: ${outcome}`)
        process.exit(1)
    } else{
        process.exit(0)
    }
}
