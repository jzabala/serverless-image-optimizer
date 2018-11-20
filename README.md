# Serverless Image Optimizer

The purpose of this project is to demonstrate how to create a image resizer/optimizer with Lambda and S3.

## Instructions

Step 1: Install [Docker](https://www.docker.com/get-started) and the [Serverless Framework](https://serverless.com/)

Step 2: Go to the file `serverless.yml` and replace _\${YOUR-BUCKET-NAME-HERE}_ with your bucket name.

Step 3: Run the following commands:

```
yarn

docker run --rm -v $PWD:/var/task johnnyzabala/lambda:image-optimizer-build-nodejs8.10

sls deploy
```

Step 4: Enjoy 😎

For more details about this repo check this [medium](https://medium.com/@johnny02/building-an-image-resizer-optimizer-with-lambda-and-s3-35239b571c32).
