import base64
from typing import TypedDict, List
from langchain.output_parsers import StructuredOutputParser
class DiagramParticipant(TypedDict):
    name: str
    shape: str
    description: str

class DiagramRelation(TypedDict):
    source: str # source
    target: str # destination
    description: str

class DiagramContainer(TypedDict):
    name: str # source
    children: List[str] # destination
    description: str

class DiagramDescription(TypedDict):
    type: str
    title: str
    participans: List[DiagramParticipant]
    relations: List[DiagramRelation]
    containers: List[DiagramContainer]
    description: str # NLP description

class AgentState(TypedDict):
    # messages: Annotated[Sequence[BaseMessage], operator.add]
    diagram_image_url_or_data: str
    diagram: DiagramDescription
    diagram_code: str

def get_image_data(image_path):

    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
        base64_encoded = base64.b64encode(image_data).decode("utf-8")
        return "data:image/png;base64," + base64_encoded
