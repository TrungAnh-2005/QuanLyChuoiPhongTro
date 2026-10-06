FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder

WORKDIR /build

COPY pom.xml ./pom.xml
COPY services/maintenance-service/pom.xml ./services/maintenance-service/pom.xml
COPY services/maintenance-service/src ./services/maintenance-service/src

RUN mvn -f ./services/maintenance-service/pom.xml clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder --chown=spring:spring /build/services/maintenance-service/target/*.jar app.jar

EXPOSE 8088

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
