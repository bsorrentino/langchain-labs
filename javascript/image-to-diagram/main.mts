

import { END, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda, RunnableConfig } from "@langchain/core/runnables";
import { describeDiagramImage, imageFileToUrl } from "./agent_describer.mts";
import { translateGenericDiagramDescriptionToPlantUML } from "./agent_generic_plantuml.mts";
import { translateSequenceDiagramDescriptionToPlantUML } from "./agent_sequence_plantuml.mts";
import { AgentState } from "./agent_state";

const agentState = {
  diagramImageUrlOrData: {
    value: null
  },
  diagramCode: {
    value: null
  },
  diagram: {
    value: null,
  }
};

const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  maxTokens:2000,
  temperature:0,
  maxRetries:1,
});


const translateGeneric = async ( state: AgentState, options?: Partial<RunnableConfig> ) => 
   await translateGenericDiagramDescriptionToPlantUML( llm, state, options )

const translateSequence = async ( state: AgentState, options?: Partial<RunnableConfig> ) => 
   await translateSequenceDiagramDescriptionToPlantUML( llm, state, options )

  const route_diagram_translation = (state: AgentState) => {
    if (state?.diagram?.type == "sequence") {
      return "sequence";
    } else {
      return "generic";
    }
  };
  

const workflow = new StateGraph( { channels: agentState } );

workflow.addNode("agent_describer", new RunnableLambda( { func: describeDiagramImage } ) );
workflow.addNode("agent_sequence_plantuml", new RunnableLambda( { func: translateSequence } ) );
workflow.addNode("agent_gemeric_plantuml", new RunnableLambda( { func: translateGeneric } ) );
workflow.addEdge('agent_sequence_plantuml', END);
workflow.addEdge('agent_gemeric_plantuml', END);
workflow.addConditionalEdges(
  "agent_describer",
  route_diagram_translation,
  {
    "sequence": "agent_sequence_plantuml",
    "generic": "agent_gemeric_plantuml",
  }
);
workflow.setEntryPoint('agent_describer');

const app = workflow.compile();


const isUrl = ( source:string ) => {
    try {
      new URL(source);
      return true;
    } catch (_) {
      return false;  
    }
  };

export async function imageToDiagram( image:string ) {
  
  const result = await app.stream( {
    diagramImageUrlOrData: isUrl(image) ? image : imageFileToUrl(image)
  })

  let lastItem: { [k: string]: AgentState }|null = null

  for await (const item of result) {
    console.debug( item )
    lastItem = item
  }

  return lastItem ? lastItem[END].diagramCode : null
  // rest of the code
}
