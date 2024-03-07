#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EcsFargateBastionStack } from "../lib/ecs-fargate-bastion-stack";
import { ecsFargateBastionStackParams } from "../lib/parameter";

const app = new cdk.App();
new EcsFargateBastionStack(app, "EcsFargateBastionStack", {
  env: {
    account:
      ecsFargateBastionStackParams.env?.account ||
      process.env.CDK_DEFAULT_ACCOUNT,
    region:
      ecsFargateBastionStackParams.env?.region ||
      process.env.CDK_DEFAULT_REGION,
  },
  ...ecsFargateBastionStackParams.property,
});
