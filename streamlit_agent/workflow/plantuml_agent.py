
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

template = """{revised_prompt}

Evaluate revised prompt above to generate a diagram using "PlantUML Activity Diagram Syntax" 
write only and esclusively the diagram in markdown format starting with  "```plantuml".

the rules that you must follow for diagram generation are:
* AttachData, Input, Popup are keywords

"""

def generate_diagram_syntax( llm, revised_prompt ):
    prompt = PromptTemplate(input_variables=["revised_prompt"], template=template)
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    result = llm_chain.run({ "revised_prompt": revised_prompt })
    return result
