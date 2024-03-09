from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState


def translate_generic_diagram_description_to_plantUML(state: AgentState):

    prompt_text = """
    translate the json data representing a diagram's data into a plantuml script considering:
    - each participant with shape equals to "person" must be translated in plantuml "actor" in the form: actor "<name>" as <camel case name><<description>>
    - each other participant must be translated in a plantuml "rectangle" element in the form: rectangle "<name>" as <camel case name><<description>>
    
    description: 
    {diagram_description}

    """

    prompt_template = PromptTemplate.from_template(prompt_text)

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    # llm = ChatOpenAI(model="gpt-4", temperature=0)

    output_parser = StrOutputParser()

    chain = prompt_template | llm | output_parser
    
    response = chain.invoke( { "diagram_description": state["diagram_raw"] } )

    return { "diagram_code": response }
