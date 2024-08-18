
import dotenv from 'dotenv'
import { SearchClient, SearchIndexClient, SearchIndexerClient, AzureKeyCredential } from "@azure/search-documents";

dotenv.config({ path: '../.env' })

// "https://<resource>.search.windows.net/"
const endpoint = process.env.AZURE_AISEARCH_ADDRESS
const apikey = process.env.AZURE_AISEARCH_API_KEY

  
  // To query and manipulate documents
  const searchClient = new SearchClient(
    endpoint!,
    "langchain-vector-demo",
    new AzureKeyCredential(apikey!)
  );
  
  // To manage indexes and synonymmaps
  const indexClient = new SearchIndexClient(endpoint!, new AzureKeyCredential(apikey!));
  
  // To manage indexers, datasources and skillsets
  const indexerClient = new SearchIndexerClient(endpoint!, new AzureKeyCredential(apikey!));


const client = new SearchIndexClient(endpoint!, new AzureKeyCredential(apikey!));

async function main() {
  const result = await client.createIndex({
    name: "langchain-search-index",
    fields: [
      {
        type: "Edm.String",
        name: "id",
        key: true,
      },
      {
        type: "Edm.Double",
        name: "content"
      },
      {
        type: "Edm.String",
        name: "metadata"
      },
      {
        type: "Edm.ComplexType",
        name: "content_vector",
        fields: [
          {
            type: "Collection(Edm.Single)",
            name: "vectors",
            searchable: true,
          },
        ],
      },
    ],
  });

  console.log(result);
}

main();
