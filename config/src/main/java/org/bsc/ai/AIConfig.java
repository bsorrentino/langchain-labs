package org.bsc.ai;

import java.util.Optional;
import static dev.langchain4j.model.openai.OpenAiModelName.GPT_3_5_TURBO;
public class AIConfig {

    public static AIConfig of(String[] args) {
        return new AIConfig(args);
    }

    final String[] args;

    private AIConfig(String[] args) {
        this.args = args;
    }

    public Optional<String> valueOf(String key ) {
        for (int i = 0; i < args.length; i++) {
            if (args[i].equalsIgnoreCase(key)) {
                if (i < args.length - 1) {
                    return Optional.of(args[i + 1]);
                }
                break;
            }
        }
        return Optional.ofNullable(System.getenv( key ));
    }

    public final String  getModel() {
        return valueOf("model_name").orElse(GPT_3_5_TURBO);
    }

    public final String  getApiKey() {
        return valueOf("api_key").orElseThrow( () -> new RuntimeException("no 'api_key' provided!"));
    }
}
