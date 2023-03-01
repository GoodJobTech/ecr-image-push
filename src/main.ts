import * as core from '@actions/core'
import { exec } from 'child_process';


const AWS_DEFAULT_OUTPUT = 'json';
const AWS_PAGER = '';
const AWS_ACCESS_KEY_ID: string = core.getInput('aws-access-key-id', { required: true })
const AWS_SECRET_ACCESS_KEY: string = core.getInput('aws-secret-access-key', { required: true })
const AWS_DEFAULT_REGION: string = core.getInput('aws-default-region')
const image: string = core.getInput('image', { required: true })
const tags: string[] = core.getInput('tags').split(',').map((tag) => tag.trim()) || ['latest'];
let distributedImages: string[] = [];

async function run(): Promise<void> {
  try {
    const { stdout, stderr } = await execute(`aws sts get-caller-identity --output json --no-cli-pager --region ${AWS_DEFAULT_REGION}`);
    core.debug(`Account data: ${stdout}`);
    core.debug(`Stderr: ${stderr}`);
    const accountData: AccountData = JSON.parse(stdout);
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

interface CommandOutput {
  stdout: string;
  stderr: string;
}

export async function execute(command: string): Promise<CommandOutput> {
  return new Promise<CommandOutput>((resolve, reject) => {
    exec(command, {
      shell: '/bin/bash',
      encoding: 'utf-8',
      env: {
        ...process.env,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_DEFAULT_REGION,
        AWS_DEFAULT_OUTPUT,
        AWS_PAGER,
      }
    },
      (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
  });
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
  await execute(`docker tag ${image} ${uri}`);
  await execute(`docker push ${uri}`);
  distributedImages.push(uri);
}


async function dockerLogin(accountData: AccountData): Promise<void> {
  // The logic here described in AWS ECR documentation: 
  // https://docs.aws.amazon.com/AmazonECR/latest/userguide/getting-started-cli.html#cli-authenticate-registry
  const loginCommand = `aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${accountData.Account}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com`
  await execute(loginCommand);
}


run()
core.setOutput('images', distributedImages)