
import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { RunnableConfig, RunnableFunc } from "@langchain/core/runnables"

// Define the state interface
interface AgentState {
  messages: string[];
}

// Define the graph state
const graphState: StateGraphArgs<AgentState>["channels"] = {
  messages: {
    reducer: (x: string[], y: string[]) => x.concat(y),
  },
};


// Define the function that determines whether to continue or not
function shouldContinue(state: AgentState) {
    console.log( 'shouldContinue' )
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as string;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage === 'exit') {
    return 'exit';
  }
  if (lastMessage === 'skip') {
    return 'skip';
  }
  // Otherwise, we stop (reply to the user)
  return "next";
}

// Define the function that calls the model
const step = ():RunnableFunc<AgentState, Partial<AgentState>>  => 
  
  async ( state:AgentState, options?:RunnableConfig ) => {
      console.log( '---------STEP -------------')
      console.log( `${options?.runName}` )
      console.log( '---------STATE -------------')
      console.dir( state )
      // console.log( '-------- CONFIG ------------')
      // console.dir( options )
      console.log( '----------------------------')
  // We return a list, because this will get added to the existing list
      return { messages: [options?.runName ?? ''] };
  }


// Define a new graph
const workflow = new StateGraph<AgentState>({ channels: graphState })
    .addNode( 'step1', step() )
    .addNode( 'step2', step() )
    .addNode( 'step3', step() )
    .addNode( 'step4', step() )
    .addNode( 'step5', step() )
    .addEdge( START, "step1")
    .addEdge( 'step1', 'step2' )
    .addConditionalEdges( 'step2', shouldContinue, {
      'next': 'step3',
      'skip': 'step4',
      'exit': END
    })
    // .addEdge( 'step2', 'step3' )
    .addEdge( 'step3', 'step4' )
    .addEdge( 'step4', 'step5' )
    .addEdge( 'step5', END )
    
// Initialize memory to persist state between graph runs
const checkpointer = new MemorySaver();

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
// Note that we're (optionally) passing the memory when compiling the graph
const app = workflow.compile({ checkpointer });

const config =  {
    configurable: { thread_id: "1" } 
}
// Use the Runnable
const stream = await app.stream( 
    { 
        messages: ["step0"] 
    },
    { 
        // interruptBefore: ['step2'],
        streamMode: "values",
        ...config
    }
);


for await ( const m of stream ) {
    console.log(m);
}
// console.log( 'CHECKPOINT\n===================================')
// for await ( const cp of await checkpointer.list( config ) ) {
//     console.dir( cp )
// }
const tuple = await checkpointer.getTuple( config )
console.log( '--------- TUPLE -------------')
console.dir( tuple )
console.log( '-----------------------------')

console.log( '--------- REPLY -------------')
for await ( const m of await app.stream( null, { streamMode: "values", ...config } ) ) {
    console.log(m);
}

let newConfig:any;

console.log( '--------- HISTORY -------------')
for await ( const { values, next, metadata, config:historyConfig  }  of app.getStateHistory(config) ) {
  
  console.log( values )
  console.log( next )
  console.dir( metadata?.source, metadata?.step )

  if( metadata?.step === 4 ) {


      console.log( '--------- UPDATE STATE -------------') 
      newConfig = await app.updateState( historyConfig, { messages: ['skip'] }, 'step2' )   
      console.log( '--------- NEW CONFIG -------------') 
      console.dir( newConfig )
      console.dir( await checkpointer.getTuple( newConfig ) )
      console.log( '-----------------------------')
  }
  
}

console.log( '--------- REPLY -------------')
for await ( const m of await app.stream( null, { streamMode: "values", ...config } ) ) {
    console.log(m);
}
