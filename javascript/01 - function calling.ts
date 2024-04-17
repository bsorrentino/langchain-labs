
import dotenv from 'dotenv'
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {  createOpenAIFnRunnable } from "langchain/chains/openai_functions";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";

import type { FunctionDefinition } from "@langchain/core/language_models/base";


const result = dotenv.config({ path: '../.env' })
/*
Let define a `function description` to provide function metadata to GPT
*/
const function_descriptions:FunctionDefinition[] = [
    {
        "name": "export_solution",
        "description": "export a dataverse solution to remove environment",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "the solution path",
                },
                "environment": {
                    "type": "string",
                    "description": "the target environment",
                },
                "type": {
                    "type": "string",
                    "description": "the solution type. The default is managed",
                    "enum": [ "both", "managed", "unmanaged" ]
                },
            },
            "required": ["path", "environment"],
        },
    }
];
/*
## Using OpenAI functions 

### References

* [Langchainjs: Using OpenAI functions](https://js.langchain.com/docs/modules/chains/additional/openai_functions/)

*/

const user_query = [
  "let import the solution 'mysolution.zip' from path '/tmp' in environment 'bartolo' as unmanaged",
  "how in javascript can iterate over an array",
  "how in javascript can iterate over an array and import the solution 'mysolution.zip' from path '/tmp' in environment 'bartolo'"
]

const model = new ChatOpenAI({ 
});

const prompt = ChatPromptTemplate.fromMessages([
  ["human", "Human description: {description}"],
]);

const outputParser = new JsonOutputFunctionsParser();

const runnable = createOpenAIFnRunnable({
  functions: function_descriptions,
  llm: model,
  prompt,
  outputParser,
});

const response = await runnable.invoke({
  description: user_query[0],
});

console.log(response);
/*
  { name: 'John Doe', age: 30, fav_food: 'chocolate chip cookies' }
*/
