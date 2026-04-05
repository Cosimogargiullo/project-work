package it.carehub.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Keep-alive scheduler per evitare lo spin-down delle istanze Render.
 * Se il database non riceve query per più di 10 minuti, potrebbe venire
 * sospeso. Questo task esegue un ping ogni 10 minuti per mantenere attive
 * sia l'istanza che la connessione al database.
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class KeepAliveScheduler {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Esegue un semplice query every 10 minutes per mantenere attive le connessioni.
     * Scheduled in UTC, quindi ogni 10 minuti: 0, 10, 20, ... 50
     */
    @Scheduled(cron = "0 */10 * * * *")
    public void keepDatabaseAlive() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            log.debug("Keep-alive ping executed successfully: {}", result);
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
