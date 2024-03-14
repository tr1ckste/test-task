/**
 * 
 * @param {string} pathAndQuery value of the :path pseudo-header
 * @returns {[string, object]}
 */
export const getPathAndSearchParams = pathAndQuery => {
  const url = new URL(`https://example.com${pathAndQuery}`);
  const path = url.pathname;
  const searchParams = url.searchParams;
  const searchParamsObject = {};
  for (const [key, value] of searchParams.entries()) {
    searchParamsObject[key] = value;
  }
  return [path, searchParamsObject];
}
