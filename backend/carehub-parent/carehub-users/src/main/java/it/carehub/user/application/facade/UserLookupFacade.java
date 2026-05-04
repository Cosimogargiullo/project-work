package it.carehub.user.application.facade;

import it.carehub.common.user.port.UserLookupPort;
import it.carehub.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserLookupFacade implements UserLookupPort {
    private final UserRepository userRepository;

    @Override
    public boolean isActive(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId).map(u -> Boolean.TRUE.equals(u.getActive())).orElse(false);
    }
}
