import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";
import { Stack } from 'sst/constructs';
import { Datadog } from 'datadog-cdk-constructs-v2';
import { getGitRevision } from './utils/versioning';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

export default {
  config(_input) {
    return {
      name: "serverless-app-template",
      region: "eu-west-1",
    };
  },
  async stacks(app) {
    
    // Exclude from the function bundle
    // since they'll be loaded from the Layer
    app.setDefaultFunctionProps({
      nodejs: {
        esbuild: {
          external: ["datadog-lambda-js", "dd-trace"],
        },
      },
    });

    app.stack(API);

    const env = app.stage;
    const service = 'serverless-app-template';
    // get git commit sha
    const revision = getGitRevision();
    const version = revision;


    let apiKeySecretValue: string | undefined;

    const secretsManager = new SecretsManager({
      region: 'eu-west-1',
    });

    try {
      const secretData = await secretsManager.getSecretValue({ SecretId: 'DatadogApiKey' });
      if ('SecretString' in secretData) {
        apiKeySecretValue = secretData.SecretString;
      } else if (secretData.SecretBinary instanceof Buffer) {
        apiKeySecretValue = secretData.SecretBinary.toString('ascii');
      }
    } catch (error) {
      console.error('Error retrieving Datadog API key from Secrets Manager:', error);
    }

    // Attach the Datadog construct to each stack
    app.node.children.forEach((stack) => {
      if (stack instanceof Stack) {
        if (stack.stackName !== 'ApiDatadogExample') {
          const datadog = new Datadog(stack, 'datadog', {
            // Get the latest version from
            // https://github.com/Datadog/datadog-lambda-js/releases
            nodeLayerVersion: 105,
            captureLambdaPayload: true,
            // Get the latest version from
            // https://github.com/Datadog/datadog-lambda-extension/releases
            extensionLayerVersion: 55,
            site: 'us3.datadoghq.com',
            apiKey: apiKeySecretValue,
            enableDatadogTracing: true,
            enableMergeXrayTraces: false,
            enableDatadogLogs: true,
            injectLogContext: true,
            env,
            service,
            version,
          });

          datadog.addLambdaFunctions(stack.getAllFunctions());
        }
      }
    });
  },
} satisfies SSTConfig;
