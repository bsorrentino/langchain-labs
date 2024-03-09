from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate

def describe_diagram_image(state: AgentState):

    prompt_diagram_template = PromptTemplate.from_template("""
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

    prompt = prompt_diagram_template.format(format_instructions=output_parser.get_format_instructions())

    openai = ChatOpenAI(model="gpt-4-vision-preview",
        max_tokens=2000,
        temperature=0,
        max_retries=1,
    )

    response = openai.invoke([
        HumanMessage(content=[
                {
                    "type": "text", 
                    "text": prompt
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


if __name__ == "__main__":
    from os import path
    from agent_state import AgentState, get_image_data

    image_to_process = get_image_data( path.join( "assets", "architecture2.png" ))
    # image_to_process = get_image_data( path.join( "assets", "http-streaming.png" ))

    state = AgentState( diagram_image_url_or_data= image_to_process) 

    response = describe_diagram_image(state)

    print(response["diagram"])