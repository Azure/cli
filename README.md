# GitHub Action for Azure CLI

> [!WARNING]
> Starting with Azure CLI version `2.64.0`, the Azure CLI docker image will be based on Azure Linux. The `az` commands are not affected by this change. To ensure the compatibility of your pipelines, please migrate Alpine-specific commands to Azure Linux commands in the scripts used in the azure/cli action.
> 
> For more information, see https://go.microsoft.com/fwlink/?linkid=2282203.

With Azure CLI GitHub Action, you can automate your workflow by executing [Azure CLI](https://github.com/Azure/azure-cli) commands to manage Azure resources inside of an Action.

The action executes the Azure CLI Bash script on a user defined Azure CLI version. If the user does not specify a version, the version of Azure CLI installed on the agent is used. If there is no version of Azure CLI found on the agent, the action falls back the version to `latest`.
Read more about various Azure CLI versions [here](https://github.com/Azure/azure-cli/releases).

- `azcliversion` – **Optional** Example: 2.30.0, Default: set to az cli version of the agent.
- `inlineScript` – **Required**

Azure CLI GitHub Action is supported for the Azure public cloud as well as Azure government clouds ('AzureUSGovernment' or 'AzureChinaCloud') and Azure Stack ('AzureStack') Hub. Before running this action, login to the respective Azure Cloud  using [Azure Login](https://github.com/Azure/login) by setting appropriate value for the `environment` parameter.

The definition of this GitHub Action is in [action.yml](https://github.com/Azure/CLI/blob/master/action.yml).  The action status is determined by the exit code returned by the script rather than StandardError stream.

> [!NOTE]
> Please note that the action executes Azure CLI script in a docker container. This means that the action is subjected to potential restrictions which arise from containerized execution. For example:
> 1. If script sets up an environment variable, it will not take effect in host and hence subsequent actions shouldn't rely on such environment variable.
> 2. There is some restriction on how cross action file read/write is done. `GITHUB_WORKSPACE` directory in host is mapped to working directory inside container. So, if the action wants to create a file, which will be read by subsequent actions, it should do so within current working directory tree.

> [!WARNING]
> By default, the output of Azure CLI commands is printed to the stdout stream. Without redirecting the stdout stream, contents in it will be stored in the build log of the action. Configure Azure CLI to _not_ show output in the console screen or print in the log by setting the environment variable `AZURE_CORE_OUTPUT` to `none`. If you need the output of a specific command, override the default setting using the argument `--output` with your format of choice. For more information on output options with the Azure CLI, see [Format output](https://learn.microsoft.com/cli/azure/format-output-azure-cli).

## Sample workflow

### Dependencies on other GitHub Actions
* [Azure Login](https://github.com/Azure/login) – **Optional** Login with your Azure credentials, required only for authentication via Azure credentials. If you use this action, make sure to either use the default value of `azcliversion` or `azcliversion >= 2.30.0` for all the workflows. Authentication via connection strings or keys do not require this step.
* [Checkout](https://github.com/actions/checkout) – **Optional** To execute the scripts present in your repository.

### Workflow to execute an Azure CLI script of the latest Azure CLI version
```yaml
# File: .github/workflows/workflow.yml

on: [push]

name: AzureCLISample

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest
    steps:

    - name: Azure Login
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Azure CLI script
      uses: azure/cli@v2
      with:
        azcliversion: latest
        inlineScript: |
          az account show
          az storage -h
```

### Workflow to execute an Azure CLI script of a specific CLI version via file present in your repository.
```yaml
# File: .github/workflows/workflowForFile.yml

on: [push]

name: AzureCLISampleForFile

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest
    steps:

    - name: Azure Login
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Checkout
      uses: actions/checkout@v4

    - name: Azure CLI script file
      uses: azure/cli@v2
      with:
        azcliversion: 2.30.0
        inlineScript: |
          chmod +x $GITHUB_WORKSPACE/sampleScript.sh
          $GITHUB_WORKSPACE/sampleScript.sh
```
* [`GITHUB_WORKSPACE`](https://docs.github.com/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners#file-systems) is the environment variable provided by GitHub which represents the root of your repository.

# Getting Help for Azure CLI Issues

If you encounter an issue related to the Azure CLI commands executed in your script, you can file an issue directly on the [Azure CLI repository](https://github.com/Azure/azure-cli/issues/new/choose).

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
