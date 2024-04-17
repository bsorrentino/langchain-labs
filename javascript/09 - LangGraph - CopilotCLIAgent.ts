/*
# Agent Executor From Scratch

In this notebook we will go over how to build a basic agent executor from scratch.

# Setup

First we need to install the packages required

`yarn add langchain @langchain/openai @langchain/langgraph`

Next, we need to set API keys for OpenAI (the LLM we will use) and Tavily (the search tool we will use)

```
export OPENAI_API_KEY=xxxx
```
Optionally, we can set API key for LangSmith tracing, which will give us best-in-class observability.

```
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=xxxxx
```
*//*
## Create the LangChain agent

First, we will create the LangChain agent. For more information on LangChain agents, see this documentation.
*/
import dotenv from 'dotenv'

const result = dotenv.config({ path: '../.env' })
/*
Create Command Executor tool
*/
import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { BaseMessage } from "@langchain/core/messages";
import { AgentAction, AgentFinish, AgentStep } from "@langchain/core/agents";
import { ToolExecutor } from "@langchain/langgraph/prebuilt";
import type { RunnableConfig } from "@langchain/core/runnables";
import { RunnableLambda } from "@langchain/core/runnables";
import { END, StateGraph } from "@langchain/langgraph";

/**
 * SystemCommandTool is a Tool subclass that allows executing arbitrary 
 * system commands. It takes a command string as input and executes it using 
 * Node's child_process.spawn functionality.
*/
class SystemCommandTool extends Tool {
    name ="system_cmd"
    description = "all system commands"
    
    constructor(fields?: ToolParams) {
        super( fields )
        this.returnDirect = true
    }
    protected async _call(args: any, runManager?: CallbackManagerForToolRun | undefined): Promise<string> {
      
        console.log("running system command tool", args)
        return `command executed: ${args}`

    }
  }

import { pull } from "langchain/hub";
import { createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import os from 'node:os' 

const tools = [new SystemCommandTool()];

// Get the prompt to use - you can modify this!
let prompt = await pull<ChatPromptTemplate>(
  "bsorrentino/copilot-cli-agent"
)

prompt = await prompt.partial( { platform: os.platform() } );

// Choose the LLM that will drive the agent
const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-0613",
  temperature: 0
});

// Construct the OpenAI Functions agent
const agentRunnable = await createOpenAIFunctionsAgent({
  llm,
  tools,
  prompt
});
/*
## Define the graph schema

We now define the graph state. The state for the traditional LangChain agent has a few attributes:

1. **input**: 
   > _This is the input string representing the main ask from the user, passed in as input._
1. **chatHistory**:
   > _This is any previous conversation messages, also passed in as input._
1. **steps**: 
   >  _This is list of actions and corresponding observations that the agent takes over time. This is updated each iteration of the agent._
1. **agentOutcome**: 
   > _This is the response from the agent, either an AgentAction or AgentFinish. The AgentExecutor should finish when this is an AgentFinish, otherwise it should call the requested tools._
*/

const agentState = {
    input: {
      value: null
    },
    chatHistory: {
      value: null,
      default: () => []
    },
    steps: {
      value: (x, y) => x.concat(y),
      default: () => []
    },
    agentOutcome: {
      value: null
    }
  };
/*
## Define the nodes

We now need to define a few different nodes in our graph. In langgraph, a node can be either a function or a runnable. There are two main nodes we need for this:

1. **The agent**: 
   > _responsible for deciding what (if any) actions to take._
1. **A function to invoke tools**: 
   > _if the agent decides to take an action, this node will then execute that action._

We will also need to define some edges. Some of these edges may be conditional. The reason they are conditional is that based on the output of a node, one of several paths may be taken. The path that is taken is not known until that node is run (the LLM decides).

1. **Conditional Edge**
   > _after the agent is called, we should either: a. If the agent said to take an action, then the function to invoke tools should be called b. If the agent said that it was finished, then it should finish_
1. **Normal Edge**: 
   > _after the tools are invoked, it should always go back to the agent to decide what to do next_


Let's define the nodes, as well as a function to decide how what conditional edge to take.
*/

interface AgentStateBase {
  agentOutcome?: AgentAction | AgentFinish;
  steps: Array<AgentStep>;
}

interface AgentState extends AgentStateBase {
  input: string;
  platform: string,
  chatHistory?: BaseMessage[];
}

const toolExecutor = new ToolExecutor({tools});

// Define logic that will be used to determine which conditional edge to go down
const shouldContinue = (data: AgentState) => {
  if (data.agentOutcome && "returnValues" in data.agentOutcome) {
    return "end";
  }
  return "continue";
};

const runAgent = async (data: AgentState, config?: RunnableConfig) => {
  const agentOutcome = await agentRunnable.invoke(data, config);

  return {
    agentOutcome,
  };
};



const executeTools = async (data: AgentState, config?: RunnableConfig) => {
  const agentAction = data.agentOutcome;

  if (!agentAction || "returnValues" in agentAction) {
    throw new Error("Agent has not been run yet");
  }

  const output = await toolExecutor.invoke(agentAction, config);

  return {
    steps: [{ action: agentAction, observation: JSON.stringify(output) }]
  };
};
/*
## Define the graph

We can now put it all together and define the graph!
*/

// Define a new graph
const workflow = new StateGraph({
    channels: agentState
});

// Define the two nodes we will cycle between
workflow.addNode("agent", new RunnableLambda({ func: runAgent }));
workflow.addNode("action", new RunnableLambda({ func: executeTools }));

// Set the entrypoint as `agent`
// This means that this node is the first one called
workflow.setEntryPoint("agent");

// We now add a conditional edge
workflow.addConditionalEdges(
  // First, we define the start node. We use `agent`.
  // This means these are the edges taken after the `agent` node is called.
  "agent",
  // Next, we pass in the function that will determine which node is called next.
  shouldContinue,
  // Finally we pass in a mapping.
  // The keys are strings, and the values are other nodes.
  // END is a special node marking that the graph should finish.
  // What will happen is we will call `should_continue`, and then the output of that
  // will be matched against the keys in this mapping.
  // Based on which one it matches, that node will then be called.
  {
    // If `tools`, then we call the tool node.
    continue: "action",
    // Otherwise we finish.
    end: END
  }
);

// workflow.addConditionalEdges("action", ( data ) =>  "end",
//  {
//   continue: "agent",
//   end: END
// });

// We now add a normal edge from `tools` to `agent`.
// This means that after `tools` is called, `agent` node is called next.
workflow.addEdge("action", "agent");

const app = workflow.compile();


const inputs = { input: "list files in 'downloads' folder and for each create a symbolic link in the '/tmp' directory " }

// Direct
// await app.invoke(inputs)

// Stream
for await (const s of await app.stream(inputs)) {
  console.log(s)
  console.log("----\n")
}
