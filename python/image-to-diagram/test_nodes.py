from agent_state import AgentState

def describe_diagram_image_test_sequence_01( state: AgentState):
    return { "diagram": { 
        "type": "sequence", 
        "title": "Chunked Transfer Encoding over HTTP", 
        "description": """
        1. The diagram starts with two entities: "Web App" and "Web Server".
        2. From "Web App" to "Web Server", there is a labeled arrow with "GET /resource HTTP/1.1".
        3. The "Web Server" responds back to "Web App" with three separate messages stacked vertically:
            - "Transfer-Encoding: chunked"
            - "Content-Type: text/plain"
            - "HTTP/1.1 200 OK"
        4. There is a loop construct starting from the "Web App" side with the label "until data ends".
        5. Inside the loop, a dashed arrow labeled "request data" goes from "Web App" to "Web Server".
        6. Inside the "Web Server" there are two steps depicted as a vertical process:
            - A dashed arrow pointing right with the label "fetch data".
            - A solid arrow pointing left with the label "Prepare chunk".
        7. A solid arrow labeled "write chunk" goes from "Web Server" to "Web App".
        8. An arrow with a filled orange arrowhead labeled "decode chunk" points back from "Web App" to "Web Server", indicating a response to the "write chunk" action.
        """ 
        }}

def describe_diagram_image_test_generic_01( state: AgentState):
    return { "diagram": {
        "type": "process",
        "title": "Workflow Process Diagram",
        "description": """
        1. An Outlook trigger starts the process. 
        2. The trigger submits data for text analysis. 
        2.1 The text analysis function is invoked. 
        3. The processed data is then saved in Dataverse. 
        4. A Canvas App reads the data from Dataverse. 
        5. The data is sent to an Approver who approves it. 
        6. Upon approval, a Flow is run. 
        7. The Flow checks out (locks) a document in Sharepoint. 
        8. A script is invoked by the Flow and it waits for a return. 
        9. The script applies some operation in an Excel file. 
        10. After the operation, the document is checked in (unlocked) in Sharepoint. Finally, the updated document is validated and shared with a Validator.
        """
    }}

