from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import PromptTemplate

from agent_state import AgentState

def translate_generic_diagram_description_to_plantUML(state: AgentState):

    # print(state)

    prompt_template = PromptTemplate.from_template(
        """
        Translate the diagram description into a text that conforms to the PlantUML syntax. 
        In the analysis of the description, each noun should be translated into "rectangle" symbol 
        and actions should be considered as relationships between the nouns.

        description: 
        {diagram_description}
        
        """
    )

    # llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    output_parser = StrOutputParser()

    chain = prompt_template | llm | output_parser
    
    response = chain.invoke( { "diagram_description": state["diagram"]["description"] } )

    return { "diagram_code": response }
