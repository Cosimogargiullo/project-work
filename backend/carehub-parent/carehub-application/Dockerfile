FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /workspace

# Copy only backend application sources into the build context
COPY . /workspace

# Build only the application module using the parent POM
# -pl carehub-application: build the module
# -am: also build required dependencies
RUN mvn -f pom.xml -pl carehub-application -am -DskipTests package

FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

# Copy the packaged jar from the builder stage
COPY --from=builder /workspace/carehub-application/target/*.jar app.jar

ENTRYPOINT ["java","-jar","/app/app.jar"]
