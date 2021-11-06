"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../src/main");
const core = __importStar(require("@actions/core"));
main_1.run()
    .then(() => {
    checkOutcome('pass');
})
    .catch((e) => {
    core.error(e);
    checkOutcome('fail');
});
function checkOutcome(outcome) {
    if (outcome != process.env.EXPECTED_TO) {
        core.error(`Expected outcome did not meet the real outcome. Expected value: ${process.env.EXPECTED_TO}, actual value: ${outcome}`);
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
