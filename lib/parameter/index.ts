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
  ecsServiceSecurityGroupIds?: string[];
  inboundFromEcsServiceAllowedSecurityGroupId?: {
    securityGroupId: string;
    ports: cdk.aws_ec2.Port[];
  }[];
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
    vpcId: "vpc-06f36019e6dc40f86",
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
      ecrRepositoryPrefix: "ecr-public-pull-through",
      repositoryName: "ecr-public-pull-through/docker/library/busybox",
      imagesTag: "stable-musl",
      desiredCount: 1,
      ecsServiceSecurityGroupIds: [
        "sg-0e5bce3c653793012",
        "sg-0a15755f2fb642698",
      ],
      inboundFromEcsServiceAllowedSecurityGroupId: [
        {
          securityGroupId: "sg-0a15755f2fb642698",
          ports: [cdk.aws_ec2.Port.allTcp(), cdk.aws_ec2.Port.allIcmp()],
        },
      ],
    },
  },
};
