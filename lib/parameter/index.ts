import * as cdk from "aws-cdk-lib";

export interface VpcEndpointParams {
  vpcEndpointSubnetSelection?: cdk.aws_ec2.SubnetSelection;
  shouldCreateEcrVpcEndpoint?: boolean;
  shouldCreateSsmVpcEndpoint?: boolean;
  shouldCreateLogsVpcEndpoint?: boolean;
  shouldCreateS3VpcEndpoint?: boolean;
}

export interface EcsFargateParams {
  ecsFargateSubnetSelection: cdk.aws_ec2.SubnetSelection;
  clusterName: string;
  ecrRepositoryPrefix?: string;
  repositoryName: string;
  imagesTag: string;
  desiredCount: number;
  securityGroupId?: string;
}

export interface EcsFargateBastionStackParams {
  env?: cdk.Environment;
  property: {
    vpcId: string;
    vpcEndpointParams?: VpcEndpointParams;
    ecsFargateParams: EcsFargateParams;
  };
}

export const ecsFargateBastionStackParams: EcsFargateBastionStackParams = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  property: {
    vpcId: "vpc-0c923cc42e5fb2cbf",
    vpcEndpointParams: {
      vpcEndpointSubnetSelection: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: ["us-east-1a"],
      },
      shouldCreateEcrVpcEndpoint: true,
      shouldCreateSsmVpcEndpoint: true,
      shouldCreateLogsVpcEndpoint: true,
      shouldCreateS3VpcEndpoint: true,
    },
    ecsFargateParams: {
      ecsFargateSubnetSelection: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        availabilityZones: ["us-east-1a"],
      },
      clusterName: "ecs-fargate-bastion",
      ecrRepositoryPrefix: "ecr-public-pull-through3",
      repositoryName: "ecr-public-pull-through3/docker/library/busybox",
      imagesTag: "stable-musl",
      desiredCount: 1,
      securityGroupId: "sg-05744485862b195ae",
    },
  },
};
