import { PromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub"
import { JsonMarkdownStructuredOutputParser, StructuredOutputParser } from "langchain/output_parsers"
import type { RunnableConfig } from "@langchain/core/runnables";
import { diagram_schema, AgentState } from "./agent_state";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages"
import fs from 'fs/promises'
import path from 'path'


const llm = new ChatOpenAI({
  modelName: "gpt-4-vision-preview",
  maxTokens:2000,
  temperature:0,
  maxRetries:1,
});

export async function describeDiagramImage( state: AgentState, config?: RunnableConfig ) : Promise<Partial<AgentState>> {

    const promptTemplate = await pull<PromptTemplate>("bsorrentino/describe_diagram_image");
    
    // const outputParser = StructuredOutputParser.fromZodSchema(diagram_schema);
    const outputParser = JsonMarkdownStructuredOutputParser.fromZodSchema(diagram_schema);
    
    const prompt = await promptTemplate.format( { format_instructions: outputParser.getFormatInstructions() })
   
    console.debug( prompt )
    
    const messages = new HumanMessage( {
      content: [
        {
            "type": "text", 
            "text": prompt
        },
        {
            "type": "image_url",
            "image_url": {
                "url": state.diagramImageUrlOrData
            },
        },

    ]})
    
    const chain = llm.pipe( outputParser )
    
    const response = await chain.invoke( [messages] );


    console.debug( response  )
    
    return { diagram: response  }  
}
  

export async function imageFileToUrl(imagePath: string) {
  const imageBuffer = await fs.readFile(imagePath);
  const base64EncodedImage = imageBuffer.toString('base64');

  return `data:image/png;base64,${base64EncodedImage}`
}

