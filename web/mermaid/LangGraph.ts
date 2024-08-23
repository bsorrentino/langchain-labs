import { z } from 'zod';

import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import type { RunnableConfig } from "@langchain/core/runnables";
import { CompiledStateGraph, END, START, StateGraph } from "@langchain/langgraph/web";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as hub from "langchain/hub";

import { AgentState, diagram_schema } from './AgentState'

export class MermaidAgentic extends HTMLElement {
    static get observedAttributes() {
        return ['input'];
    }

    private app?: CompiledStateGraph<AgentState, Partial<AgentState>, any>

    get openAIApiKey() {
        return this.getAttribute('openAIApiKey') ?? process.env.OPENAI_API_KEY
    }

    constructor() {
        super();
    }

    attributeChangedCallback(name:string, oldValue:string, newValue:string) {
        console.debug( 'attributeChangedCallback', name, oldValue, newValue )
        
        if( name === 'input' && newValue && newValue.length> 0 && newValue !== oldValue) {

            if( !this.app ) {
                this.app = this.#initGraph()
            }

            this.#execute( newValue  )
                .catch( e => console.error( 'execution error', e ) )     
        }
    }

    #initGraph() {

        const schema = {
            diagramImageUrlOrData: null,
            diagramCode: null,
            diagram: null,
        };

        const llm = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            maxTokens: 2000,
            temperature: 0,
            maxRetries: 1,
            openAIApiKey: this.openAIApiKey
        });


        const describeDiagram = async (state: AgentState, options?: Partial<RunnableConfig>) : Promise<Partial<AgentState>> => {

                const {  diagramImageUrlOrData: jsonString } = state 

                try {

                  // Parse the JSON string to an object
                  const jsonObject = JSON.parse(jsonString!);
                  
                  // Validate and parse using Zod
                  const diagram = diagram_schema.parse(jsonObject);
                
                  return { diagram }
                  
                } catch (error) {
                  if (error instanceof SyntaxError) {
                    console.error('Invalid JSON string:', error.message);
                  } else if (error instanceof z.ZodError) {
                    console.error('Validation error:', error.errors);
                  } 
                  throw error
                }
                
                

        }
        const translateGeneric = async (state: AgentState, options?: Partial<RunnableConfig>) : Promise<Partial<AgentState>> => {
            const { diagram } = state

            if( !diagram ) {
                throw `diagram object not found in state`
            }

            
            const prompt = await hub.pull<PromptTemplate>("bsorrentino/convert_generic_diagram_to_mermaid");

            const parser = new StringOutputParser();
            
            const chain = prompt.pipe( llm ).pipe( parser );
        
            const result = await chain.invoke( { diagram_description: JSON.stringify(diagram) } )
        
            return { diagramCode: result }
        
        }
            
        const translateSequence = async (state: AgentState, options?: Partial<RunnableConfig>) : Promise<Partial<AgentState>> => {
            const prompt = await hub.pull<PromptTemplate>("bsorrentino/convert_sequence_diagram_to_mermaid");

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
        

        const route_diagram_translation = (state: AgentState) => {
            if (state?.diagram?.type == "sequence") {
                return "sequence";
            } else {
                return "generic";
            }
        };


        return  new StateGraph<AgentState>({ channels: schema })
            .addNode("agent_describer", new RunnableLambda({ func: describeDiagram }))
            .addNode("agent_sequence_plantuml", new RunnableLambda({ func: translateSequence }))
            .addNode("agent_gemeric_plantuml", new RunnableLambda({ func: translateGeneric }))
            .addEdge('agent_sequence_plantuml', END)
            .addEdge('agent_gemeric_plantuml', END)
            .addConditionalEdges("agent_describer", route_diagram_translation, {
                "sequence": "agent_sequence_plantuml",
                "generic": "agent_gemeric_plantuml",
            })
            .addEdge(START, 'agent_describer')
            .compile();


    }

    async #execute( input: string  ) {

        // for await (const s of await this.app!.stream({ diagramImageUrlOrData: input })) {
        //     console.log(s)
        //     console.log("----\n")
        // }
        const result = await this.app!.invoke({ diagramImageUrlOrData: input })

        this.dispatchEvent( new CustomEvent( 'agent-result', {
            detail: result,
            bubbles: true,
            composed: true,
            cancelable: true
        }) )
    }
}

if (!window.customElements.get('langraph-mermaid')) {
    window.customElements.define('langraph-mermaid', MermaidAgentic);
}
