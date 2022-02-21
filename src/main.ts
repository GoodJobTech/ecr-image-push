import * as core from '@actions/core'
import { ChildProcess, exec } from 'child_process';
import { streamToString } from './utils';

const AWS_DEFAULT_OUTPUT = 'json';
const AWS_ACCESS_KEY_ID: string = core.getInput('aws-access-key-id', {required: true})
const AWS_SECRET_ACCESS_KEY: string = core.getInput('aws-secret-access-key', {required: true})
const AWS_DEFAULT_REGION: string = core.getInput('aws-default-region')
const image: string  = core.getInput('image', {required: true}) 
const tags: string[] = core.getInput('tags').split(',').map((tag) =>tag.trim()) || ['latest'];
let distributedImages: string[] = [];

async function run(): Promise<void> {
  try {
    const {stdout, stderr} = await executeCommand(`aws sts get-caller-identity --output json --region ${AWS_DEFAULT_REGION}`);
    const ad = await streamToString(stdout);
    core.debug(`Account data: ${ad}`);
    const accountData: AccountData = JSON.parse(ad);
    await dockerLogin(accountData);


    for (const tag of tags) {
      await dockerPush(image, tag, accountData);
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }   
  }
}


interface AccountData {
  UserId: string;
  Account: string;
  Arn: string;
}

// dockerPush pushes the image to the ECR registry.
async function dockerPush(image: string, tag: string, accountData: AccountData): Promise<void> {
  const repository: string = `${accountData.Account}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com`; 
  const uri: string = `${repository}/${image}:${tag}`;
  core.debug(`Pushing image ${image} as ${uri}`);
  await executeCommand(`docker tag ${image} ${uri}`);
  await executeCommand(`docker push ${uri}`);
  distributedImages.push(uri);
}

async function executeCommand(cmd: string): Promise<ChildProcess> {
  return  exec(cmd, {
    shell: 'bin/bash',
    encoding: 'utf-8',
    env: {
    ...process.env,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION,
    AWS_DEFAULT_OUTPUT,
  }})
}

async function dockerLogin(accountData: AccountData): Promise<void> {
  // The logic here described in AWS ECR documentation: 
  // https://docs.aws.amazon.com/AmazonECR/latest/userguide/getting-started-cli.html#cli-authenticate-registry
  const loginCommand = `aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${accountData.Account}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com`
  await executeCommand(loginCommand);
}


run()
core.setOutput('images', distributedImages)