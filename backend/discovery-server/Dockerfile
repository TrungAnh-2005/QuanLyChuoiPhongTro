# Stage 1: Build JAR bằng Maven và Eclipse Temurin JDK 21
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache dependencies bằng cách copy POM files trước
COPY pom.xml ./pom.xml
COPY discovery-server/pom.xml ./discovery-server/pom.xml
COPY discovery-server/src ./discovery-server/src

# Build production JAR
RUN mvn -f ./discovery-server/pom.xml clean package -DskipTests -B

# Stage 2: Runtime image tối ưu với Eclipse Temurin JRE 21 Alpine
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Tạo non-root user đảm bảo an toàn bảo mật container
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder --chown=spring:spring /build/discovery-server/target/*.jar app.jar

EXPOSE 8761

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
