from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState


def describe_diagram_image(state: AgentState):

    prompt_diagram = PromptTemplate.from_template("""
    describe the diagram in the image step by step so we can translate it into diagram-as-code syntax.

    {format_instructions}

    """)

    format_instructions = """
    start description with:
    - Diagram tipology: ["<diagram type>"]. Eg. ["sequence diagram"], ["class diagram"], ["state machine diagram"], etc.
    - Diagram summary (max one line) or tile: ["<diagram title|summary>"] 
    """

    response_schemas = [
        ResponseSchema(name="type", description='Diagram tipology (one word). Eg. "sequence", "class", "process", etc."),'),
        ResponseSchema(name="title", description="Diagram summary (max one line) or title (if any)"),
        ResponseSchema(name="description", description="step by step diagram description"),
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    format_instructions = output_parser.get_format_instructions()

    openai = ChatOpenAI(model="gpt-4-vision-preview",
        max_tokens=2000,
        temperature=0.5
    )

    response = openai.invoke([
        HumanMessage(content=[
                {
                    "type": "text", 
                    "text": prompt_diagram.format(format_instructions=format_instructions)
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": state['diagram_image_url_or_data']
                    },
                },
            ]
        )
    ] )

    return { "diagram": output_parser.parse(response.content) }
