import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcsFargateParams } from "../parameter";

export interface EcsFargateConstructProps {
  vpcId: string;
  ecsFargateParams: EcsFargateParams;
}

export class EcsFargateConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EcsFargateConstructProps) {
    super(scope, id);

    // Pull through cache rules
    const pullThroughCacheRule = props.ecsFargateParams.ecrRepositoryPrefix
      ? new cdk.aws_ecr.CfnPullThroughCacheRule(this, "PullThroughCacheRule", {
          ecrRepositoryPrefix: props.ecsFargateParams.ecrRepositoryPrefix,
          upstreamRegistryUrl: "public.ecr.aws",
        })
      : undefined;

    // VPC
    const vpc = cdk.aws_ec2.Vpc.fromLookup(this, "Vpc", {
      vpcId: props.vpcId,
    });

    // Log Group
    const logGroup = new cdk.aws_logs.LogGroup(this, "LogGroup", {
      logGroupName: `/ecs/${props.ecsFargateParams.clusterName}/${props.ecsFargateParams.repositoryName}/ecs-exec`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: cdk.aws_logs.RetentionDays.TWO_WEEKS,
    });

    // ECS Cluster
    const cluster = new cdk.aws_ecs.Cluster(this, "Cluster", {
      vpc,
      containerInsights: false,
      clusterName: props.ecsFargateParams.clusterName,
      executeCommandConfiguration: {
        logging: cdk.aws_ecs.ExecuteCommandLogging.OVERRIDE,
        logConfiguration: {
          cloudWatchLogGroup: logGroup,
        },
      },
    });

    // Task definition
    const taskDefinition = new cdk.aws_ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          cpuArchitecture: cdk.aws_ecs.CpuArchitecture.ARM64,
          operatingSystemFamily: cdk.aws_ecs.OperatingSystemFamily.LINUX,
        },
      }
    );

    // Container
    taskDefinition.addContainer("Container", {
      image: pullThroughCacheRule?.ecrRepositoryPrefix
        ? cdk.aws_ecs.ContainerImage.fromEcrRepository(
            cdk.aws_ecr.Repository.fromRepositoryName(
              this,
              pullThroughCacheRule.ecrRepositoryPrefix,
              props.ecsFargateParams.repositoryName
            ),
            props.ecsFargateParams.imagesTag
          )
        : cdk.aws_ecs.ContainerImage.fromRegistry(
            `${props.ecsFargateParams.repositoryName}:${props.ecsFargateParams.imagesTag}`
          ),
      pseudoTerminal: true,
      linuxParameters: new cdk.aws_ecs.LinuxParameters(
        this,
        "LinuxParameters",
        {
          initProcessEnabled: true,
        }
      ),
    });

    // Pull through cache Policy
    if (pullThroughCacheRule?.ecrRepositoryPrefix) {
      taskDefinition.obtainExecutionRole().attachInlinePolicy(
        new cdk.aws_iam.Policy(this, "PullThroughCachePolicy", {
          statements: [
            new cdk.aws_iam.PolicyStatement({
              actions: ["ecr:CreateRepository", "ecr:BatchImportUpstreamImage"],
              resources: [
                `arn:aws:ecr:${cdk.Stack.of(this).region}:${
                  cdk.Stack.of(this).account
                }:repository/${props.ecsFargateParams.ecrRepositoryPrefix}/*`,
              ],
            }),
          ],
        })
      );
    }

    // Attache Security Group
    const securityGroups = props.ecsFargateParams.ecsServiceSecurityGroupIds
      ? props.ecsFargateParams.ecsServiceSecurityGroupIds.map(
          (securityGroupId) => {
            return cdk.aws_ec2.SecurityGroup.fromSecurityGroupId(
              this,
              `EcsServiceSecurityGroupId_${securityGroupId}`,
              securityGroupId
            );
          }
        )
      : undefined;

    // ECS Service
    const ecsService = new cdk.aws_ecs.FargateService(this, "Service", {
      cluster,
      enableExecuteCommand: true,
      taskDefinition,
      desiredCount: props.ecsFargateParams.desiredCount,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      deploymentController: {
        type: cdk.aws_ecs.DeploymentControllerType.ECS,
      },
      circuitBreaker: { rollback: true },
      securityGroups,
      vpcSubnets: props.ecsFargateParams.ecsFargateSubnetSelection,
    });

    // Allow dst Security Group from ECS Service Security Group
    props.ecsFargateParams.inboundFromEcsServiceAllowedSecurityGroupId?.forEach(
      (allowRule) => {
        const securityGroup = cdk.aws_ec2.SecurityGroup.fromSecurityGroupId(
          this,
          `InboundFromEcsServiceAllowedSecurityGroupId_${allowRule.securityGroupId}`,
          allowRule.securityGroupId
        );

        allowRule.ports.forEach((port) => {
          ecsService.connections.securityGroups.forEach(
            (ecsServiceSecurityGroup) => {
              securityGroup.addIngressRule(
                ecsServiceSecurityGroup,
                port,
                `Inbound ${props.ecsFargateParams.clusterName} service`
              );
            }
          );
        });
      }
    );
  }
}
