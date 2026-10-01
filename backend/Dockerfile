# 빌드 스테이지: 2GB 서버에서도 돌도록 Gradle 힙을 제한한다
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
COPY src src
ENV GRADLE_OPTS="-Xmx768m"
RUN ./gradlew --no-daemon bootJar -x test

# 실행 스테이지
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
ENV JAVA_OPTS="-Xmx512m -XX:+UseSerialGC"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
