import { setFailed } from '@actions/core';
import { main } from './main';

main()
    .then(() => {
        process.exit(0)
    })
    .catch((err: Error) => {
        setFailed(err.message);
        process.exit(1);
    });