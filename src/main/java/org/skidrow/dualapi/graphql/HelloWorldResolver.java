package org.skidrow.dualapi.graphql;

import graphql.kickstart.tools.GraphQLQueryResolver;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;

@Controller
@Component
public class HelloWorldResolver implements GraphQLQueryResolver {
    @QueryMapping
    public String helloGraphql() {
        return "Hello, GraphQL World!";
    }
}