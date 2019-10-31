# Azure CLI GitHub Action


With Azure CLI GitHub Action, you can automate your workflow by executing [Azure CLI](https://github.com/Azure/azure-cli) commands to manage Azure resources inside of an Action.

The definition of this GitHub Action is in [action.yml](https://github.com/Azure/CLI/blob/master/action.yml).


## Dependencies on other GitHub Actions
* [Azure Login](https://github.com/Azure/login) Login with your Azure credentials 

# Sample workflow that executes the script on a Azure CLI version

The action executes the Azure CLI Bash script on a user defined Azure CLI version. Read more about various Azure CLI versions [here](https://github.com/Azure/azure-cli/releases).

- `azcliversion` – **Optional** Example: 2.0.72, Default: latest
- `inlineScript` – **Required** 

```
# File: .github/workflows/workflow.yml

on: [push]

name: AzureCLISample

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Azure CLI script
      uses: azure/CLI@v1
      with:
        azcliversion: 2.0.72
        inlineScript: |
          az --version
          az account show
```
* Now in the workflow file in your branch: .github/workflows/workflow.yml replace the secret in Azure login action with your secret (Refer to the example above)

# Azure CLI metadata file

```
# File: action.yml

# Automate your GitHub workflows using Azure CLI scripts.
name: 'Azrure CLI'
description: 'The action is used to execute Azure CLI commands'
inputs:
  inlineScript:
    description: 'Specify the script here'
    required: true
  azcliversion:
    description: 'Azure CLI version to be used to execute the script'
    required: false
    default: 'latest'
runs:
  using: 'node12'
  main: 'lib/main.js'
```

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
