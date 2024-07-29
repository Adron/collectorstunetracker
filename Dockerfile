# Use an official OpenJDK runtime as a parent image
FROM openjdk:21-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the built jar file from the host to the working directory inside the container
COPY build/libs/ctt-0.0.1-SNAPSHOT-plain.jar app.jar/

# Expose port 8080 to the outside world
EXPOSE 8080

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]

