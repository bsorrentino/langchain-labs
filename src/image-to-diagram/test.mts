import path from "path";
import { describeDiagramImage, imageFileToUrl } from "./agent_describer.mts";
import { translateGenericDiagramDescriptionToPlantUML } from "./agent_generic_plantuml.mts";
import { ChatOpenAI } from "@langchain/openai";
import { translateSequenceDiagramDescriptionToPlantUML } from "./agent_sequence_plantuml.mts";
import { imageToDiagram } from "./main.mts";
import { AgentState } from "./agent_state";
import * as hub from "langchain/hub";

const processDiagram = {
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
      "description": "Monitoring of metrics and logs"
    },
    {
      "name": "LLM Service",
      "shape": "rectangle",
      "description": "Supporting service for LLM Application"
    },
    {
      "name": "LLM Tracing",
      "shape": "rectangle",
      "description": "Tracing service for LLM Application"
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
      "description": "Processes the event stream data"
    }
  ],
  "description": [
    "Event Stream provides data to Preprocessing.",
    "Preprocessing sends processed data to LLM Application.",
    "LLM Application sends data to Postprocessing.",
    "Postprocessing sends final data to Output.",
    "LLM Application sends monitoring data to Observability.",
    "LLM Application interacts with LLM Service and LLM Tracing."
  ]
}

const flowchartDiagram =  {
  type: "flowchart",
  title: "Product Development Process",
  participants: [
    {
      name: "Brainstorming",
      shape: "rectangle",
      description: "Initial phase where ideas are generated",
    }, {
      name: "Trends",
      shape: "rectangle",
      description: "Identification of current market trends",
    }, {
      name: "New Product",
      shape: "rectangle",
      description: "Conceptualization of a new product",
    }, {
      name: "Research",
      shape: "rectangle",
      description: "Research phase to gather information",
    }, {
      name: "Prototyping",
      shape: "diamond",
      description: "Decision point for prototyping success",
    }, {
      name: "Quick Design",
      shape: "rectangle",
      description: "Rapid design iteration",
    }, {
      name: "Refinement",
      shape: "rectangle",
      description: "Refinement of the design",
    }, {
      name: "Review",
      shape: "rectangle",
      description: "Review phase if prototyping is not successful",
    }, {
      name: "Design",
      shape: "rectangle",
      description: "Detailed design phase",
    }, {
      name: "Implementation",
      shape: "rectangle",
      description: "Implementation of the design",
    }, {
      name: "Testing",
      shape: "rectangle",
      description: "Testing phase for the implemented design",
    }
  ],
  relations: [
    {
      source: "Brainstorming",
      target: "Trends",
      description: "Follows",
    }, {
      source: "Trends",
      target: "New Product",
      description: "Follows",
    }, {
      source: "New Product",
      target: "Research",
      description: "Follows",
    }, {
      source: "Research",
      target: "Prototyping",
      description: "Leads to",
    }, {
      source: "Prototyping",
      target: "Quick Design",
      description: "If NO",
    }, {
      source: "Quick Design",
      target: "Refinement",
      description: "Follows",
    }, {
      source: "Refinement",
      target: "Review",
      description: "Follows",
    }, {
      source: "Review",
      target: "Prototyping",
      description: "Leads back to",
    }, {
      source: "Prototyping",
      target: "Design",
      description: "If YES",
    }, {
      source: "Design",
      target: "Implementation",
      description: "Follows",
    }, {
      source: "Implementation",
      target: "Testing",
      description: "Follows",
    }
  ],
  containers: [],
  description: [
    "The process begins with 'Brainstorming', where ideas are generated.", "From 'Brainstorming', the process moves to 'Trends' to identify market trends.",
    "After identifying trends, the 'New Product' phase conceptualizes the product.",
    "Following the new product idea, 'Research' is conducted for more information.",
    "The 'Research' phase leads to 'Prototyping', a decision point to assess if the prototype is successful.",
    "If 'Prototyping' is not successful (NO), the process moves to 'Quick Design' for rapid iteration.",
    "After 'Quick Design', the process goes through 'Refinement'.", "Post 'Refinement', the 'Review' phase evaluates the changes.",
    "If changes are adequate, it loops back to 'Prototyping'.", "If 'Prototyping' is successful (YES), the process continues to 'Design' for detailed planning.",
    "From 'Design', the process moves to 'Implementation' where the design is executed.",
    "Finally, 'Implementation' is followed by 'Testing' to ensure the product meets the required standards."
  ],
}

const sequenceDiagram = {
    type: "sequence",
    title: "Chunked Transfer Encoding over HTTP",
    participants: [
      {
        name: "Web App",
        shape: "rectangle",
        description: "Initiates the request and processes the response",
      }, {
        name: "Web Server",
        shape: "rectangle",
        description: "Handles the request and sends back the response",
      }
    ],
    relations: [
      {
        source: "Web App",
        target: "Web Server",
        description: "GET /resource HTTP/1.1",
      }, {
        source: "Web Server",
        target: "Web App",
        description: "Transfer-Encoding: chunked Content-Type: text/plain HTTP/1.1 200 OK",
      },
      {
        source: "Web App",
        target: "Web Server",
        description: "request data",
      }, {
        source: "Web Server",
        target: "Web App",
        description: "fetch data",
      }, {
        source: "Web Server",
        target: "Web App",
        description: "Prepare chunk",
      }, {
        source: "Web App",
        target: "Web Server",
        description: "write chunk",
      }, {
        source: "Web App",
        target: "Web Server",
        description: "decode chunk",
      }
    ],
    containers: [
      {
        name: "loop",
        children: [ "fetch data", "Prepare chunk", "write chunk", "decode chunk" ],
        description: "Loop until data ends",
      }
    ],
    description: [ "The Web App sends a GET request to the Web Server.", "The Web Server responds with chunked transfer encoding headers and a 200 OK status.",
      "The Web App requests data from the Web Server.", "The Web Server fetches data to be sent to the Web App.",
      "The Web Server prepares a chunk of data.", "The Web App writes the chunk of data.",
      "The Web App decodes the chunk of data.", "This process loops until all data is sent."
    ],
  }


async function testDescribeDiagram( imageFileName: string ) {

    const result =await describeDiagramImage( { 
        diagramImageUrlOrData: await imageFileToUrl( path.join( 'assets', imageFileName) ) 
    });

    console.dir( result, { depth: 3 } )
}

const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    maxTokens:2000,
    temperature:0,
    maxRetries:1,
  });

  
async function testTranslateGenericDiagramDescriptionToPlantUML() {

    const result = await translateGenericDiagramDescriptionToPlantUML( llm, { 
        // diagramImageUrlOrData: await imageFileToUrl( path.join( 'assets', 'diagram1.png') ) 
        diagram: processDiagram
    });

    console.debug( result )
}
async function testTranslateSequenceDiagramDescriptionToPlantUML() {

    const result = await translateSequenceDiagramDescriptionToPlantUML( llm, { 
        // diagramImageUrlOrData: await imageFileToUrl( path.join( 'assets', 'diagram1.png') ) 
        diagram: sequenceDiagram
    });

    console.debug( result )
}
async function testTranslateGenericDiagramDescriptionToPlantUML2() {

  const result = await translateGenericDiagramDescriptionToPlantUML( llm, { 
      // diagramImageUrlOrData: await imageFileToUrl( path.join( 'assets', 'diagram1.png') ) 
      diagram: flowchartDiagram
  });

  console.debug( result.diagramCode )
}

async function testImageToDiagram( image:string ) {

  const result = await imageToDiagram( image );

  console.debug( `RESULT:\n`,result.diagram, result.diagramCode )
}

async function testImageToDiagramAsStream( image:string ) {

  const result = await imageToDiagram( image );
  let lastItem: { [k: string]: AgentState }|null = null

  for await (const item of result) {
    console.debug( item )
  }
}

// await testDescribeDiagram( 'diagram1.png' )
// await testDescribeDiagram( 'http-streaming.png' )
// await testTranslateGenericDiagramDescriptionToPlantUML()
// await testTranslateSequenceDiagramDescriptionToPlantUML
// await testImageToDiagram( 'https://blog.langchain.dev/content/images/2024/01/supervisor-diagram.png') 

//await testImageToDiagram( '/private/tmp/plantuml+gpt/flowchart_promo-showcase.jpg' )

const prompt = await hub.pull<any>("bsorrentino/convert_generic_diagram_to_plantuml");
console.debug( prompt.template )

await testTranslateGenericDiagramDescriptionToPlantUML2()