"""
Inspired by [LangChain Chat with Custom Tools, Functions and Memory](https://medium.com/@gil.fernandes/langchain-chat-with-custom-tools-functions-and-memory-e34daa331aa7)
"""

import logging
#from dotenv import load_dotenv
#load_dotenv()

import streamlit as st
from langchain.agents import AgentExecutor
from langchain.chat_models import ChatOpenAI, AzureChatOpenAI
from langchain.prompts import PromptTemplate

from chain_setup import setup_agent
from agent_streamlit_writer import StreamlitCallbackHandler

# configure logging
logging.basicConfig(level=logging.DEBUG)

QUESTION_HISTORY: str = 'question_history'

class AgentConfig():
    """
    Contains the configuration of the LLM.
    """
    model = 'gpt-3.5-turbo-0613'

    def __init__(self, st, azure=True ):    
        if azure:
            # Get an OpenAI API Key before continuing
            if "azure_openai_api_key" in st.secrets:
                openai_api_key = st.secrets.azure_openai_api_key
            else:
                openai_api_key = st.sidebar.text_input("Azure OpenAI API Key", type="password")
            
            self.llm = AzureChatOpenAI(
                openai_api_base="https://labsai.openai.azure.com/",
                openai_api_version="2023-08-01-preview",
                deployment_name="Calling-Function",
                openai_api_key=openai_api_key,
                openai_api_type="azure",
                max_retries=2,
                # max_tokens=1000,
                )
        else:
            # Get an OpenAI API Key before continuing
            if "openai_api_key" in st.secrets:
                openai_api_key = st.secrets.openai_api_key
            else:
                openai_api_key = st.sidebar.text_input("OpenAI API Key", type="password")
            
            self.llm = ChatOpenAI(
                temperature=0, 
                model=self.model, 
                openai_api_key=openai_api_key, 
                max_retries=2,
                # max_tokens=1000,
                )
        # logging.debug( f"openai_api_key: {openai_api_key}" )

        if not openai_api_key:
            st.info("Enter an OpenAI API Key to continue")
            st.stop()

 


def init_stream_lit():
    title = "Chat Functions Introduction"

    st.set_page_config(page_title=title, layout="wide")
    
    st.header(title)
    
    if QUESTION_HISTORY not in st.session_state:
        st.session_state[QUESTION_HISTORY] = []
    
    intro_text()
    
    csv_file = st.file_uploader("Upload a CSV file", type="csv")
    #st.write("Uploaded CSV file: ", csv_file)
    
    if csv_file is None:
        st.stop()

    logging.debug( f"Uploaded CSV file: {csv_file}" )

    agent_executor: AgentExecutor = prepare_agent( csv_file )

    simple_chat_tab, log_tab, historical_tab = st.tabs(["Simple Chat", "Log", "Session History"])
    
    #st.session_state["input"] = ""
    
    with simple_chat_tab:
        
        user_question = st.text_input("Your question")
        with st.spinner('Please wait ...'):
            try:
                template = """I want you to become my assistant.

                our goal is to find out my favorite movie to watch tonight

                ask me what you need to identify the movie use my answer to refine search and continue asking until we got one movie as result
                
                Human: {user_question}
                Assistant:"""
                prompt = PromptTemplate(input_variables=["user_question"], template=template)

                response = agent_executor.run(prompt.format( user_question = user_question ), callbacks=[StreamlitCallbackHandler(log_tab)])
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
def prepare_agent( csv_file ) -> AgentExecutor:
    return setup_agent( cfg = AgentConfig(st), csv_file=csv_file )


if __name__ == "__main__":
    init_stream_lit()