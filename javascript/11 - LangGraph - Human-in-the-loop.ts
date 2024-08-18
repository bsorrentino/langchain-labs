
import { HumanMessage } from "@langchain/core/messages";
import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";

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
  // Otherwise, we stop (reply to the user)
  return "next";
}

// Define the function that calls the model
async function step1(state: AgentState) {
  
    console.log( 'step1' )
  // We return a list, because this will get added to the existing list
  return { messages: ['step1'] };
}

async function step2(state: AgentState) {
  
    console.log( 'step2' )

  // We return a list, because this will get added to the existing list
  return { messages: ( state.messages.length < 5 ? ['step2'] : ['exit'] ) };
}

// Define a new graph
const workflow = new StateGraph<AgentState>({ channels: graphState })
    .addNode( 'step1', step1)
    .addNode( 'step2', step2 )
    .addEdge( START, "step1")
    .addEdge( 'step1', 'step2' )
    .addConditionalEdges("step2", shouldContinue, { 
        'exit': END,
        'next': 'step1',
    })
    
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
        interruptBefore: ['step2'],
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
console.log( '=============== STEP 2 ====================')

const tuple = await checkpointer.getTuple( config )
console.log( tuple )

// console.log( '===================================')

// const finalState = await app.invoke( {}, { ...config })
// console.log( finalState );

for await ( const m of await app.stream( null, { streamMode: "values", ...config } ) ) {
    console.log(m);
}