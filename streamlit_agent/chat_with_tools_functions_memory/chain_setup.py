from typing import Tuple, Dict
# from langchain.utilities.duckduckgo_search import DuckDuckGoSearchAPIWrapper
# from langchain.utilities import PubMedAPIWrapper
from langchain.utilities.wikipedia import WikipediaAPIWrapper

# from langchain import (
#     ArxivAPIWrapper, 
#     LLMMathChain
# )
from langchain.agents import (
    initialize_agent, 
    Tool,
    AgentType,
    create_csv_agent,
    AgentExecutor,
)
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI

from langchain.tools import StructuredTool
from langchain.memory import ConversationBufferMemory
from langchain.prompts.chat import MessagesPlaceholder

# import tools_wrappers

def setup_memory() -> Tuple[Dict, ConversationBufferMemory]:
    """
    Sets up memory for the open ai functions agent.
    :return a tuple with the agent keyword pairs and the conversation memory.
    """
    agent_kwargs = {
        "extra_prompt_messages": [MessagesPlaceholder(variable_name="memory")],
    }
    memory = ConversationBufferMemory(memory_key="memory", return_messages=True)

    return agent_kwargs, memory

def setup_agent( cfg, csv_file ) -> AgentExecutor:
    """
    Sets up the tools for a function based chain.
    We have here the following tools:
    - wikipedia
    - duduckgo
    - calculator
    - arxiv
    - events (a custom tool)
    - pubmed
    """

    # duckduck_search = DuckDuckGoSearchAPIWrapper()
    # pubmed = PubMedAPIWrapper()
    # arxiv = ArxivAPIWrapper()
    # events = tools_wrappers.EventsAPIWrapper()
    # events.doc_content_chars_max=5000

    csv_agent = create_csv_agent(
        cfg.llm,
        path=csv_file,
        verbose=True,
    )
    wikipedia = WikipediaAPIWrapper()

    # llm_math_chain = LLMMathChain.from_llm(llm=cfg.llm, verbose=False)

    tools = [
        Tool(
            name="CSVEvaluator",
            func=csv_agent.run,
            description="evaluate movie data in the uploaded CSV file"
        ),
        # Tool(
        #     name="Calculator",
        #     func=llm_math_chain.run,
        #     description="useful for when you need to answer questions about math"
        # ),
        Tool(
            name="Wikipedia",
            func=wikipedia.run,
            description="useful when you need an answer about encyclopedic general knowledge"
        ),
        # Tool(
        #     name = "Search DuckDuck Go",
        #     func=duckduck_search.run,
        #     description="useful for when you need to answer questions about current events. You should ask targeted questions"
        # ),
        # Tool(
        #     name="Arxiv",
        #     func=arxiv.run,
        #     description="useful when you need an answer about encyclopedic general knowledge"
        # ),
        # StructuredTool.from_function(
        #     func=events.run,
        #     name="Events",
        #     description="useful when you need an answer about meditation related events in the united kingdom"
        # ),
        # StructuredTool.from_function(
        #     func=pubmed.run, 
        #     name='PubMed',
        #     description='Useful tool for querying medical publications'
        # )
    ]
    agent_kwargs, memory = setup_memory()

    return initialize_agent(
        tools, 
        cfg.llm, 
        agent=AgentType.OPENAI_FUNCTIONS, 
        verbose=False, 
        agent_kwargs=agent_kwargs,
        memory=memory
    )