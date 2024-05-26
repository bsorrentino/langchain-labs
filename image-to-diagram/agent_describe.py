from langchain_openai import ChatOpenAI
from langchain.schema.messages import HumanMessage
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState

def _get_prompt_v1():

    prompt_text = """
    describe the diagram in the image step by step so we can translate it into diagram-as-code syntax. 

    {format_instructions}
    """
    prompt_diagram_template = PromptTemplate.from_template(prompt_text)


    response_schemas = [
        ResponseSchema(name="type", description='Diagram tipology (one word). Eg. "sequence", "class", "process", etc."),'),
        ResponseSchema(name="title", description="Diagram summary (max one line) or title (if any)"),
        ResponseSchema(name="participants", type="array", description="""list of participants in the diagram in the form { name:"<name>", shape:"<shape>", description:"<participant description>" }"""),
        ResponseSchema(name="relations", type="array", description="""list of relations in the diagram in the form { source:"<source participant>", target:"<target participant>", description:"<relation description>" }"""),
        ResponseSchema(name="containers", type="array", description="""list of participants that contain other ones in the diagram in the form { name:"<name>", children:[ list of elements name contained separated by comma ], description:"<container description>" }"""),
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    prompt = prompt_diagram_template.format(format_instructions=output_parser.get_format_instructions())

    return prompt, output_parser

def _get_prompt():

    prompt_text = """
    describe the diagram in the image step by step so we can translate it into diagram-as-code syntax. 

    {format_instructions}
    """
    prompt_diagram_template = PromptTemplate.from_template(prompt_text)


    response_schemas = [
        ResponseSchema(name="type", description='Diagram tipology (one word). Eg. "sequence", "class", "process", etc."),'),
        ResponseSchema(name="title", description="Diagram summary (max one line) or title (if any)"),
        ResponseSchema(name="participants", type="array", description="""list of participants in the diagram in the form { name:"<name>", shape:"<shape>", description:"<participant description>" }"""),
        ResponseSchema(name="relations", type="array", description="""list of relations in the diagram in the form { source:"<source participant>", target:"<target participant>", description:"<relation description>" }"""),
        ResponseSchema(name="containers", type="array", description="""list of participants that contain other ones in the diagram in the form { name:"<name>", children:[ list of elements name contained separated by comma ], description:"<container description>" }"""),
        ResponseSchema(name="description", type="array", description="""Step by step description of the diagram with clear indication of participants and actions between them."""),

    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

    prompt = prompt_diagram_template.format(format_instructions=output_parser.get_format_instructions())

    return prompt, output_parser

def describe_diagram_image(state: AgentState):
    """
    Describe the diagram in the image step by step so we can translate it into diagram-as-code syntax.
    """
    prompt, output_parser = _get_prompt()

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

    content = response.content
    return { "diagram_description": content , "diagram": output_parser.parse( content ) }


if __name__ == "__main__":
    from os import path
    import json
    from agent_state import get_image_data

    prompt, _ = _get_prompt()

    print( prompt )

    # image_to_process = get_image_data( path.join( "assets", "architecture2.png" ))
    image_to_process = get_image_data( path.join( "assets", "diagram1.png" ))
    # image_to_process = get_image_data( path.join( "assets", "http-streaming.png" ))

    state = AgentState( diagram_image_url_or_data= image_to_process) 

    response = describe_diagram_image(state)

    json_object = response["diagram"]

    print( json.dumps( json_object, indent=4 ) )
    