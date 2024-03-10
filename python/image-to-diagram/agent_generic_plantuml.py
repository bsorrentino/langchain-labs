from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState
import json

def translate_generic_diagram_description_to_plantUML(state: AgentState):

    prompt_text = """
    translate the json data representing a diagram's data into a plantuml script considering:
    - each participant with shape equals to "person" must be translated in plantuml "actor" in the form: actor "<name>" as <camel case name><<description>>
    - each other participant must be translated in a plantuml "rectangle" element in the form: rectangle "<name>" as <camel case name><<description>>
    - put diagram description in the legend of the diagram in the form:
    legend
    <description with a bullet point for each steps>
    end legend
    
    description: 
    {diagram_description}

    """

    prompt_template = PromptTemplate.from_template(prompt_text)

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    # llm = ChatOpenAI(model="gpt-4", temperature=0)

    output_parser = StrOutputParser()

    chain = prompt_template | llm | output_parser
    
    json_object = state["diagram"]

    response = chain.invoke( { "diagram_description": json.dumps( json_object ) } )

    return { "diagram_code": response }
