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
	"title": "Approval and Validation Process",
	"description": "The diagram illustrates a multi-step process involving various applications and user roles. The process begins with Outlook triggering a Flow (1), which then submits data to Text Analysis (2). The Text Analysis invokes a Function (2.1). The Flow saves the output to Dataverse (3). A Canvas App reads from Dataverse (4) and requires approval from an Approver (5). Once approved, the Canvas App triggers another Flow (6), which checks out a document in Sharepoint (7), invokes a Script (8), and waits for a return. The Script applies changes to an Excel file (9), which is then checked in (unlocked) by the Flow (10). Finally, the Excel file is ready for validation and sharing by a Validator."
}}

def describe_diagram_image_test_generic_02( state: AgentState):
    return { "diagram": { "type": "workflow" }, "diagram_raw": """
    ```json
    {
        "type": "process",
        "title": "Approval and Validation Process",
        "participants": [
            { "name": "Outlook", "shape": "rectangle", "description": "Email service" },
            { "name": "Flow", "shape": "parallelogram", "description": "Automation service" },
            { "name": "Text Analysis", "shape": "rectangle", "description": "Text analysis service" },
            { "name": "Function", "shape": "rectangle", "description": "Cloud function service" },
            { "name": "Dataverse", "shape": "cylinder", "description": "Data storage service" },
            { "name": "Canvas App", "shape": "rectangle", "description": "Application interface" },
            { "name": "Approver", "shape": "person", "description": "Person who approves" },
            { "name": "Validator", "shape": "person", "description": "Person who validates and shares" },
            { "name": "Script", "shape": "document", "description": "Script file" },
            { "name": "Excel", "shape": "document", "description": "Excel file" },
            { "name": "Sharepoint", "shape": "rectangle", "description": "Collaboration platform" }
        ],
        "relations": [
            { "source": "Outlook", "target": "Flow", "description": "trigger" },
            { "source": "Flow", "target": "Text Analysis", "description": "submit" },
            { "source": "Text Analysis", "target": "Function", "description": "invoke" },
            { "source": "Flow", "target": "Dataverse", "description": "Save" },
            { "source": "Dataverse", "target": "Canvas App", "description": "Read" },
            { "source": "Canvas App", "target": "Approver", "description": "Approve" },
            { "source": "Approver", "target": "Canvas App", "description": "Approve" },
            { "source": "Canvas App", "target": "Flow", "description": "Run" },
            { "source": "Flow", "target": "Script", "description": "Check Out (lock)" },
            { "source": "Script", "target": "Excel", "description": "Apply" },
            { "source": "Excel", "target": "Validator", "description": "Validate & Share" },
            { "source": "Validator", "target": "Excel", "description": "Validate & Share" },
            { "source": "Flow", "target": "Excel", "description": "Check in (unlock)" }
        ],
        "containers": [
            { "name": "Sharepoint", "children": ["Script", "Excel"], "description": "Document library" }
        ]
    }
    ```
    """ }