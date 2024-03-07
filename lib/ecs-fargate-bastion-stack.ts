import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VpcEndpointParams, EcsFargateParams } from "./parameter";
import { VpcEndpointConstruct } from "./construct/vpc-endpoint-construct";
import { EcsFargateConstruct } from "./construct/ecs-fargate-construct";

export interface EcsFargateBastionStackProps extends cdk.StackProps {
  vpcId: string;
  vpcEndpointParams?: VpcEndpointParams;
  ecsFargateParams: EcsFargateParams;
}

export class EcsFargateBastionStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: EcsFargateBastionStackProps
  ) {
    super(scope, id, props);

    // VPC Endpoints
    const vpcEndpointConstruct = props.vpcEndpointParams
      ? new VpcEndpointConstruct(this, "VpcEndpoint", {
          vpcId: props.vpcId,
          vpcEndpointParams: props.vpcEndpointParams,
        })
      : undefined;

    // ECS Fargate
    const ecsFargateConstruct = new EcsFargateConstruct(this, "EcsFargate", {
      vpcId: props.vpcId,
      ecsFargateParams: props.ecsFargateParams,
    });

    if (vpcEndpointConstruct) {
      ecsFargateConstruct.node.addDependency(vpcEndpointConstruct);
    }
  }
}
