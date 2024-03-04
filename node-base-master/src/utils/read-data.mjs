/**
 *
 * @param stream
 * @returns {Promise<Buffer>}
 */
export const readWholeStream = (stream) => {
    const chunks = [];
    let currentLength = 0;
    return new Promise((resolve, reject) => {
        stream.addListener("data", (chunk) => {
            chunks.push(chunk);
            currentLength += chunk.length;
        });
        stream.addListener("error", (err) => {
            reject(err);
        })
        stream.addListener("end", () => {
            Buffer.concat(chunks);
            resolve(chunks);
        })
    })
};
