

import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda, RunnableConfig } from "@langchain/core/runnables";
import { describeDiagramImage, imageFileToUrl } from "./agent_describer.mjs";
import { translateGenericDiagramDescriptionToPlantUML } from "./agent_generic_plantuml.mjs";
import { translateSequenceDiagramDescriptionToPlantUML } from "./agent_sequence_plantuml.mjs";
import { AgentState } from "./agent_state.js";

const agentState = {
  diagramImageUrlOrData: null,
  diagramCode: null,
  diagram: null,
};

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
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
  

  const app =  new StateGraph<AgentState>( { channels: agentState } )
        .addNode("agent_describer", new RunnableLambda( { func: describeDiagramImage } ) )
        .addNode("agent_sequence_plantuml", new RunnableLambda( { func: translateSequence } ) )
        .addNode("agent_gemeric_plantuml", new RunnableLambda( { func: translateGeneric } ) )
        .addEdge('agent_sequence_plantuml', END)
        .addEdge('agent_gemeric_plantuml', END)
        .addConditionalEdges( "agent_describer", route_diagram_translation, {
          "sequence": "agent_sequence_plantuml",
          "generic": "agent_gemeric_plantuml",
        })
        .addEdge(START, 'agent_describer')
        .compile();


const isUrl = ( source:string ) => {
    try {
      new URL(source);
      return true;
    } catch (_) {
      return false;  
    }
  };

export const imageToDiagramAsStream = async ( image:string ) => 
  await app.stream( {
    diagramImageUrlOrData: isUrl(image) ? image : imageFileToUrl(image)
  })



export const imageToDiagram = async ( image:string ) => 
  
  await app.invoke( {
    diagramImageUrlOrData: isUrl(image) ? image : await imageFileToUrl(image)
  })

