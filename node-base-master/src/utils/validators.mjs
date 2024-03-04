import Ajv from "ajv"
import ajvFormats from "ajv-formats";
import ajvErrors from "ajv-errors";
import {ObjectId} from "mongodb";

const AjvConstructor = Ajv.default;

export const ajv = new AjvConstructor({
    allowUnionTypes: true,
    allErrors: true  // Required true to work with ajvErrors
});
ajvErrors(ajv);

ajvFormats(ajv);

ajv.addFormat("objectId", (data) => ObjectId.isValid(data));
ajv.addKeyword({
    keyword: "instanceOf",
    type: ["object", "string"],
    $data: true,
    error: {
        message: (context) => {
            return `must be an instance of ${context.schema.name}`;
        }
    },
    errors: true,
    validateSchema: (schema) => {
       return typeof schema === "function";
    },
    validate: function (schema, data, parentSchema, dataCxt) {
        console.log(dataCxt.parentDataProperty);
        if(data instanceof schema) return true;
        try{
            const item = new schema(data);
            dataCxt.parentData[dataCxt.parentDataProperty] = item;
            return true;
        }catch(e){
            console.log(e);
            return false;
        }
    }
})
