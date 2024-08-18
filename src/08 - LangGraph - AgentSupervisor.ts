
import dotenv from 'dotenv'

const result = dotenv.config({ path: '../.env' })
/*
### Helper Utilites

Define a helper function below, which make it easier to add new agent worker nodes.
*/
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIClient } from "@langchain/openai";
import { JsonOutputToolsParser } from "langchain/output_parsers";
import { Runnable, type RunnableConfig } from "@langchain/core/runnables";
import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, AIMessage } from "@langchain/core/messages";


async function createAgent(
  llm: ChatOpenAI, 
  tools: any[], 
  systemPrompt: string
): Promise<Runnable> {
  // Each worker node will be given a name and some tools.
  const prompt = ChatPromptTemplate.fromMessages([
   ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);
  const agent = await createOpenAIToolsAgent({ llm, tools, prompt });
  return new AgentExecutor({agent, tools});
}


async function agentNode( params:{ state:any, agent:Runnable, name:string }, config?: RunnableConfig) {
  const { state, agent, name } = params

  const result = await agent.invoke(state, config);
  return {
    messages: [
      new HumanMessage({ content: result.output, name })
    ]
  };
}
/*
### Create Agent Supervisor

The supervisor routes the work between our worker agents.
*/

const members = ["Researcher", "ChartGenerator"];

const systemPrompt = (
  "You are a supervisor tasked with managing a conversation between the" +
  " following workers: {members}. Given the following user request," +
  " respond with the worker to act next. Each worker will perform a" +
  " task and respond with their results and status. When finished," +
  " respond with FINISH."
);

const options = ["FINISH", ...members];

// Define the routing function
const functionDef = {
  name: "route",
  description: "Select the next role.",
  parameters: {
    title: "routeSchema",
    type: "object",
    properties: {
      next: {
        title: "Next",
        anyOf: [
          { enum: options },
        ],
      },
    },
    required: ["next"],
  },
};

const toolDef: OpenAIClient.ChatCompletionTool  = {
    type: "function",
    function: functionDef,
}

const prompt = await ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "system",
    `Given the conversation above, who should act next? Or should we FINISH? Select one of: {options}`,
  ],
])
.partial({ options: options.join(", "), members: members.join(", ") });
console.log( prompt )
const llm = new ChatOpenAI({ modelName: "gpt-4-1106-preview", temperature: 0, });

const llm_binded_with_tool = llm.bind({ 
  tools: [toolDef], 
  tool_choice: { 
    "type": "function", 
    "function": {"name": "route"}} })

const supervisorChain = prompt
  .pipe( llm_binded_with_tool )
  .pipe( new JsonOutputToolsParser() )
   // select the first one
  .pipe( x => x[0].args );


await supervisorChain.invoke({
    messages: [
      new HumanMessage({
        content:"write a report on birds."
      })
    ]
  });
/*
Next, create the agents to add to the graph.
*/


const researcherAgent = await createAgent(
  llm, 
  [tavilyTool], 
  `You are a web researcher. You may use the Tavily search engine to search the web for 
  important information, so the Chart Generator in your team can make useful plots.`
);

const researcherNode = async (state:any, config?:RunnableConfig) => await agentNode({
  state, 
  agent: researcherAgent, 
  name: "Researcher",
}, config);

const chartGenAgent = await createAgent(
  llm, 
  [chartTool], 
  "You excel at generating bar charts. Use the researcher's information to generate the charts."
);

const chartGenNode = async (state:any, config?:RunnableConfig) => await agentNode({
  state, agent: chartGenAgent, 
  name: "ChartGenerator",
}, config);
/*
### Construct Graph

We're ready to start building the graph. First, we'll define the state the graph will track.

Now we can create the graph itself! Add the nodes, and add edges to define how how work will be performed in the graph.
*/


interface AgentStateChannels {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[];
    default: () => BaseMessage[];
  };
  
}

// This defines the agent state
const agentStateChannels: AgentStateChannels = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  }
};


// 1. Create the graph
const workflow = new StateGraph({
  channels: agentStateChannels,
});

// 2. Add the nodes; these will do the work
workflow.addNode("Researcher", researcherNode);
workflow.addNode("ChartGenerator", chartGenNode);
workflow.addNode("supervisor", supervisorChain);
// 3. Define the edges. We will define both regular and conditional ones
// After a worker completes, report to supervisor
members.forEach(member => {
  workflow.addEdge(member, "supervisor");
});

// When the supervisor returns, route to the agent identified in the supervisor's output
const conditionalMap: { [key: string]: string } = members.reduce((acc, member) => {
    acc[member] = member;
    return acc;
}, {});
// Or end work if done
conditionalMap["FINISH"] = END;

workflow.addConditionalEdges(
    "supervisor", 
    (x: { next: string }) => x.next,
    conditionalMap,
);

workflow.setEntryPoint("supervisor");

const graph = workflow.compile();
