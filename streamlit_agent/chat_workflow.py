import logging
import base64
import string

from zlib import compress
from langchain.chains import LLMChain
from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory
from langchain.memory.chat_message_histories import StreamlitChatMessageHistory
from langchain.prompts import PromptTemplate

import streamlit as st

# configure logging
logging.basicConfig(level=logging.DEBUG)

# PlantUML Server configuration
# see: https://github.com/dougn/python-plantuml/blob/master/plantuml.py
def deflate_and_encode(plantuml_text):
    """zlib compress the plantuml text and encode it for the plantuml server.
    """

    plantuml_alphabet = string.digits + string.ascii_uppercase + string.ascii_lowercase + '-_'
    base64_alphabet   = string.ascii_uppercase + string.ascii_lowercase + string.digits + '+/'
    b64_to_plantuml = bytes.maketrans(base64_alphabet.encode('utf-8'), plantuml_alphabet.encode('utf-8'))

    zlibbed_str = compress(plantuml_text.encode('utf-8'))
    compressed_string = zlibbed_str[2:-4]
    return base64.b64encode(compressed_string).translate(b64_to_plantuml).decode('utf-8')

def generate_diagram_syntax( llm, revised_prompt ):
    template = """{revised_prompt}
    
    Evaluate revised prompt above to generate a diagram using "PlantUML Activity Diagram Syntax" 
    write only and esclusively the diagram in markdown format starting with  "```plantuml".
    
    the rules that you must follow for diagram generation are:
    * AttachData, Input, Popup are keywords
    
    """
    prompt = PromptTemplate(input_variables=["revised_prompt"], template=template)
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    result = llm_chain.run({ "revised_prompt": revised_prompt })
    return result

def clear_session(): 
    # Delete all the items in Session state
    for key in st.session_state.keys():
        del st.session_state[key]

def main(): 

    st.set_page_config(page_title="Workflow", page_icon="🔄")
    st.title("🔄 Workflow management")

    """
    The prompt is a request for the AI assistant to help craft the best possible prompt for designing a flow chart using the PlantUML format. 
    The AI assistant will iteratively improve the prompt based on the user's input until the user indicates to stop. 
    The final response will be in the PlantUML format.
    """

    # Set up memory
    msgs = StreamlitChatMessageHistory(key="langchain_messages")    
    memory = ConversationBufferMemory(chat_memory=msgs)
    if len(msgs.messages) == 0:
        msgs.add_ai_message("Starting with designing your workflow. What would you like the first step to be?")


    # Get an OpenAI API Key before continuing
    if "openai_api_key" in st.secrets:
        openai_api_key = st.secrets.openai_api_key
    else:
        openai_api_key = st.sidebar.text_input("OpenAI API Key", type="password")
    if not openai_api_key:
        st.info("Enter an OpenAI API Key to continue")
        st.stop()

    # Set up the LLMChain, passing in memory
    template = """I want you to become my Prompt engineer. 
    Your goal is to help Me craft the best possible prompt for Design a Flow Chart. 
    The prompt will be used by you, AI Assistant. 

    You will follow the following process: 
    1. Your first response will be to ask me what the next step of my workflow. I will provide my answer, but we will need to improve it through continual iterations by going through the next steps. 
    2. Based on my input, you will provide as much as possible coincise answer containing only the revised prompt (it should be clear, concise, and easily understood by you), 
    3. You will continue this iterative process until I submit as next step: 'end'

    You must follow the requirements below:
    1. Don't write any other than the workflow steps
    2. Keep only and exclusively My provided steps

    {history}
    Human: {human_input}
    AI:"""

    prompt = PromptTemplate(input_variables=["history", "human_input"], template=template)

    llm = OpenAI(openai_api_key=openai_api_key, temperature="0.0")
    llm_chain = LLMChain(llm=llm, prompt=prompt, memory=memory)

    # Render current messages from StreamlitChatMessageHistory
    # for msg in msgs.messages:
    #     st.chat_message(msg.type).write(msg.content)


    if 'lastResponse' not in st.session_state:
        st.session_state.lastResponse = ""

    # If user inputs a new prompt, generate and draw a new response
    if prompt := st.chat_input(placeholder="next steps"):
        logging.debug( f"prompt: {prompt}" )
        if prompt != "end":
            st.chat_message("human").write(prompt)
            # Note: new messages are saved to history automatically by Langchain during run
            st.session_state.lastResponse = llm_chain.run(prompt)
            st.chat_message("ai").write(st.session_state.lastResponse)
    

    # Draw the messages at the end, so newly generated ones show up immediately
    st.divider()

    chat_col, preview_col = st.columns(2)

    with chat_col:
        view_messages = st.expander("View the message contents in session state")

        with view_messages:
            """
            Memory initialized with:
            ```python
            msgs = StreamlitChatMessageHistory(key="langchain_messages")
            memory = ConversationBufferMemory(chat_memory=msgs)
            ```

            Contents of `st.session_state.langchain_messages`:
            """
            view_messages.json(st.session_state.langchain_messages)

    with preview_col:
        if prompt == "end":
            clear_session()
            st.stop()
        elif len(st.session_state.lastResponse.strip()) > 0:
            logging.debug( f"LAST RESPONSE:\n\n{st.session_state.lastResponse}\n\n" )
            diagram = generate_diagram_syntax( llm, st.session_state.lastResponse )
            st.markdown( diagram )


if __name__ == "__main__":
    main()

