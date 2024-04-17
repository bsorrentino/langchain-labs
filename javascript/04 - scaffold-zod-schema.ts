
import dotenv from 'dotenv'

const result = dotenv.config({ path: '../.env' })
/*
Initialize Zod schema builder OneShot
*/
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { StringOutputParser } from "langchain/schema/output_parser";
import * as z from 'zod'

const promptZodSchemaOneShotTemplate =`
As my typescript ASSISTANT expert in Zod usage,
you MUST create the typescript code for creating a Zod object schema following the template below:

// beging template
const schema = z.object(
    // here the properties of the schema
);
// end template

and the costraints:

1. NOT use required()
2. Use nonempty() ONLY if prefix is .array()
3. The schema must include a describe() call for each property; if omitted, you must infer it from the property name. 
        example: 
        USER: file Name - ASSISTANT: fileName.string().describe("the file name")
        USER: file Name "path of file" - ASSISSTANT: fileName.string().describe("path of file")

You MUST start to interact to the USER following the process below

1. ask for properties information
2. generate the typescript code for the schema with follow costraints. 
3. ask to the USER to confirm the generated code
4. if USER doesn't confirm the generated code, ask for the properties information again otherwise return typescript code 
`

const chat = new ChatOpenAI({ modelName: "gpt-4", temperature: 0});
const memory = new BufferMemory({ returnMessages: true, memoryKey: "history" })

const prompt = ChatPromptTemplate.fromMessages([
  [ "system", promptZodSchemaOneShotTemplate], 
  new MessagesPlaceholder("history"),
  ["human", "{input}"]] )

const chain = new LLMChain({
    llm: chat,
    prompt: prompt,
    memory: memory,
  });

/*
let's start 
*/

async function start() {
  const res = await chain.call({  
    input: `properties: imagePath required as "full image path",  outputPath optional, codes array of string`,
  });

  const parser = new StringOutputParser();

  const text = await parser.parse(res.text);
  console.log(text);

  const pres = /(const schema = z.object\({.+}\);)/gms.exec(text)

  const schema = pres ? pres[1] : null;

  console.log(schema ?? "not found");

}

/*
Update schema
*/

async function updateSchema() { 

// const res = await chain.call({  input: "yes, it is correct"});
  const res = await chain.call({  
      input: "No, add new property grayLevel optional as enum with values  4, 8 or 16 with default value 16" 
  });

  const parser = new StringOutputParser();

  const text = await parser.parse(res.text);
  console.log(text);

  const pres = /(const schema = z.object\({.+}\);)/gms.exec(text)

  const schema = pres ? pres[1] : null;

  console.log(schema ?? "not found");


  // const schema = z.object({
  //   imagePath: z.string().required().describe("the image path"),
  //   outputPath: z.string().optional().describe("the output path"),
  // });
}