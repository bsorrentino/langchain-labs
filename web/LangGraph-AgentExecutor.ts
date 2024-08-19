import { pull } from "langchain/hub";
import { createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { AgentAction, AgentFinish, AgentStep } from "@langchain/core/agents";
import { ToolExecutor } from "@langchain/langgraph/prebuilt";
import type { RunnableConfig } from "@langchain/core/runnables";
import { END, START, StateGraph } from "@langchain/langgraph/web";

async function main( input: string ) {

    const tools = [new TavilySearchResults({ apiKey:process.env.TAVILY_API_KEY, maxResults: 1 })];

    // Get the prompt to use - you can modify this!
    const prompt = await pull<ChatPromptTemplate>(
        "hwchase17/openai-functions-agent"
    );

    console.log(prompt)

    // Choose the LLM that will drive the agent
    const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0,
        verbose: true
    });

    // Construct the OpenAI Functions agent
    const agentRunnable = await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt
    });

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
        chatHistory?: BaseMessage[];
    }

    const toolExecutor = new ToolExecutor({
        tools,
    });

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
    const app = new StateGraph<AgentState>({
        channels: {
            input: null,
            chatHistory: {
                reducer: (a,b) => a?.concat(b),
                //reducer: (x:[BaseMessage], y:[BaseMessage]) => x.concat(y),
                default: () => []
            },
            steps: {
                reducer: (state, update) => state.concat(update),
                default: () => []
            },
            agentOutcome: null
        }
    })
    // Define the two nodes we will cycle between
    .addNode( "agent", new RunnableLambda({ func: runAgent }))
    .addNode( "action", new RunnableLambda({ func: executeTools }))
    // Set the entrypoint as `agent`
    // This means that this node is the first one called
    .addEdge(START, "agent")
    // We now add a conditional edge
    .addConditionalEdges(
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
    )
    // We now add a normal edge from `tools` to `agent`.
    // This means that after `tools` is called, `agent` node is called next.
    .addEdge("action", "agent")
    .compile();

    for await (const s of await app.stream({ input })) {
        console.log(s)
        console.log("----\n")
    }

}

main( "what is the weather in sf" );