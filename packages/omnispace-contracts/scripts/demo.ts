import { ethers } from "hardhat";
import {
  Omnispace,
  Omnispace__factory as OmnispaceFactory,
} from "../typechain-types";

interface Contract {
  chainId: number;
  rpcEndpoint: string;
  address?: string;
}

async function main() {
  const privateKey = process.env.WALLET_PRIVATE_KEY;

  const contracts: Record<string, Contract> = {
    mumbai: {
      address: "0x697794Bd7e5C0B130ac18e2829744D1ac299E62e",
      chainId: 10009,
      rpcEndpoint: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
    },
    // bsctest: {
    //   address: "TODO",
    //   chainId: 10002,
    //   rpcEndpoint: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
    // },
    rinkeby: {
      address: "0x2E30C0cB671Bb63d2b5CDbdE751788f5aF8f774e",
      chainId: 10001,
      rpcEndpoint: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
    },
    ftmtest: {
      address: "0xf6c1411c9b8c9484DB3191B111A98c4ea3C3489D",
      chainId: 10012,
      rpcEndpoint: `https://rpc.testnet.fantom.network/`,
    },
    // optkovan: {
    //   address: "TODO",
    //   chainId: 10011,
    //   rpcEndpoint: `https://opt-kovan.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
    // },
  };

  const sender = contracts.ftmtest;
  const receiver = contracts.mumbai;

  const providerSender = new ethers.providers.JsonRpcProvider(
    sender.rpcEndpoint
  );
  const signerSender = new ethers.Wallet(privateKey!, providerSender);
  const instanceSender = new OmnispaceFactory(signerSender).attach(
    sender.address!
  );

  const providerReceiver = new ethers.providers.JsonRpcProvider(
    receiver.rpcEndpoint
  );
  const signerReceiver = new ethers.Wallet(privateKey!, providerReceiver);
  const instanceReceiver = new OmnispaceFactory(signerReceiver).attach(
    receiver.address!
  );

  let tokenId = 0;

  const txBuild = await instanceSender.build();
  console.log(`sender build tx: ${txBuild.hash}`);
  const receipt = await txBuild.wait();

  for (const event of receipt.events!) {
    if (event.event === "Transfer") {
      tokenId = event.args?.id.toNumber();
    }
  }

  console.log(`token id: ${tokenId}`);

  console.log(await instanceSender.spaceships(tokenId));
  // console.log(await instanceSender.tokenURI(tokenId));

  const estimateGas = await instanceSender.estimateHyperspaceJump(
    receiver.chainId,
    tokenId
  );

  console.log(`estimateGas: ${ethers.utils.formatEther(estimateGas)}`);
  console.log(
    `balance: ${ethers.utils.formatEther(await signerSender.getBalance())}`
  );

  const txJump = await instanceSender.hyperspaceJump(
    receiver.chainId,
    tokenId,
    { value: estimateGas.mul(2) } // add 20%
  );
  console.log(`sender jump tx: ${txJump.hash}`);
  await txJump.wait();

  const promise = new Promise((resolve, reject) => {
    instanceReceiver.on("Transfer", (from, to, tokenId) => {
      console.log(`[${tokenId.toNumber()}] ${from} -> ${to}`);
      resolve("done");
    });
  });
  await promise;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
