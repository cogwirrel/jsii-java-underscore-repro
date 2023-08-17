import path from "path";
import {
  NodePackageUtils,
  NxMonorepoProject,
} from "@aws-prototyping-sdk/nx-monorepo";
import { JsiiProject } from "projen/lib/cdk";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";

const monorepo = new NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: ["@aws-prototyping-sdk/nx-monorepo"],
  name: "jsii-java-underscore-repro",
});

const paths = {
  "my-namespace-with-underscores": ["./src/my_namespace_with_underscores"],
};

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
  tsconfigDev: {
    compilerOptions: {
      baseUrl: '.',
      paths,
    },
  },
});

underscores.package.addField("exports", {
  ".": "./lib/index.js",
  "./package.json": "./package.json",
  "./.jsii": "./.jsii",
  "./my-namespace-with-underscores":
    "./lib/my_namespace_with_underscores/index.js",
});

underscores.manifest.jsii.tsc.baseUrl = '.';
underscores.manifest.jsii.tsc.paths = paths;

underscores.compileTask.exec(
  NodePackageUtils.command.downloadExec(
    NodePackageManager.YARN,
    "tsc-alias",
    "-p",
    "tsconfig.dev.json",
    "--dir",
    "lib",
  ),
);

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
