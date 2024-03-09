
from os import path, getenv
import base64
from langgraph.graph import StateGraph, END

from agent_state import AgentState
from agent_describe import describe_diagram_image
from agent_generic_plantuml import translate_generic_diagram_description_to_plantUML
from agent_sequence_plantuml import translate_sequence_diagram_description_to_plantUML
from test_nodes import describe_diagram_image_test_sequence_01, describe_diagram_image_test_generic_01


def route_diagram_translation(state: AgentState):
    if state["diagram"]["type"] == "sequence":
        return "sequence"
    else:
        return "generic"

def get_image_data(image_path):

    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
        base64_encoded = base64.b64encode(image_data).decode("utf-8")
        return "data:image/png;base64," + base64_encoded

# Define a new graph

workflow = StateGraph(AgentState)

if( getenv("TEST") == "sequence" ):
    workflow.add_node("agent_describer", describe_diagram_image_test_sequence_01)
else:
    if( getenv("TEST") == "generic" ):
        workflow.add_node("agent_describer", describe_diagram_image_test_generic_01)
    else:
        workflow.add_node("agent_describer", describe_diagram_image)

workflow.add_node("agent_sequence_plantuml", translate_sequence_diagram_description_to_plantUML)
workflow.add_node("agent_gemeric_plantuml", translate_generic_diagram_description_to_plantUML)

workflow.add_edge('agent_sequence_plantuml', END)
workflow.add_edge('agent_gemeric_plantuml', END)
workflow.add_conditional_edges( 
    "agent_describer", 
    route_diagram_translation,
    {
        "sequence": "agent_sequence_plantuml",
        "generic": "agent_gemeric_plantuml",
    }
)
workflow.set_entry_point( 'agent_describer')

app = workflow.compile()

app.get_graph().print_ascii()

# image_to_process = get_image_data( path.join( "assets", "architecture2.png" ))
image_to_process = get_image_data( path.join( "assets", "http-streaming.png" ))

inputs = { "diagram_image_url_or_data": image_to_process }

response = app.invoke(inputs)

print( response["diagram_code"] )


