# 
#  [Create an Agent](https://python.langchain.com/docs/modules/agents/how_to/agent_structured#create-the-agent)
# 
import json
from langchain_core.agents import AgentActionMessageLog, AgentFinish

from langchain.agents import AgentExecutor
from langchain.agents.format_scratchpad import format_to_openai_function_messages
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from typing import Any, Dict, List
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.tools import BaseTool, StructuredTool, tool
from langchain_core.callbacks import BaseCallbackHandler
# 
# define tool 
# 

@tool()
def test_tool(message: str) -> str:
    """tool for test AI agent executor"""
    return f"test tool executed: {message}"

# 
# Create response schema
# 
class Response(BaseModel):
    """Final response to the question being asked"""

    answer: str = Field(description="The final answer to respond to the user")
    sources: List[int] = Field(
        description="List of page chunks that contain answer to the question. Only include a page chunk if it contains relevant information"
    )

# 
# Create the custom parsing logic
# 
def parse(output):
    # If no function was invoked, return to user
    if "function_call" not in output.additional_kwargs:
        return AgentFinish(return_values={"output": output.content}, log=output.content)

    # Parse out the function call
    function_call = output.additional_kwargs["function_call"]
    name = function_call["name"]
    inputs = json.loads(function_call["arguments"])

    # If the Response function was invoked, return to the user with the function inputs
    if name == "Response":
        return AgentFinish(return_values=inputs, log=str(function_call))
    # Otherwise, return an agent action
    else:
        return AgentActionMessageLog(
            tool=name, tool_input=inputs, log="", message_log=[output]
        )
# 
# Create the Agent    
# 
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful assistant"),
        ("user", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ]
)

# 
# [Chain Handler](https://github.com/langchain-ai/langchain/issues/6628#issuecomment-1906776820)
# 
class CustomHandler(BaseCallbackHandler):
    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> Any:
        formatted_prompts = "\n".join(prompts)
        print(f"Prompt:\n{formatted_prompts}\n\n")

llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo" , callbacks=[CustomHandler()])

llm_with_tools = llm.bind_functions([test_tool, Response])

def process_agent_scratchpad(x):
    intermediate_steps = x["intermediate_steps"]
    print( f"\nintermediate_steps:\n{intermediate_steps}\n")
    result = format_to_openai_function_messages(intermediate_steps)
    print( f"\agent_scratchpad:\n{result}\n")
    return result

agent = (
    {
        "input": lambda x: x["input"],
        # Format agent scratchpad from intermediate steps
        "agent_scratchpad": lambda x: process_agent_scratchpad(x),
    }
    | prompt
    | llm_with_tools
    | parse
)


agent_executor = AgentExecutor(tools=[test_tool], agent=agent )

# 
# Run the agent
# 
result = agent_executor.invoke(
    {"input": "what is the result of test with message: 'MY FIRST TEST'?"},
    return_only_outputs=True,
)

print(result)