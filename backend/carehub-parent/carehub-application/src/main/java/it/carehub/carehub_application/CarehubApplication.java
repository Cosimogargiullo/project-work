package it.carehub.carehub_application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@ComponentScan(basePackages = "it.carehub")
@EntityScan(basePackages = "it.carehub")
@EnableJpaRepositories(basePackages = "it.carehub")
@SpringBootApplication
@EnableMethodSecurity
public class CarehubApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarehubApplication.class, args);
    }

}
