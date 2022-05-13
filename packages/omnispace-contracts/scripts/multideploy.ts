import { ethers } from "hardhat";
import {
  Omnispace,
  Omnispace__factory as OmnispaceFactory,
} from "../typechain-types";
import { execSync } from "child_process";

interface Contract {
  startIndex: number;
  limit: number;
  lzEndpoint: string;
  executor?: string;
  chainId: number;
  rpcEndpoint: string;
  address?: string;
}

async function main() {
  const privateKey = process.env.WALLET_PRIVATE_KEY;

  const contracts: Record<string, Contract> = {
    mumbai: {
      startIndex: 0,
      limit: 1000,
      lzEndpoint: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
      executor: "0xF5E8A439C599205C1aB06b535DE46681Aed1007a",
      chainId: 10009,
      rpcEndpoint: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
    },
    // bsctest: {
    //   startIndex: 1000,
    //   limit: 1000,
    //   lzEndpoint: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
    //   executor: "0xF5E8A439C599205C1aB06b535DE46681Aed1007a",
    //   chainId: 10002,
    //   rpcEndpoint: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
    // },
    rinkeby: {
      startIndex: 2000,
      limit: 1000,
      lzEndpoint: "0x79a63d6d8BBD5c6dfc774dA79bCcD948EAcb53FA",
      executor: "0xF5E8A439C599205C1aB06b535DE46681Aed1007a",
      chainId: 10001,
      rpcEndpoint: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
    },
    ftmtest: {
      startIndex: 3000,
      limit: 1000,
      lzEndpoint: "0x7dcAD72640F835B0FA36EFD3D6d3ec902C7E5acf",
      executor: "0xF5E8A439C599205C1aB06b535DE46681Aed1007a",
      chainId: 10012,
      rpcEndpoint: `https://rpc.testnet.fantom.network/`,
    },
    // optkovan: {
    //   startIndex: 4000,
    //   limit: 1000,
    //   lzEndpoint: "0x72aB53a133b27Fa428ca7Dc263080807AfEc91b5",
    //   executor: "0xF5E8A439C599205C1aB06b535DE46681Aed1007a",
    //   chainId: 10011,
    //   rpcEndpoint: `https://opt-kovan.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
    // },
  };

  for (const [name, contract] of Object.entries(contracts)) {
    const provider = new ethers.providers.JsonRpcProvider(contract.rpcEndpoint);
    const signer = new ethers.Wallet(privateKey!, provider);

    const factory = new OmnispaceFactory(signer);
    const instance = await factory.deploy(
      contract.startIndex,
      contract.limit,
      contract.lzEndpoint
    );

    console.log(`${name} tx: ${instance.deployTransaction.hash}`);
    await instance.deployed();
    contracts[name].address = instance.address;
    console.log(`${name} address: ${instance.address}`);

    // await tenderly.push({
    //   name: "Omnispace",
    //   address: instance.address,
    //   network: name,
    // });

    // await tenderly.verify({
    //   name: "Omnispace",
    //   address: instance.address,
    //   network: name,
    // });
  }

  for (const [name, contract] of Object.entries(contracts)) {
    const provider = new ethers.providers.JsonRpcProvider(contract.rpcEndpoint);
    const signer = new ethers.Wallet(privateKey!, provider);

    const factory = new OmnispaceFactory(signer);
    const instance = factory.attach(contract.address!);

    for (const [subName, subContract] of Object.entries(contracts)) {
      if (subName === name) continue;
      const tx = await instance.setTrustedRemote(
        subContract.chainId,
        // ethers.utils.defaultAbiCoder.encode(["address"], [subContract.address])
        subContract.address!
      );
      console.log(`${name} -> ${subName} tx: ${tx.hash}`);
      await tx.wait();
    }
  }

  for (const [name, contract] of Object.entries(contracts)) {
    console.log(
      `hh verify ${contract.address} ${contract.startIndex} ${contract.limit} ${contract.lzEndpoint} --network ${name}`
    );

    execSync(
      `hh verify ${contract.address} ${contract.startIndex} ${contract.limit} ${contract.lzEndpoint} --network ${name}`
    );
    // await hre.run("verify:verify", {
    //   address: contract.address!,
    //   constructorArguments: [
    //     contract.startIndex,
    //     contract.limit,
    //     contract.lzEndpoint,
    //   ],
    // });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
