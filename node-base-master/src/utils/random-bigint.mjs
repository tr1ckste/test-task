import {webcrypto} from "crypto";

/**
 *
 * @param object
 * @returns {bigint}
 */
export const randomBigIntNotInKeys = (object) => {
    do {
        const [n] = webcrypto.getRandomValues(new BigUint64Array(1));
        if (!object[n]) {
            return n;
        }
    } while (true);
};
