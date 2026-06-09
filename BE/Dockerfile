# Stage 1: Build the application
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle/ ./gradle/
COPY gradlew ./
# Resolve dependencies
RUN ./gradlew dependencies --no-daemon

COPY src/ ./src/
# Build the application
RUN ./gradlew build -x test --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
