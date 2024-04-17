import { ChatOpenAI } from "langchain/chat_models/openai";
import { LLMChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { PromptTemplate } from "langchain/prompts";
import {  initializeAgentExecutorWithOptions } from "langchain/agents";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { OpenAI } from "langchain/llms/openai";
import { RegexParser } from "langchain/output_parsers";


/*
define prompts
*/
const promptGenerateToolTemplate =`
As my typescript assistant 

I need that you create a langchain command tool as a plugin for the copilot-cli-agent application.
To do that you must fill the typescript template below with the variables:
NAME = {name}
DESC = {desc}
SCHEMA = {schema}
and then copy the code below into a file named <NAME>.ts.


// beging template
import {{ z }} from "zod";
import {{ CommandTool }} from "copilot-cli-core";

<SCHEMA>;

class "Camel case of <NAME>"Tool extends CommandTool<typeof schema> {{
    name = "snake case of <NAME>";
    description = "<DESC>";
    schema = schema;
    
    async _call(arg, runManager) {{
        console.debug("executing <NAME> with arg:", arg);
        return "<NAME> executed!";
    }}
}}
export default new "Camel case of <NAME>"Tool();
// end template

`

const promptGenerateToolTemplateWithCommand =`
  As my typescript assistant 

  I need that you create a langchain command tool as a plugin for the copilot-cli-agent application.
  To do that you must fill the typescript template below with the variables:
  NAME = {name}
  DESC = {desc}
  SCHEMA = {schema}
  COMMAND = {command}

  and then copy the code below into a file named <NAME>.mts at {path}.

  before filling the template consider to transform <COMMAND> in a string matching the schema attribute with command parameters.

  as example :

  ls -la <path> must be translated into "ls -la {{arg.path}}" 

  // beging template
  import {{ z }} from "zod";
  import {{ CommandTool, expandTilde, runCommand }} from "copilot-cli-core";

  <SCHEMA>;

  class "Camel Case of <NAME>"Tool extends CommandTool<typeof schema> {{
      name = "Snake case of <NAME>";
      description = "<DESC>";
      schema = schema;
      
      async _call(arg: z.output<typeof schema>) {{
          console.debug("executing '<NAME>' with arg:", arg);

          await runCommand( <command>, this.execContext )
          return "<NAME> executed!";
      }}
  }}
  export default new "Camel case of <NAME>"Tool();
  // end template
  `
const promptZodSchemaTemplate = `
As my typescript ASSISTANT expert in Zod notation.
you MUST create the typescript code for creating an object schema following the template below:

// beging template
const schema = z.object(
    // here the properties of the schema
);
// end template

To do this you MUST start to ask interactively to the USER the properties attribute of the object schema following the process below

1. ask for property name
2. ask for property type
3. ask if it is required or not

continue until USER write "END" as property name.
`

const promptZodSchemaOneShotTemplate =`
As my typescript ASSISTANT expert in Zod usage.
you MUST create the typescript code for creating an object schema following the template below:

// beging template
const schema = z.object(
    // here the properties of the schema
);
// end template

To do this you MUST start to interact to the USER following the process below

1. ask for properties information
2. generate the typescript code for the schema
3. ask to the USER to confirm the generated code
4. if USER doesn't confirm the generated code, ask for the properties information again otherwise return typescript code 
`

/*
Initialize Prompt Zod Schema interactively Template
*/

const chat = new ChatOpenAI({ modelName: "gpt-4", temperature: 0, stop: ["END"] });
const memory = new BufferMemory({ returnMessages: true, memoryKey: "history" })

const prompt = ChatPromptTemplate.fromMessages([
  [ "system", promptZodSchemaTemplate], 
  new MessagesPlaceholder("history"),
  ["human", "{input}"]] )

console.log( await prompt.format( { input: "let's start", history: [] } ) )

const chain = new LLMChain({
    llm: chat,
    prompt: prompt,
    memory: memory,
  });

async function test1() {

  let res = await chain.call({  input: `let's start` });

  console.log( res )

  res = await chain.call({  input: `property1` });

  console.log( res )

  res = await chain.call({  input: `string` });

  console.log( res )

  res = await chain.call({  input: `no` });

  console.log( res )

  res = await chain.call({  input: `END` });

  console.log( res )
}
/*
let's start 
*/

async function start() {
  const res = await chain.call({  
      input: `properties: imagePath required, outputPath optional`
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
}


/*
### Tool defining a function that save a file
*/
const SaveFileSchema = z.object({
  content: z.string().describe(" text file content"),
});
class SaveFileTool extends StructuredTool<typeof SaveFileSchema>  {
  name ="save_file"
  description = "save source file on local file system"
  schema = SaveFileSchema;

  protected async _call(arg: z.output<typeof SaveFileSchema>): Promise<string> {
    
    console.log("save file", arg )
    return "file saved"

      // const result = await runCommand( arg, this.execContext )
      // return `command executed: ${result}`

  }
}

/*
### scaffold the Tool using function calling
> call a function to save generated code
*/


async function testGenerateToolClass() {

  const generateToolClass = async( args:{
          name: string, 
          desc:string, 
          schema: string, 
          command: string, 
          path:string} ) => {
    
    const model = new ChatOpenAI({
      // modelName: "gpt-4",
      modelName: "gpt-3.5-turbo-0613",
      // stop: ["end", "stop", "quit"],
      maxConcurrency: 1,
      maxRetries: 3,
      maxTokens: 600,
      temperature: 0
    });
    
    const tools = [ new SaveFileTool() ] ;
    
    const agent = await initializeAgentExecutorWithOptions( tools, model, {
      agentType: "openai-functions",
      verbose: false,
      handleParsingErrors: (e:any) => "there is an error!"
    });
    
    // We can construct an LLMChain from a PromptTemplate and an LLM.
    
    const template = PromptTemplate.fromTemplate(
      promptGenerateToolTemplateWithCommand
    );
    
    const prompt = await template.format(args)
    
    return await agent.run(prompt);

  }

  const schema = `
  const GrayLevel = z.enum(["4", "8", "16"]); 

  const schema = z.object({
      imagePath: z.string(),
      outputPath: z.string().optional(),
      grayLevel: GrayLevel.default("16"),
  });`;


  const res = await generateToolClass({
    name: "test_run",
    desc: "test description",
    schema: schema,
    command: "plantuml -encodesprite <grayLevel> <imagePath>",
    path: "./plugins/save_file.mts"
  })
  console.log(res);
}


/*
Confirm Schema 
> not really useful
*/
async function confirmSchema() {
  const res = await chain.call({  input: "yes, it is correct"});

  const parser = new StringOutputParser();

  const text = await parser.parse(res.text);
  console.log(text);

  const pres = /(const schema = z.object\({.+}\);)/gms.exec(text)

  const schema = pres ? pres[1] : null;

  console.log(schema ?? "not found");



/*
Scaffold tool not using function calling.
> This implies that you save file by code
*/

  // We can construct an LLMChain from a PromptTemplate and an LLM.
  const model = new OpenAI({ temperature: 0 });
  const prompt = PromptTemplate.fromTemplate(
    promptGenerateToolTemplate
  );
  const chainA = new LLMChain({ llm: model, prompt });

  // The result is an object with a `text` property.
  const resA = await chainA.call({ 
    name: "PlantUML Sprite Maker",
    desc: "Generate a PlantUML sprite from a given image.",
    schema: schema,
  });

  console.log(resA.text);


  const regexp = new RegExp(/```typescript\s*(?:import { z } from 'zod';)?\s*(.+)```/, "s" );

  try {
      const parser = new RegexParser( regexp, ['code'], 'noContent' );

      const text = `
      \`\`\`typescript
      import { z } from 'zod';
      
      const GrayLevelEnum = z.enum(['4', '8', '16']);
      
      const schema = z.object({
          imagePath: z.string(),
          outputPath: z.string().optional(),
          grayLevel: GrayLevelEnum.default('16'),
      });
      \`\`\`
      `
      // console.log(text);
      
      const res = await parser.parse( text );
      
      console.log( res );
      
  }
  catch( e ) {
      console.error( e );
  }
}    



import path from 'node:path'
import { spawn } from 'node:child_process';
import * as fs from 'node:fs'

async function testRunCommand() {
  const schema = z.object({
    primary: z.string(),
    secondary: z.string().default('value'),
  });

  const data = { primary: 'value' };
  const result = schema.parse(data);
  console.log(result.secondary); // Output: 'value'


  type RunCommandArg = { cmd: string, out?: string, err?:string }
  /**
   * Runs a shell command and returns the output.
   * 
   * @param cmd - The command to run.
   * @param ctx - Optional execution context for logging output. 
   * @returns Promise resolving to the command output string.
   */
  const runCommand = async ( 
        arg: string | RunCommandArg, ctx?: any) => {
    
        
    let options: RunCommandArg

    if(typeof arg === 'string') {
      options = { cmd:arg };
    } else {
      options = arg
    }

    return new Promise<string>( (resolve, reject) => {
      
      ctx?.setProgress( `Running command: ${options.cmd}` )

      const child =  spawn(options.cmd, { stdio: [ 'inherit', 'pipe', 'pipe'], shell:true } ) 

      let result = ""

      if( options.out ) {
          const output = fs.createWriteStream(options.out);
          child.stdout.pipe(output);
      }
  //    else {
          // Read stdout
          child.stdout.setEncoding('utf8')
          child.stdout.on('data', data => {
          result = data.toString()
          ctx?.log( `^!${options.cmd}`)
          ctx?.log( result ) 
          });
      //}

      if( options.err ) {
          const output = fs.createWriteStream(options.err);
          child.stderr.pipe(output);
      }
      else {
          // Read stderr
          child.stderr.setEncoding('utf8')
          child.stderr.on('data', data => {
              result = data.toString()
              ctx?.log( `^R${result}`) ;
          })
      }

      // Handle errors
      child.on('error', error => {
        ctx?.log( `^!${options.cmd}`)
        reject(error.message) 
        
      })

      // Handle process exit
      child.on('close', code => { 
        resolve(result) 
      });

    })
  }

  runCommand({ cmd:'ls -l' , out: './out.txt' }, 
  {
      setProgress: ( msg:string) => console.log( 'progress', msg ),
      log: (msg:string) => console.log( msg) 
  })


  // Function to replace the file extension
  function replaceFileExtension(filePath, newExtension) {
      const parsedPath = path.parse(filePath);

      parsedPath.base = `${parsedPath.name}${newExtension}`;

      // Return the new path
      return path.format( parsedPath );
  }

  // Example usage
  const originalFilePath = 'example/test.txt';
  const newFilePath = replaceFileExtension(originalFilePath, '.md');

  console.log(newFilePath); // Outputs: example/test.md

}