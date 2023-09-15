"""
Inspired by [LangChain Chat with Custom Tools, Functions and Memory](https://medium.com/@gil.fernandes/langchain-chat-with-custom-tools-functions-and-memory-e34daa331aa7)
"""

#from dotenv import load_dotenv
#load_dotenv()

import streamlit as st
from langchain.agents import AgentExecutor
from langchain.chat_models import ChatOpenAI

from chain_setup import setup_agent
from agent_streamlit_writer import StreamlitCallbackHandler

QUESTION_HISTORY: str = 'question_history'

class AgentConfig():
    """
    Contains the configuration of the LLM.
    """
    model = 'gpt-3.5-turbo-0613'

    def __init__(self, openai_api_key ):
        self.llm = ChatOpenAI(temperature=0, model=self.model, openai_api_key=openai_api_key)


def init_stream_lit():
    title = "Chat Functions Introduction"

    st.set_page_config(page_title=title, layout="wide")
    
    # Get an OpenAI API Key before continuing
    if "openai_api_key" in st.secrets:
        openai_api_key = st.secrets.openai_api_key
    else:
        openai_api_key = st.sidebar.text_input("OpenAI API Key", type="password")
    
    if not openai_api_key:
        st.info("Enter an OpenAI API Key to continue")
        st.stop()

    agent_executor: AgentExecutor = prepare_agent( openai_api_key )
    
    st.header(title)
    
    if QUESTION_HISTORY not in st.session_state:
        st.session_state[QUESTION_HISTORY] = []
    
    intro_text()
    
    simple_chat_tab, historical_tab = st.tabs(["Simple Chat", "Session History"])
    
    with simple_chat_tab:
        user_question = st.text_input("Your question")
        with st.spinner('Please wait ...'):
            try:
                response = agent_executor.run(user_question, callbacks=[StreamlitCallbackHandler(st)])
                st.write(f"{response}")
                st.session_state[QUESTION_HISTORY].append((user_question, response))
            except Exception as e:
                st.error(f"Error occurred: {e}")
                
    with historical_tab:
        for q in st.session_state[QUESTION_HISTORY]:
            question = q[0]
            if len(question) > 0:
                st.write(f"Q: {question}")
                st.write(f"A: {q[1]}")


def intro_text():
    with st.expander("Click to see application info:"):
        st.write(f"""Ask questions about:
- [Wikipedia](https://www.wikipedia.org/) Content
- Scientific publications ([pubmed](https://pubmed.ncbi.nlm.nih.gov) and [arxiv](https://arxiv.org))
- Mathematical calculations
- Search engine content ([DuckDuckGo](https://duckduckgo.com/))
- Meditation related events (Custom Tool)
    """)
        
@st.cache_resource()
def prepare_agent( openai_api_key ) -> AgentExecutor:
    return setup_agent( cfg = AgentConfig(openai_api_key) )


if __name__ == "__main__":
    init_stream_lit()