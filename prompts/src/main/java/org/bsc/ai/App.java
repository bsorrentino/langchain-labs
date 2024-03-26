package org.bsc.ai;

import dev.langchain4j.model.openai.OpenAiChatModel;


/**
 * Hello world!
 *
 */
public class App 
{

    public static void main( String[] args ) throws Exception
    {
        var config = AIConfig.of();

        // Create an instance of a model
        var model = OpenAiChatModel.builder()
                .apiKey( config.OPENAI_API_KEY() )
                .modelName( "gpt-3.5-turbo" )
                .logResponses(true)
                .maxRetries(5)
                .temperature(0.0)
                .maxTokens(2000)
                .build()
                    ;


        // Start interacting
        var answer = model.generate("Hello world!");

        System.out.println(answer); // Hello! How can I assist you today?
    }
}
