package it.carehub.application.controller;

import it.carehub.common.utils.SimpleResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PingController {

    @GetMapping("/ping")
    public ResponseEntity<SimpleResult> ping() {
        return ResponseEntity.ok(new SimpleResult().success("pong"));
    }
}
