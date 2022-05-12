import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "hardhat-watcher";
import "hardhat-tracer";
import "@typechain/hardhat";
import "@openzeppelin/hardhat-upgrades";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20_000,
      },
      viaIR: true,
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 1,
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 4,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 5,
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 10,
    },
    optkovan: {
      url: `https://opt-kovan.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 69,
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 137,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 80001,
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 42161,
    },
    arbrinkeby: {
      url: `https://arb-rinkeby.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 421611,
    },
    binance: {
      url: `https://bsc-dataseed.binance.org/`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 56,
    },
    bsctest: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 97,
    },
    fantom: {
      url: `https://rpc.ftm.tools/`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 250,
    },
    ftmtest: {
      url: `https://rpc.testnet.fantom.network/`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
      chainId: 4002,
    },
    hardhat: {
      // forking: {
      // url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.RPC_ENDPOINT_ID_OPTIMISM}`,
      // },
      initialBaseFeePerGas: 0,
    },
  },
  watcher: {
    compile: {
      tasks: ["compile"],
    },
    test: {
      tasks: [{ command: "test", params: { testFiles: ["{path}"] } }],
      files: ["./test/**/*"],
      verbose: false,
    },
  },
  mocha: {
    timeout: 60_000,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 20,
  },
  abiExporter: {
    path: "./abi",
    clear: true,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY_ETHEREUM,
      ropsten: process.env.ETHERSCAN_API_KEY_ETHEREUM,
      rinkeby: process.env.ETHERSCAN_API_KEY_ETHEREUM,
      goerli: process.env.ETHERSCAN_API_KEY_ETHEREUM,
      kovan: process.env.ETHERSCAN_API_KEY_ETHEREUM,

      bsc: process.env.ETHERSCAN_API_KEY_BINANCE,
      bscTestnet: process.env.ETHERSCAN_API_KEY_BINANCE,

      opera: process.env.ETHERSCAN_API_KEY_FANTOM,
      ftmTestnet: process.env.ETHERSCAN_API_KEY_FANTOM,

      optimisticEthereum: process.env.ETHERSCAN_API_KEY_OPTIMISM,
      optimisticKovan: process.env.ETHERSCAN_API_KEY_OPTIMISM,

      polygon: process.env.ETHERSCAN_API_KEY_POLYGON,
      polygonMumbai: process.env.ETHERSCAN_API_KEY_POLYGON,

      arbitrumOne: process.env.ETHERSCAN_API_KEY_ARBITRUM,
      arbitrumTestnet: process.env.ETHERSCAN_API_KEY_ARBITRUM,

      avalanche: process.env.ETHERSCAN_API_KEY_AVALANCHE,
      avalancheFujiTestnet: process.env.ETHERSCAN_API_KEY_AVALANCHE,
    },
  },
};

export default config;
