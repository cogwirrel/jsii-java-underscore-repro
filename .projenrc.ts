import path from "path";
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { JsiiProject } from "projen/lib/cdk";
import { JavaProject } from "projen/lib/java";

const monorepo = new NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["@aws-prototyping-sdk/nx-monorepo"],
  name: "jsii-java-underscore-repro",
});

const underscores = new JsiiProject({
  parent: monorepo,
  outdir: "packages/underscores",
  author: "Jack",
  authorAddress: "test@example.com",
  defaultReleaseBranch: "main",
  name: "jsii-java-underscores",
  repositoryUrl: "https://github.com/test/example.git",
  publishToMaven: {
    mavenGroupId: "jack.test",
    mavenArtifactId: "jsii-java-underscores",
    javaPackage: "jack.test.underscores",
  },
});

const nounderscores = new JsiiProject({
  parent: monorepo,
  outdir: "packages/no-underscores",
  author: "Jack",
  authorAddress: "test@example.com",
  defaultReleaseBranch: "main",
  name: "jsii-java-no-underscores",
  repositoryUrl: "https://github.com/test/example.git",
  publishToMaven: {
    mavenGroupId: "jack.test",
    mavenArtifactId: "jsii-java-no-underscores",
    javaPackage: "jack.test.nounderscores",
  },
});

const consumer = new JavaProject({
  parent: monorepo,
  outdir: "packages/consumer",
  artifactId: "consumer",
  groupId: "jack.test",
  name: "consumer",
  version: "1.0.0",
});

consumer.pom.addPlugin("org.apache.maven.plugins/maven-shade-plugin@3.3.0", {
  configuration: {
    createDependencyReducedPom: false,
  },
  executions: [
    {
      id: "shade-task",
      phase: "package",
      goals: ["shade"],
    },
  ],
});

monorepo.addImplicitDependency(consumer, underscores);
consumer.addDependency("jack.test/jsii-java-underscores@0.0.0");
consumer.pom.addRepository({
  id: underscores.name,
  url: `file://\${project.basedir}/${path.join(
    path.relative(consumer.outdir, underscores.outdir),
    "dist/java",
  )}`,
});

monorepo.addImplicitDependency(consumer, nounderscores);
consumer.addDependency("jack.test/jsii-java-no-underscores@0.0.0");
consumer.pom.addRepository({
  id: nounderscores.name,
  url: `file://\${project.basedir}/${path.join(
    path.relative(consumer.outdir, nounderscores.outdir),
    "dist/java",
  )}`,
});

const helloTask = monorepo.addTask("hello-world");
helloTask.exec(
  `java -cp ${path.join(
    path.relative(monorepo.outdir, consumer.outdir),
    "dist/java/jack/test/consumer/1.0.0/consumer-1.0.0.jar",
  )} org.acme.Main`,
);

monorepo.synth();
