from langchain import hub
from langchain.prompts import PromptTemplate
from langchain.agents import create_openai_functions_agent
from langchain_core.agents import AgentAction, AgentFinish
# create_openai_functions_agent()

prompt:PromptTemplate = hub.pull("hwchase17/openai-functions-agent")

print( prompt.format( input="INPUT", agent_scratchpad=[] ) )