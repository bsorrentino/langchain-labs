package org.bsc.ai;

import java.io.FileReader;
import java.io.Reader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

public class AIConfig {

    public static AIConfig of( Path configFilePath )  {
        try {
            return new AIConfig( configFilePath );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    public static AIConfig of()  {
        try {
            return new AIConfig(Paths.get(".env") );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private AIConfig( Path configFilePath ) throws Exception {
        final java.util.Properties properties = new java.util.Properties();

        try( Reader r = new FileReader(configFilePath.toFile())) {
            properties.load(r);
        }
        System.getProperties().putAll(properties);
    }

    public Optional<String> valueOf(String key ) {
        return Optional.ofNullable(System.getenv( key ))
                .or( () -> Optional.ofNullable(System.getProperty(key)));
    }

    public final String  OPENAI_API_KEY() {
        return valueOf("OPENAI_API_KEY").orElseThrow( () -> new RuntimeException("no 'OPENAI_API_KEY' provided!"));
    }
}
