from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState
def translate_sequence_diagram_description_to_plantUML(state: AgentState):

    prompt_template = PromptTemplate.from_template(
        """
        translate the diagram description into plantUML syntax.
        
        description: 
        {diagram_description}
        
        """
    )

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

    output_parser = StrOutputParser()
    
    chain = prompt_template | llm | output_parser
    
    response = chain.invoke( { "diagram_description": state["diagram"]["description"] } )

    return { "diagram_code": response }
