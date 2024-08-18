

import { chromium, webkit } from 'playwright'
import { getComponentProps, getMetadata, getSnippets } from './elements';
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const browser = await webkit.launch( { headless: true });

const gotoPage = async ( url: string ) => {
    const page = await browser.newPage();

    await page.goto( url );
    
    return page
}

const home = await gotoPage( "https://daisyui.com/components/" )

interface Component {
    name: string,
    desc: string,
    link: string
}

const components = Array<Component>()

for( const a of await home.$$( 'a.card' ) ) {
    const desc = await (await a.$('p'))?.textContent()
    const name = (await (await a.$('h2'))?.textContent())?.toLowerCase()
    const link = await a.getAttribute('href')
    if( name && desc && link ) {
        components.push( { name, desc, link })
    }
}

await home.close()

try {
    await fs.mkdir( 'daisyui_components' )
}
catch( e ) {
    console.warn( e.message )
}

for( const c of components ) {
    let output = ""

    const componentFolder = path.join( 'daisyui_components', c.name )
    try {
        await fs.mkdir( componentFolder )
    }
    catch( e ) {
        console.warn( e.message )
    }

    const page = await gotoPage( path.join( 'https://daisyui.com/', c.link ) )

    const { title = c.name, desc = "" } = await getMetadata( page )

    
    output += `# ${title}\n\n`
    output += `> ${desc}\n\n`

    const props = await getComponentProps(page) 
    console.table( props )

    output += '`prefix-` class name | type | description\n'
    output += '----- | ----- | -----\n'

    for( let prop of props ) {
        output += `${prop.className} | ${prop.type} | ${prop.desc}\n`
    }
    output += '\n\n\n'

    const mdSnippet = "```"

    for( let { title, content } of await getSnippets( page, 'html', 'language-html') ) {

        output += 
`
### ${title}

**HTML sample**
${mdSnippet}html
${content}
${mdSnippet}

`
    }

//     for( let { title, content }  of await getSnippets( page, 'jsx', 'language-svelte' ) ) {

//         output += 
// ` 
// # ${title}

// **JSX sample**
// ${mdSnippet}jsx
// ${content}
// ${mdSnippet}

// `
//     }

    // console.debug( output )
    
    await fs.writeFile( path.join( componentFolder,  `${c.name}.md` ), output )

    await page.close()
}


await browser.close();

process.exit(0)