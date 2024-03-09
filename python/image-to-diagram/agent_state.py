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
