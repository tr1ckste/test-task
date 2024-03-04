/**
 * @typedef CBOR~ExtendedResults
 * @property {any} value The value that was found.
 * @property {number} length The number of bytes of the original input that
 *   were read.
 * @property {Buffer} bytes The bytes of the original input that were used
 *   to produce the value.
 * @property {Buffer} [unused] The bytes that were left over from the original
 *   input.  This property only exists if {@linkcode Decoder.decodeFirst} or
 *   {@linkcode Decoder.decodeFirstSync} was called.
 */
