
from os import path
from typing import TypedDict, Annotated, Sequence
import operator
import base64
from langchain import hub
from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langchain.prompts import PromptTemplate



class AgentState(TypedDict):
    # messages: Annotated[Sequence[BaseMessage], operator.add]
    diagram_image_url_or_data: str
    diagram_description: str
    diagram_code: str

def describe_diagram_image(state: AgentState):

    prompt_diagram = """
    describe the diagram in the image step by step so we can translate it into diagram-as-code syntax.

    start description with:
    - Diagram tipology: ["<diagram type>"]. Eg. ["sequence diagram"], ["class diagram"], ["state machine diagram"], etc.
    - Diagram summary (max one line) or tile: ["<diagram title|summary>"] 

    """

    openai = ChatOpenAI(model="gpt-4-vision-preview",
        max_tokens=2000,
        temperature=0.5
    )

    response = openai.invoke([
        HumanMessage(content=[
                {
                    "type": "text", 
                    "text": prompt_diagram
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": state['diagram_image_url_or_data']
                    },
                },
            ]
        )
    ])

    return { "diagram_description": response.content }


def translate_diagram_description_to_plantUML(state: AgentState):

    prompt_template = PromptTemplate.from_template(
        """
        translate the diagram description into plantUML syntax.
        
        description: 
        {diagram_description}
        
        """
    )

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

    chain = prompt_template | llm
    
    response = chain.invoke( { "diagram_description": state["diagram_description"] })

    return { "diagram_code": response.content }


def input_image(state: AgentState):

    def get_image_as_base64(image_path):
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
            base64_encoded = base64.b64encode(image_data).decode("utf-8")
            return base64_encoded
        
    image_path = path.join( "assets", "architecture2.png" )
    print( image_path )
    return { "diagram_image_url_or_data": "data:image/png;base64," + get_image_as_base64(image_path) }


# Define a new graph

workflow = StateGraph(AgentState)

workflow.add_node("input_image", input_image)
workflow.add_node("agent_describer", describe_diagram_image)
workflow.add_node("agent_plantum", translate_diagram_description_to_plantUML)

workflow.set_entry_point( 'input_image')

workflow.add_edge('input_image', 'agent_describer')
workflow.add_edge('agent_describer', 'agent_plantum')
workflow.add_edge('agent_plantum', END)

app = workflow.compile()

app.invoke({})