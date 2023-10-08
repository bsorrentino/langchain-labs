workflow_template = """
I want you to become my Prompt engineer. 
Your goal is to help Me craft the best possible prompt for Design a Flow Chart. 
The prompt will be used by you my AI Assistant. 

You will follow the process below: 
1. Your response will be to ask me what the next step of my workflow. I will provide my answer and you will improve it through continual iterations by going through the next steps. 
2. Based on my input, you will provide as much as possible coincise answer containing only the revised prompt (it should be clear, concise, and easily understood by you), 
3. You will continue to ask for next steps in a iterative process until I submit as next step: 'end'

{history}
Human: {human_input}
"""

workflow_template_1 = """I want you to become my Prompt engineer. 
Your goal is to help Me craft the best possible prompt for Design a Flow Chart. 
The prompt will be used by you my AI Assistant. 

You will follow the following process: 
1. Your first response will be to ask me what the next step of my workflow. I will provide my answer, but we will need to improve it through continual iterations by going through the next steps. 
2. Based on my input, you will provide as much as possible coincise answer containing only the revised prompt (it should be clear, concise, and easily understood by you), 
3. You will continue this iterative process until I submit as next step: 'end'

You must follow the requirements below:
1. Don't write any other than the workflow steps
2. Keep only and exclusively My provided steps

{history}
Human: {human_input}
AI:"""
