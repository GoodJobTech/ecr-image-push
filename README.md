## Push Images to ECR 


Push a Docker image to AWS Elastic Container Registry. 

Usage
---
```yaml
jobs:

  distribute-image:
    steps:
      - run: docker build --tag example .
      - name: Push a Docker image to ECR
        uses: GoodJobTech/ecr-image-push@v0.1.0
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-default-region: ${{ secrets.AWS_DEFAULT_REGION }} # Optional
          image: example                                        # Must match with the tag, given in the docker build in 'run'.
          tags: latest, ${{ github.sha }}, some-other-tag
```

## Inputs

Following inputs can be used:

| Name             | Type    | Default/Required      | Description                                                      |
|------------------|---------|--------------|------------------------------------------------------------------|
| `aws-access-key-id`   | String  | **Required** | Specifies an AWS access key associated with an IAM user or role. |
| `aws-secret-access-key`        | String  | **Required**     | Specifies the secret key associated with the access key. This is essentially the "password" for the access key.                                         |
| `aws-default-region`           | String  |  `us-east-1`            | Specifies the AWS Region to send the request to    |
| `image`        | String  | **Required**          | The name of the image. (Should not include repository, must be matching with the image created locally.)                        |
| `tags`   | String    | `latest`      | Tags the be added when pushing the image to ECR. (Comma seperated string)                                          |



## Contributing 

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```




See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)


## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action

## License

Source code is licenced under the [MIT License](https://www.mit.edu/~amini/LICENSE.md) also uses the [Github's Actions Template](https://github.com/actions/typescript-action).