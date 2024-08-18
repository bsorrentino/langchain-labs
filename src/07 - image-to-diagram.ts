
import dotenv from 'dotenv'

const result = dotenv.config({ path: '../.env' })

import  OpenAI from "openai";
import { pull } from "langchain/hub";
import { PromptTemplate } from "@langchain/core/prompts";
const openai = new OpenAI();

// const image_url = "https://res.cloudinary.com/practicaldev/image/fetch/s--B-s5n03y--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_800/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bm8v47dhrqxagsd615q1.png"
// const image_url =  "https://res.cloudinary.com/practicaldev/image/fetch/s--XN5WM5-1--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_800/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/x21bjaiyzhbtz2p1t0t4.png"

const prompt = await pull<PromptTemplate>('bsorrentino/image_to_plantuml')

async function converImageToDiagram( image_url_or_data:string ) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 2000,
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: await prompt.format({}) },
          {
            type: "image_url",
            image_url: {
              "url": image_url_or_data,
            },
          },
        ],
      },
    ],
  });
  const content = response.choices[0].message.content;


  return content
}


// import {createInterface} from 'node:readline/promises'
// import { stdin as input, stdout as output } from 'node:process'
// const rl = createInterface( {input, output} )
// const filePath = await rl.question( 'image file')

import * as fs from 'node:fs/promises'
import path from 'node:path'

const filePath = "/Users/bsorrentino/WORKSPACES/GITHUB.me/bsorrentino/bsorrentino#gh-pages/_draft/Datastax-langchain-architecture-design-guide/img_p3_1.png"
const fileData = await fs.readFile( path.join( filePath) )
// Convert the buffer to a base64 string

const base64Image = Buffer.from(fileData).toString('base64')

const imageData = `data:image/png;base64,${base64Image}`

const plantUml = await converImageToDiagram( imageData )

console.log( plantUml )
