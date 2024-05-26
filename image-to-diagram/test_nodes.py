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

def describe_diagram_image_test_sequence_02( state: AgentState):
    return { "diagram":{
    "type": "sequence",
    "title": "Chunked Transfer Encoding over HTTP",
    "participants": [
        {
            "name": "Web App",
            "shape": "actor",
            "description": "Initiates the HTTP request and processes the response"
        },
        {
            "name": "Web Server",
            "shape": "actor",
            "description": "Handles the HTTP request and sends a chunked response"
        }
    ],
    "relations": [
        {
            "source": "Web App",
            "target": "Web Server",
            "description": "GET /resource HTTP/1.1"
        },
        {
            "source": "Web Server",
            "target": "Web App",
            "description": "Transfer-Encoding: chunked, Content-Type: text/plain, HTTP/1.1 200 OK"
        },
        {
            "source": "Web App",
            "target": "Web Server",
            "description": "request data"
        },
        {
            "source": "Web Server",
            "target": "Web App",
            "description": "fetch data"
        },
        {
            "source": "Web Server",
            "target": "Web App",
            "description": "Prepare chunk"
        },
        {
            "source": "Web App",
            "target": "Web Server",
            "description": "write chunk"
        },
        {
            "source": "Web App",
            "target": "Web Server",
            "description": "decode chunk"
        }
    ],
    "containers": [
        {
            "name": "loop",
            "children": [
                "fetch data",
                "Prepare chunk",
                "write chunk",
                "decode chunk"
            ],
            "description": "Loop until data ends"
        }
    ],
    "description": [
        "The Web App sends a GET request for a resource to the Web Server using HTTP/1.1.",
        "The Web Server responds with headers indicating that the transfer encoding is chunked and the content type is text/plain, followed by an HTTP/1.1 200 OK status.",
        "The Web App then enters a loop, requesting data from the Web Server.",
        "Within the loop, the Web Server fetches the data and prepares a chunk of the response.",
        "The Web App writes the chunk and then decodes it.",
        "This loop continues until all data has been sent and decoded."
    ]
    }}

def describe_diagram_image_test_generic_02( state: AgentState):
    return { "diagram":{
    "type": "process",
    "title": "LLM Application Data Flow",
    "participants": [
        {
            "name": "Event Stream",
            "shape": "cylinder",
            "description": "Source of event data"
        },
        {
            "name": "Preprocessing",
            "shape": "rectangle",
            "description": "Initial processing of events"
        },
        {
            "name": "LLM Application",
            "shape": "rectangle",
            "description": "Main application processing events"
        },
        {
            "name": "Postprocessing",
            "shape": "rectangle",
            "description": "Processing after main application"
        },
        {
            "name": "Output",
            "shape": "cylinder",
            "description": "Final output of the data flow"
        },
        {
            "name": "Observability",
            "shape": "rectangle",
            "description": "Metrics and logs monitoring"
        },
        {
            "name": "LLM Service",
            "shape": "rectangle",
            "description": "External service for LLM (e.g., OpenAI)"
        },
        {
            "name": "LLM Tracing",
            "shape": "rectangle",
            "description": "Tracing service for LLM (e.g., LangSmith)"
        }
    ],
    "relations": [
        {
            "source": "Event Stream",
            "target": "Preprocessing",
            "description": "Feeds into"
        },
        {
            "source": "Preprocessing",
            "target": "LLM Application",
            "description": "Feeds into"
        },
        {
            "source": "LLM Application",
            "target": "Postprocessing",
            "description": "Feeds into"
        },
        {
            "source": "Postprocessing",
            "target": "Output",
            "description": "Feeds into"
        },
        {
            "source": "LLM Application",
            "target": "Observability",
            "description": "Sends data to"
        },
        {
            "source": "LLM Application",
            "target": "LLM Service",
            "description": "Interacts with"
        },
        {
            "source": "LLM Application",
            "target": "LLM Tracing",
            "description": "Interacts with"
        }
    ],
    "containers": [
        {
            "name": "Stream Processor",
            "children": [
                "Preprocessing",
                "LLM Application",
                "Postprocessing"
            ],
            "description": "Processes the event stream"
        }
    ],
    "description": [
        "The Event Stream is the starting point, which feeds into Preprocessing.",
        "Preprocessing is part of the Stream Processor and prepares data for the LLM Application.",
        "The LLM Application processes the data and may interact with external services like LLM Service and LLM Tracing.",
        "After processing, the data is sent to Postprocessing, which is also part of the Stream Processor.",
        "The Postprocessing stage prepares the final Output.",
        "Throughout the process, the LLM Application sends data to Observability for monitoring purposes."
    ]
    }}
