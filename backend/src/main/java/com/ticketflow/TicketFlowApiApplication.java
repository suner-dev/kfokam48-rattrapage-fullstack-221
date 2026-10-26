package com.ticketflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.ticketflow")
public class TicketFlowApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketFlowApiApplication.class, args);
    }

}
