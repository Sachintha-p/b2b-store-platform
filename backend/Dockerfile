# ============================================
# Stage 1: Build the Spring Boot application
# ============================================
FROM maven:3.9.6-eclipse-temurin-17-focal AS build
WORKDIR /app

# Cache Maven dependencies first for faster rebuilds
COPY pom.xml .
COPY .mvn .mvn
RUN mvn dependency:go-offline -B

# Copy source and build the fat JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ============================================
# Stage 2: Lightweight runtime image
# ============================================
FROM eclipse-temurin:17-jre-focal
WORKDIR /app

# Create a non-root user for security
RUN groupadd -r appuser && useradd --no-log-init -r -g appuser appuser

COPY --from=build /app/target/*.jar app.jar

# Switch to non-root user
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
