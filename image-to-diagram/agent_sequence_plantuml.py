from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState


def translate_sequence_diagram_description_to_plantUML(state: AgentState):
    prompt_text = """
    Translate the diagram description into plantUML syntax. 
    Also put the diagram description in the legend in the form:
    legend
    <description with a bullet point for each steps>
    end legend
    
    diagram description with title {diagram_title}: 
    {diagram_description}

    """

    prompt_template = PromptTemplate.from_template(prompt_text)

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

    output_parser = StrOutputParser()
    
    chain = prompt_template | llm | output_parser
    
    diagram = state["diagram"]

    response = chain.invoke( {"diagram_title": diagram["title"], "diagram_description": diagram["description"] } )

    return { "diagram_code": response }
