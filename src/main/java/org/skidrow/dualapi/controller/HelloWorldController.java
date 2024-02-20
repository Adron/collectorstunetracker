package org.skidrow.dualapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloWorldController {

    @GetMapping("/rest/hello")
    public String helloRest() {
        return "Hello, REST World!";
    }
}