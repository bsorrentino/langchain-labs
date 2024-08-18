import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { AgentState } from "./agent_state";
import * as hub from "langchain/hub";;
import { ChatOpenAI } from "@langchain/openai";
import type { RunnableConfig } from "@langchain/core/runnables";

export async function translateSequenceDiagramDescriptionToPlantUML( llm: ChatOpenAI,  state: AgentState, options?: Partial<RunnableConfig>): Promise<Partial<AgentState>> {

    const prompt = await hub.pull<PromptTemplate>("bsorrentino/convert_sequence_diagram_to_plantuml");

    const { diagram } = state

    if( !diagram ) {
        throw `diagram object not found in state`
    }

    const parser = new StringOutputParser();
    
    const chain = prompt.pipe( llm ).pipe( parser );

    const result = await chain.invoke({ 
        diagram_title: diagram.title,
        diagram_description: diagram.description.join('\n') 

    })

    return { diagramCode: result }
}