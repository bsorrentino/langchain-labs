import { Page } from "playwright";

export const getSnippets = async ( page: Page, type: string, clazz: string ) => {

    const result = Array<{ title:string|null, content: string }>()

    const selectSnippets = async () => {
        const data = page.getByText(type.toUpperCase());
        const locators = await data.all()
        for( const locator of locators ) {
            await locator.click( { delay: 500 })
        } 
        return locators.length
    }
    const snippetCount = await selectSnippets()
    if( snippetCount > 0 ) {
        let repeat = 0 
        while( repeat < 2 ) {
            const pres = await page.$$(`code.${clazz}`)
            if( snippetCount != pres.length ) {
                ++repeat
            }
            else {
                const snippetTitle = await page.$$( 'span.component-preview-title' )
                let index = 0
                for( const pre of pres ) {
                    const content = await pre.textContent()
                    const title = await snippetTitle[index++].textContent()
                    // console.debug( title, content  )
                    if( content ) 
                        result.push( { title, content } )

                }
                break;         
            }
        } 
    }

    return result
}

export interface Prop {

    className: string,
    type: string
    desc: string|null

}

export const getComponentProps = async (page: Page) => {
    const result = Array<Prop>()

    const table = await page.$('table');
    if (table) {
        const rows = await table.$$('tr');
        for( const row of rows ) {
            const cells = await row.$$('td, th');
            
            
            if( cells.length < 3 ) continue

            const className = await cells[0].textContent()
        if( !className || className.match( /\s*class name\s*/i) ) continue
            const type = await cells[1].textContent()
            if( !type ) continue
            const desc = await cells[2].textContent()

            result.push( {
                className,
                type,
                desc
            } )
        }
    }

    return result;
}

export const getMetadata = async (page: Page) => {
    const titleElement = await page.$('h1');

    if( !titleElement ) {
        return { }
    }
     
    const desc = await titleElement.evaluate(el => {
        return `${el.nextElementSibling?.innerHTML}` 
    });

    const title = await titleElement.textContent();


    return { title, desc };
}
