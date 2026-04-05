package it.carehub.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Keep-alive scheduler per evitare lo spin-down delle istanze Render.
 * Questo task esegue un ping frequente per mantenere attive
 * sia l'istanza che la connessione al database.
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class KeepAliveScheduler {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Esegue un semplice query ogni minuto per mantenere attive le connessioni.
     */
    @Scheduled(cron = "0 * * * * *")
    public void keepDatabaseAlive() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            log.info("Keep-alive ping executed successfully: {}", result);
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
