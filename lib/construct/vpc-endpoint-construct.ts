import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VpcEndpointParams } from "../parameter";

export interface VpcEndpointConstructProps {
  vpcId: string;
  vpcEndpointParams: VpcEndpointParams;
}

export class VpcEndpointConstruct extends Construct {
  public readonly ecrRepository: cdk.aws_ecr.IRepository;

  constructor(scope: Construct, id: string, props: VpcEndpointConstructProps) {
    super(scope, id);

    // VPC
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, "Vpc", {
      vpcId: props.vpcId,
    });

    if (props.vpcEndpointParams.shouldCreateEcrVpcEndpoint) {
      // ECR
      vpc.addInterfaceEndpoint("EcrEndpoint", {
        service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECR,
        subnets: vpc.selectSubnets(
          props.vpcEndpointParams.vpcEndpointSubnetSelection
        ),
      });

      // ECR DOCKER
      vpc.addInterfaceEndpoint("EcrDockerEndpoint", {
        service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
        subnets: vpc.selectSubnets(
          props.vpcEndpointParams.vpcEndpointSubnetSelection
        ),
      });
    }

    if (props.vpcEndpointParams.shouldCreateSsmVpcEndpoint) {
      // SSM
      vpc.addInterfaceEndpoint("SsmEndpoint", {
        service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.SSM,
        subnets: vpc.selectSubnets(
          props.vpcEndpointParams.vpcEndpointSubnetSelection
        ),
      });

      // SSM MESSAGES
      vpc.addInterfaceEndpoint("SsmMessagesEndpoint", {
        service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
        subnets: vpc.selectSubnets(
          props.vpcEndpointParams.vpcEndpointSubnetSelection
        ),
      });
    }

    if (props.vpcEndpointParams.shouldCreateLogsVpcEndpoint) {
      // LOGS
      vpc.addInterfaceEndpoint("LogsEndpoint", {
        service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        subnets: vpc.selectSubnets(
          props.vpcEndpointParams.vpcEndpointSubnetSelection
        ),
      });
    }

    if (props.vpcEndpointParams.shouldCreateS3VpcEndpoint) {
      // Gateway S3
      vpc.addGatewayEndpoint(`S3GatewayEndpoint`, {
        service: cdk.aws_ec2.GatewayVpcEndpointAwsService.S3,
      });
    }
  }
}
