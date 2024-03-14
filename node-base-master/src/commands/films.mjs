import { Command } from "../command.mjs";
import { getCollection, sortingMap } from "../db/index.mjs";
import { CORS } from "../utils/cors.mjs";
import { checkIfEqual } from "../utils/common.mjs";

const createFilmCursorAndSetItToCtx = (context, searchParams) => {
    const sortOptions = {}
    if (searchParams.year) sortOptions.year = sortingMap[searchParams.year];
    if (searchParams.imdbRating) {
        sortOptions['imdb.rating'] = sortingMap[searchParams.imdbRating];
    }
    console.log(sortOptions);
    const collection = getCollection("sample_mflix", "movies");
    const cursor = collection.find({}).sort(sortOptions);

    context.cursor = cursor;
    return cursor;
}

export default new Command({
    handler: async (dataTransport, context) => {
        dataTransport.addListener("error", (error) => {
            console.error(error)
        })
        dataTransport.respond(Object.assign({
            'content-type': 'application/json',
        }, CORS), {
            endStream: false,
            waitForTrailers: false
        });
        const searchParamsIsEqual = checkIfEqual(
            context.requestSearchParams,
            context.sessionSearchParams
        );
        const needToResetCursor = !(searchParamsIsEqual && context.cursor);

        if (needToResetCursor) createFilmCursorAndSetItToCtx(context, context.requestSearchParams);

        const { cursor } = context;
        if (!(await cursor.hasNext())) {
            dataTransport.end();
            context.done = true;
            return;
        }
        const data = await cursor.next();
        dataTransport.sendData(JSON.stringify(data));
        context.done = true;
        dataTransport.end();
    }
});
