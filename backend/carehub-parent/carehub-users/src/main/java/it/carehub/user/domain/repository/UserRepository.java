package it.carehub.user.domain.repository;

import it.carehub.common.user.model.Specialization;
import it.carehub.user.domain.model.Role;
import it.carehub.user.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByFiscalCode(String fiscalCode);

    @Query("SELECT u FROM User u WHERE u.username =:username OR u.fiscalCode = :fiscalCode")
    Optional<User> findByUsernameOrFiscalCode(@Param("username") String username, @Param("fiscalCode") String fiscalCode);

        @Query("SELECT DISTINCT u FROM User u JOIN u.roles r " +
            "WHERE r = :role AND (" +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
                "(u.active = true OR u.active IS NULL)")
        List<User> searchDoctors(@Param("search") String search,
                     @Param("role") Role role);

        @Query("SELECT DISTINCT u FROM User u JOIN u.roles r " +
            "WHERE r = :role AND u.specialization = :specialization AND (" +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(u.active = true OR u.active IS NULL)")
        List<User> searchDoctorsBySpecialization(@Param("search") String search,
                             @Param("role") Role role,
                             @Param("specialization") Specialization specialization);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r = :role AND " +
            "(u.active = true OR u.active IS NULL)")
    List<User> findAllByRole(Role role);

    List<User> findByActive(Boolean active);
}
