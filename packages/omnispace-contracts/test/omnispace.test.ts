import chai from "chai";
import { ethers } from "hardhat";
import { BigNumber as EthersBN, constants } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { solidity } from "ethereum-waffle";
import {
  Omnispace,
  Omnispace__factory as OmnispaceFactory,
  LzRelayerMock,
  LzRelayerMock__factory as LzRelayerMockFactory,
} from "../typechain-types";

chai.use(solidity);
const { expect } = chai;

describe("Omnispace", () => {
  let relayer: LzRelayerMock;
  let polygon: Omnispace;
  let binance: Omnispace;
  let deployer: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    const LzFactory = new LzRelayerMockFactory(deployer);
    relayer = await LzFactory.deploy();

    console.log(`Relayer address: ${relayer.address}`);

    const factory = new OmnispaceFactory(deployer);
    polygon = await factory.deploy(0, 1000, relayer.address);
    binance = await factory.deploy(1000, 1000, relayer.address);

    console.log(`Polygon address: ${polygon.address} 10009`);
    console.log(`Binance address: ${binance.address} 10002`);

    await polygon.setTrustedRemote(
      10002,
      ethers.utils.defaultAbiCoder.encode(["address"], [binance.address])
      // binance.address
    );
    await binance.setTrustedRemote(
      10009,
      ethers.utils.defaultAbiCoder.encode(["address"], [polygon.address])
      // polygon.address
    );
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("should build a spaceship and do jump to another planet", async () => {
    await polygon.build();

    expect(await binance.ownerOf(1)).to.be.equal(
      "0x0000000000000000000000000000000000000000"
    );

    console.log(`Polygon spaceship: ${await polygon.spaceships(1)}`);
    console.log(`Polygon metadata: ${await polygon.tokenURI(1)}`);

    await relayer.setNextSrcChainId(10009);
    await polygon.hyperspaceJump(10002, 1, {
      value: ethers.utils.parseEther("0.1"),
    });

    expect(await polygon.ownerOf(1)).to.be.equal(
      "0x0000000000000000000000000000000000000000"
    );

    // expect(polygon.ownerOf(1)).to.be.reverted;
    // console.log(polygon.ownerOf(1));

    console.log(`Binance spaceship: ${await binance.spaceships(1)}`);
    console.log(`Binance metadata: ${await binance.tokenURI(1)}`);
  });
});
