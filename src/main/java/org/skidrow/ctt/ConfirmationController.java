package org.skidrow.ctt;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfirmationController {

    @PostMapping("/confirm")
    public String confirmMessage(@RequestBody String message) {
        if ("Confirm.".equals(message)) {
            return "Message confirmed.";
        } else {
            return "Invalid message.";
        }
    }
}
