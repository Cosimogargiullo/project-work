package it.carehub.common.user.port;

public interface UserLookupPort {
    /** Returns true if the user exists and is active */
    boolean isActive(Long userId);
}
