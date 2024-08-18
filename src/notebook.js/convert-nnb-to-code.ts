import 'zx/globals'

interface CELL {
    language: "typescript"|"javascript"|"markdown",
    "source": string[],
    "outputs": string[]
}

interface NNB {
    cells: CELL[]
}

const { file } = argv 
if( !file ) {
    console.warn( chalk.yellow('argument file nont provided!') )
    process.exit(-1)
}

if( !await fs.exists(file) ) {
    console.warn( chalk.yellow(`given ${file} does not exist!`) )
    process.exit(-1)
}

const content = await fs.readJSON( file ) as NNB

const outFile = path.basename(file).replace( path.extname(file), '.ts' )

let outContent = ''

for( const cell of content.cells ) {

    if( cell.language === 'markdown' ) {
        outContent += `/*\n${cell.source.join('\n')}\n*/`
        continue
    }
    if( cell.language === 'javascript' || cell.language === 'typescript' ) {
        outContent += `\n${cell.source.join('\n')}\n`
        continue
    }
    
}   

await fs.writeFile( outFile, outContent)

