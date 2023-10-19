package org.bsc.ai;

import dev.langchain4j.model.openai.OpenAiChatModel;

import java.util.Arrays;
import java.util.Optional;

import static dev.langchain4j.model.openai.OpenAiModelName.GPT_3_5_TURBO;

/**
 * Hello world!
 *
 */
public class App 
{

    static class ParseArg {
        public static ParseArg of(String[] args) {
            return new ParseArg(args);
        }

        final String[] args;

        private ParseArg(String[] args) {
            this.args = args;
        }

        public Optional<String> valueOf(String key ) {
            for (int i = 0; i < args.length; i++) {
                if (args[i].equalsIgnoreCase(key)) {
                    if (i < args.length - 1) {
                        return Optional.of(args[i + 1]);
                    } else {
                        break;
                    }
                }
            }
            return Optional.empty();
        }
    }

    public static void main( String[] args ) throws Exception
    {
        var config = AIConfig.of(args);

        // Create an instance of a model
        var model = OpenAiChatModel.builder()
                .apiKey( config.getApiKey() )
                .modelName( config.getModel() )
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
