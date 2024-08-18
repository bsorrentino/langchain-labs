
import dotenv from 'dotenv'

const result = dotenv.config({ path: '../.env' })

import OpenAI from "openai";
import fs from 'node:fs/promises'
import path from 'node:path'

const openai = new OpenAI();

const data = await fs.readFile( path.join( '..', 'docs', 'volantino_ete_1.png') )
// Convert the buffer to a base64 string

const base64Image = Buffer.from(data).toString('base64')

const image_data = `data:image/png;base64,${base64Image}`
// console.log( image_data )

const prompt = `
Extract all products images boundaries (width,height) from the image provided
`
async function main() {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 2000,
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              "url": image_data,
            },
          },
        ],
      },
    ],
  });
  const content = response.choices[0].message.content;


  console.log( content )
}

main();
