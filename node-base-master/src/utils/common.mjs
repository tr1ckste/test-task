/**
 * checks if objects are deep equal
 * (properties order is important)
 * @param {object} firstObject 
 * @param {object} secondObject 
 * @returns {boolean}
 */
export const checkIfEqual = (firstObject, secondObject) =>
    JSON.stringify(firstObject) === JSON.stringify(secondObject);
