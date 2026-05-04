# JWT authentication and ownership context

## Obiettivo
Mostrare la catena di autenticazione JWT stateless e il passaggio dell'identita utente nel contesto Spring Security per i controlli di ownership.

## Perche e interessante
Questo snippet collega sicurezza e autorizzazione a livello di dominio: il backend non si limita a riconoscere l'utente, ma rende disponibile il suo id per controlli piu fini nei controller e nei service.

## File sorgente
- backend/carehub-parent/carehub-users/src/main/java/it/carehub/auth/application/security/SecurityConfig.java
- backend/carehub-parent/carehub-users/src/main/java/it/carehub/auth/application/security/JwtAuthenticationFilter.java

## Estratto reale
```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Servizio token e repository utenti sono i due punti necessari per autenticare
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        // Senza header Bearer non c'e autenticazione da costruire
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Recupera il soggetto dal JWT per identificare l'utente lato backend
        final String token = authHeader.substring(7);
        final String username = jwtService.extractClaim(token, claims -> claims.getSubject());

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // L'utente deve esistere ancora anche se il token e formalmente valido
            var userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent() && jwtService.isTokenValid(token, username)) {
                var user = userOpt.get();
                // Traduce i ruoli del dominio in authorities Spring Security
                var authorities = user.getRoles().stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                        .collect(Collectors.toSet());
                // Crea il token di autenticazione nel SecurityContext
                var authToken = new UsernamePasswordAuthenticationToken(username, null, authorities);
                // Salva l'id utente per i controlli di ownership sui record
                authToken.setDetails(user.getId());
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // La catena prosegue sempre, autenticato o no
        filterChain.doFilter(request, response);
    }
}
```

## Commento tecnico
- il filtro legge il bearer token e recupera l'utente autenticato
- i ruoli diventano authorities Spring Security
- l'id utente viene salvato nei details per i controlli di ownership
- la configurazione resta stateless e compatibile con il resto dell'architettura JWT