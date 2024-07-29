[![Java CI with Gradle](https://github.com/Adron/collectorstunetracker/actions/workflows/gradle.yml/badge.svg)](https://github.com/Adron/collectorstunetracker/actions/workflows/gradle.yml)

![GitHub Ident](https://github.com/Adron/collectorstunetracker/blob/collectors_tracker_docs/graphics/logo/github-banner/5.png)

# Collectors' Tune Tracker (CTT)

* [GitHub *Pages* Site](https://adron.github.io/collectorstunetracker/)
* [GitHub Pages Site Repository](https://github.com/Adron/collectorstunetracker/tree/collectors_tracker_docs)
* [GitHub Repository](https://github.com/Adron/collectorstunetracker)
* [Collectors' Tune Tracker Database](https://github.com/Adron/collectorstunetracker_db)

For more details on this site, check out the [GitHub *Pages* Site](https://adron.github.io/collectorstunetracker/).

## Build

Build the project.

``` shell
./gradlew build
```

Clean it up and then build.

``` shell
./gradlew clean build
```

Build the Docker image of the application.

``` shell
docker build -t your-dockerhub-username/collectorstunetracker .
```

Verify

``` shell
curl -X POST -H "Content-Type: text/plain" -d "Confirm." http://localhost:8080/confirm
curl -X POST -H "Content-Type: text/plain" -d "Invalid Message" http://localhost:8080/confirm
```

## Deploy to AWS

```

```
