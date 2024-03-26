package org.example;


import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.bsc.ai.AIConfig;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.file.Paths;
import java.util.Optional;

import static java.lang.String.format;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit test for simple App.
 */
public class CopilotCLITest
{
    final AIConfig config = AIConfig.of(Paths.get("..", ".env"));

    interface Assistant {

        String chat(String message);
    }

    static class SystemCommandTool {

        private String command ;

        Optional<String> lastCommand() {
            return Optional.ofNullable(command);
        }

        @Tool("all system commands")
        String exec(@P("command") String command) {
            this.command = command;

            return format( "command executed: %s", command);
        }
    }

    @BeforeAll
    public static void setup() {

    }

    /**
     * Rigourous Test :-)
     */
    @Test
    public void executeSystemCommands()
    {

        var chatLanguageModel = OpenAiChatModel.builder()
                .apiKey(config.OPENAI_API_KEY())
                .modelName("gpt-3.5-turbo-0613")
                .temperature(0.0)
                .build()
                ;

        var chatMemory = MessageWindowChatMemory.withMaxMessages(10);

        var systemCommandTool = new SystemCommandTool();

        var service = AiServices.builder(Assistant.class)
                .chatLanguageModel(chatLanguageModel)
                .tools( systemCommandTool )
                .chatMemory( chatMemory )
                .build()
                ;

        String answer;

        answer = service.chat( "change to home directory" );

        assertEquals("You have successfully changed to the home directory.", answer);
        assertTrue(  systemCommandTool.lastCommand().isPresent()  );
        assertEquals( "cd ~", systemCommandTool.lastCommand().get() );


        answer = service.chat( "find all pdf files" );

        // assertEquals("You have successfully changed to the home directory.", answer);
        assertTrue(  systemCommandTool.lastCommand().isPresent()  );
        assertEquals( "find . -name '*.pdf'", systemCommandTool.lastCommand().get() );



    }
}