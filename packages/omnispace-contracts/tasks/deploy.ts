import { task, types } from "hardhat/config";
import promptjs from "prompt";

promptjs.colors = false;
promptjs.message = "> ";
promptjs.delimiter = "";

type ContractName = "Omnispace";

interface Contract {
  args?: (string | number | (() => string | undefined))[];
  address?: string;
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
}

task("deploy", "Deploys smart contracts")
  .addParam("startIndex", "Starting index", 0, types.int)
  .addParam("limit", "Max supply", 1000, types.int)
  .addParam("lzEndpoint", "LazyerZero endpoint", undefined, types.string)
  .addOptionalParam("y", "Auto accept", false, types.boolean)
  .setAction(async (args, { ethers }) => {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${await deployer.getAddress()}`);

    const contracts: Record<ContractName, Contract> = {
      Omnispace: {
        args: [args.startIndex, args.limit, args.lzEndpoint],
        waitForConfirmation: true,
      },
    };

    let gasPrice = await ethers.provider.getGasPrice();
    const gasInGwei = Math.round(
      Number(ethers.utils.formatUnits(gasPrice, "gwei"))
    );

    let result;

    if (!args.y) {
      promptjs.start();

      result = await promptjs.get([
        {
          properties: {
            gasPrice: {
              type: "integer",
              required: true,
              description: "Enter a gas price (gwei)",
              default: gasInGwei,
            },
          },
        },
      ]);

      gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), "gwei");
    }

    for (const [name, contract] of Object.entries(contracts)) {
      const factory = await ethers.getContractFactory(name, {
        libraries: contract?.libraries?.(),
      });

      const deploymentGas = await ethers.provider.estimateGas(
        factory.getDeployTransaction(
          ...(contract.args?.map((a) => (typeof a === "function" ? a() : a)) ??
            [])
        )
      );
      const deploymentCost = deploymentGas.mul(gasPrice);

      console.log(
        `Estimated cost to deploy ${name}: ${ethers.utils.formatUnits(
          deploymentCost,
          "ether"
        )} ETH`
      );

      if (!args.y) {
        result = await promptjs.get([
          {
            properties: {
              confirm: {
                type: "string",
                description: 'Type "DEPLOY" to confirm:',
              },
            },
          },
        ]);

        if (result.confirm != "DEPLOY") {
          console.log("Exiting");
          return;
        }
      }

      console.log("Deploying...");

      const deployedContract = await factory
        .connect(deployer)
        .deploy(
          ...(contract.args?.map((a) => (typeof a === "function" ? a() : a)) ??
            []),
          {
            gasLimit: deploymentGas,
            gasPrice: gasPrice,
            // maxFeePerGas: gasPrice,
            // maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
          }
        );

      console.log(
        `${name} contract deployment in tx ${deployedContract.deployTransaction.hash}`
      );

      if (contract.waitForConfirmation) {
        await deployedContract.deployed();
      }

      contracts[name as ContractName].address = deployedContract.address;

      console.log(`${name} contract deployed to ${deployedContract.address}`);
    }

    return contracts;
  });
