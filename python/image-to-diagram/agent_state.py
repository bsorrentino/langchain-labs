import base64
from typing import TypedDict

class DiagramDescription(TypedDict):
    type: str
    title: str
    description: str

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
