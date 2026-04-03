package it.carehub.user.domain.model;

import it.carehub.common.user.model.Specialization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(name = "fiscal_code", length = 16, unique = true)
    private String fiscalCode;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "specialization", columnDefinition = "carehub.specialization_type")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Specialization specialization;

    @Column
    private Boolean active;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", columnDefinition = "carehub.user_role")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Set<Role> roles;
}
