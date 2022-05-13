// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@rari-capital/solmate/src/tokens/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "base64-sol/base64.sol";
import "./libraries/SVG.sol";
import "./libraries/Utils.sol";
import "./external/layerzero/NonblockingLzApp.sol";

/// @title Omnispace ERC721 token
/// @author luax.eth
contract Omnispace is ERC721, Ownable, Pausable, NonblockingLzApp, IERC2981 {
    using Strings for uint256;

    /// Counter to keep a track of the total supply
    uint256 public totalSupply;

    // Starting token id index
    uint16 public immutable startIndex;

    // Max supply of tokens
    uint16 public immutable limit;

    // Gas used for LayerZero
    uint256 internal gasForDestinationLzReceive = 350_000;

    struct Planet {
        bytes12 name;
        bytes12 color;
    }

    // Mapping of planets name by (chain) id
    mapping(uint256 => Planet) public planets;

    // Stucture to define spaceship specificities
    struct Spaceship {
        uint16 planetId;
        uint8 color;
        uint8 attack;
        uint8 defense;
        uint8 speed;
        uint8 cargo;
        uint8 crew;
        uint8 booster;
    }

    // Mapping of spaceship by tokenId
    mapping(uint256 => Spaceship) public spaceships;

    /// @dev constructor to initialize the contract
    /// @param startIndex_ starting token id index
    /// @param limit_ max supply of tokens
    /// @param lzEndpoint_ LayerZero endpoint
    constructor(
        uint16 startIndex_,
        uint16 limit_,
        address lzEndpoint_
    ) ERC721("Omnispace", "OMNSP") NonblockingLzApp(lzEndpoint_) {
        startIndex = startIndex_;
        limit = limit_;

        planets[1] = Planet("Ethereum", "3c3c3d");
        planets[56] = Planet("Binance", "fcd535");
        planets[43114] = Planet("Avalanche", "e84142");
        planets[137] = Planet("Polygon", "7b3fe4");
        planets[42161] = Planet("Arbitrum", "2d374b");
        planets[10] = Planet("Optimism", "ff0420");
        planets[250] = Planet("Fantom", "1969ff");

        planets[4] = Planet("Rinkeby", "3c3c3d");
        planets[97] = Planet("BinanceTest", "fcd535");
        planets[43113] = Planet("Fuji", "e84142");
        planets[14465] = Planet("Mumbai", "7b3fe4");
        planets[421611] = Planet("ArbitrumRin", "2d374b");
        planets[69] = Planet("OptiKovan", "ff0420");
        planets[4002] = Planet("FantomTest", "1969ff");

        planets[31337] = Planet("Hardhat", "fff100");
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceId)
        public
        pure
        virtual
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /// @notice build a new spaceship
    /// @dev the function is payable to allow any donation.
    function build() external payable whenNotPaused {
        // Check if sender is transaction origin, to prevent reentrancy attacks
        // solhint-disable-next-line avoid-tx-origin
        if (msg.sender != tx.origin) revert SenderIsNotTxOrigin();

        // Check if gas price is 50 gwei or below to avoid gas war
        // if (tx.gasprice > 50_000_000_000) revert GasPriceTooHigh();

        // Check if the limit is not exceeded
        if (totalSupply > limit) revert AllSpaceshipBuilt();

        uint256 index;
        // Increment the tokenId counter and get current index
        unchecked {
            totalSupply++;
            index = startIndex + totalSupply;
        }

        // Generate insecure random number to use as specs for the spaceship
        // solhint-disable-next-line not-rely-on-time
        uint256 specs = uint256(
            keccak256(abi.encode(blockhash(block.number - 1), block.timestamp))
        );

        // Store the spaceship specs
        spaceships[index] = _buildSpaceship(specs);

        // Mint the spaceship to the sender
        _mint(_msgSender(), index);
    }

    function _buildSpaceship(uint256 specs_)
        internal
        view
        returns (Spaceship memory)
    {
        uint8[7] memory specs = Utils.splitNumber(specs_);

        return
            Spaceship({
                planetId: uint16(block.chainid),
                color: uint8(specs_),
                attack: specs[1] + 1,
                defense: specs[2] + 1,
                speed: specs[3] + 1,
                cargo: specs[4] + 1,
                crew: specs[5] + 1,
                booster: specs[6]
            });
    }

    // TODO: document
    function estimateHyperspaceJump(uint16 planetId_, uint256 spaceshipId_)
        public
        view
        returns (uint256)
    {
        // Create payload with spaceship details
        bytes memory payload = abi.encode(
            _msgSender(),
            spaceshipId_,
            spaceships[spaceshipId_]
        );

        uint16 version = 1;
        bytes memory adapterParams = abi.encodePacked(
            version,
            gasForDestinationLzReceive
        );

        // Estimate gas for sending to destination
        (uint256 messageFee, ) = lzEndpoint.estimateFees(
            planetId_,
            address(this),
            payload,
            false,
            adapterParams
        );

        return messageFee;
    }

    /// @notice Send a spaceship to another planet using hyperspace jump
    /// @dev a message to LayerZero is sent to the destination planet with the spaceship info
    /// @param planetId_ the destination planet id
    /// @param spaceshipId_ the tokenId of the spaceship to send
    function hyperspaceJump(uint16 planetId_, uint256 spaceshipId_)
        external
        payable
        whenNotPaused
    {
        // Check spaceship ownership
        if (ownerOf[spaceshipId_] != _msgSender()) revert NotTokenOwner();

        // Check if planetId (chainId) is present in trusted source
        if (trustedRemoteLookup[planetId_].length == 0) revert PlanetNotFound();

        // Create payload with spaceship details
        bytes memory payload = abi.encode(
            _msgSender(),
            spaceshipId_,
            spaceships[spaceshipId_]
        );

        // Burn the spaceship on current chain
        _burn(spaceshipId_);
        delete spaceships[spaceshipId_];

        uint16 version = 1;
        bytes memory adapterParams = abi.encodePacked(
            version,
            gasForDestinationLzReceive
        );

        // Estimate gas for sending to destination
        (uint256 messageFee, ) = lzEndpoint.estimateFees(
            planetId_,
            address(this),
            payload,
            false,
            adapterParams
        );

        // Check if enough ether is available to pay for the message
        if (msg.value < messageFee) revert InsufficientGasFees();

        // Send the spaceship to the new chain
        // solhint-disable-next-line check-send-result
        lzEndpoint.send{value: msg.value}(
            planetId_, // destination chainId
            trustedRemoteLookup[planetId_], // destination address
            payload, // payload
            payable(msg.sender), // refund address
            address(0x0), // unused param
            adapterParams // lz adapter params
        );
    }

    /// @notice token URI for a given tokenId
    /// @param spaceshipId_ tokenId of the token
    function tokenURI(uint256 spaceshipId_)
        public
        view
        override
        returns (string memory)
    {
        if (ownerOf[spaceshipId_] == address(0)) revert TokenNotFound();

        return _generateTokenURI(spaceshipId_);
    }

    // TODO: doc
    function _generateTokenURI(uint256 spaceshipId_)
        internal
        view
        returns (string memory)
    {
        Spaceship memory spaceship = spaceships[spaceshipId_];
        string memory attributes;

        attributes = string.concat(
            attributes,
            '{"trait_type":"Planet","value":"',
            Utils.bytes12ToString(planets[spaceship.planetId].name),
            '"},{"trait_type":"Attack","value":',
            uint256(spaceship.attack).toString(),
            '},{"trait_type":"Defense","value":',
            uint256(spaceship.defense).toString(),
            '},{"trait_type":"Speed","value":',
            uint256(spaceship.speed).toString(),
            '},{"trait_type":"Cargo","value":',
            uint256(spaceship.cargo).toString(),
            '},{"trait_type":"Crew","value":',
            uint256(spaceship.crew).toString(),
            '},{"trait_type":"Booster","display_type":"boost_number","value":',
            uint256(spaceship.booster).toString(), // TODO: rarity
            "}"
        );

        return
            string.concat(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string.concat(
                            '{"name": "Omniship #',
                            spaceshipId_.toString(),
                            '","description": "TODO","image_data": "',
                            _generateImageData(spaceshipId_),
                            // '","external_url": "https://omnispace.luax.dev/ship/', // TODO: URL
                            // spaceshipId_.toString(),
                            // '","animation_url": "https://omnispace.luax.dev/viwer/',
                            // spaceshipId_.toString(),
                            '","attributes": [',
                            attributes,
                            "]}"
                        )
                    )
                )
            );
    }

    // TODO: doc
    function _generateImageData(uint256 spaceshipId_)
        internal
        view
        returns (string memory)
    {
        Spaceship memory spaceship = spaceships[spaceshipId_];
        uint256 color = (uint256(spaceship.color) * 360) / 255;

        return
            string.concat(
                "data:image/svg+xml;base64,",
                Base64.encode(
                    bytes(
                        string.concat(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" preserveAspectRatio="xMinYMin meet">',
                            // Weapons
                            SVG.path(
                                string.concat(
                                    SVG.prop(
                                        "d",
                                        "M219.528 114.316h.205l2.629 2.226v13.578h2.823v-11.187l2.834 2.401v8.786h2.612v-6.574l2.834 2.4v58.719h-13.937v-70.349zM81.465 184.665H67.528v-58.719l2.834-2.4v6.574h2.612v-8.786l2.834-2.401v11.187h2.823v-13.578l2.629-2.226h.205v70.349z"
                                    ),
                                    SVG.prop("stroke", "black"),
                                    SVG.prop("fill", "#8f8e8e")
                                )
                            ),
                            // Spaceship
                            SVG.path(
                                string.concat(
                                    SVG.prop(
                                        "d",
                                        "M158.938 29.732c0-3.351.552-5.89 1.46-7.598.909-1.708 2.174-2.585 3.6-2.611 1.425-.026 3.011.799 4.562 2.494 1.551 1.695 3.068 4.26 4.353 7.715 0 0 87.738 190.591 88.195 191.987.457 1.397.656 2.559.623 3.552-.034.994-.3 1.818-.774 2.54-.474.721-1.155 1.34-2.019 1.921l-73.009 50.892h-70.538l-73.009-50.892c-.864-.581-1.546-1.2-2.019-1.921-.474-.722-.741-1.546-.774-2.54-.034-.993.166-2.155.623-3.552.457-1.396 88.195-191.987 88.195-191.987 1.285-3.455 2.801-6.02 4.352-7.715 1.551-1.695 3.138-2.52 4.563-2.494 1.426.026 2.691.903 3.599 2.611.909 1.708 1.461 4.247 1.461 7.598v113.517l16.585.031-.029-113.548z"
                                    ),
                                    SVG.prop("stroke", SVG.hsl(color, 100, 20)),
                                    SVG.prop("fill", SVG.hsl(color, 100, 40))
                                )
                            ),
                            // Tower
                            SVG.path(
                                string.concat(
                                    SVG.prop(
                                        "d",
                                        "M188.453 235.377s-12.511-7.417-23.048-13.652h-28.54l-23.286 13.741.462-34.832a42.228 42.228 0 0 1-5.023-20.037c0-23.421 18.986-42.407 42.407-42.407 23.42 0 42.406 18.986 42.406 42.407a42.209 42.209 0 0 1-5.144 20.261l-.234 34.519z"
                                    ),
                                    SVG.prop("stroke", SVG.hsl(color, 100, 20)),
                                    SVG.prop(
                                        "fill",
                                        string.concat(
                                            "#",
                                            Utils.bytes12ToString(
                                                planets[spaceship.planetId]
                                                    .color
                                            )
                                        )
                                    )
                                )
                            ),
                            // Front
                            SVG.path(
                                string.concat(
                                    SVG.prop(
                                        "d",
                                        "M142.392 56.497v-.006h.001l-.001.006zm-26.243-.119 12.258-26.646s1.343-3.232 2.076-4.517c.734-1.285 1.501-2.35 2.276-3.198.776-.847 1.56-1.477 2.329-1.892.769-.415 1.522-.615 2.234-.602a3.482 3.482 0 0 1 1.994.675c.608.436 1.151 1.082 1.605 1.936.455.854.82 1.916 1.071 3.183.252 1.267.39 2.74.39 4.415l.01 26.759-26.243-.113zm42.865.113h.001v.006l-.001-.006zm.001 0 .01-26.759c0-1.675.138-3.148.39-4.415.251-1.267.616-2.329 1.071-3.183.454-.854.997-1.5 1.605-1.936a3.482 3.482 0 0 1 1.994-.675c.712-.013 1.465.187 2.234.602.769.415 1.553 1.045 2.329 1.892.775.848 1.542 1.913 2.276 3.198.733 1.285 2.076 4.517 2.076 4.517l12.258 26.646-26.243.113z"
                                    ),
                                    SVG.prop("stroke", SVG.hsl(color, 100, 20)),
                                    SVG.prop("fill", "#ececec")
                                )
                            ),
                            "</svg>"
                        )
                    )
                )
            );
    }

    // TODO: pause transfer

    // TODO: doc
    function _nonblockingLzReceive(
        uint16, /*srcChainId_*/
        bytes memory, /*srcAddress_*/
        uint64, /*nonce_*/
        bytes memory payload_
    ) internal override {
        (address user, uint256 spaceshipId, Spaceship memory spaceship) = abi
            .decode(payload_, (address, uint256, Spaceship));
        spaceships[spaceshipId] = spaceship;
        _mint(user, spaceshipId);
    }

    /// @dev update gas for destination lz receive
    function setGasForDestinationLzReceive(uint256 newValue_)
        external
        onlyOwner
    {
        gasForDestinationLzReceive = newValue_;
    }

    /// @notice royalties information
    /// 5% of the sale price, to the contract
    function royaltyInfo(
        uint256, /*spaceshipId_*/
        uint256 salePrice_
    ) external view returns (address, uint256) {
        return (address(_msgSender()), (salePrice_ / 100) * 5);
    }

    /// @notice receiver method for donations
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {
        // Thank you :)
    }

    /// @notice withdraw all funds to the owner wallet
    function withdraw() external onlyOwner {
        // solhint-disable-next-line avoid-low-level-calls
        (bool sent, ) = payable(_msgSender()).call{
            value: address(this).balance
        }("");
        if (!sent) revert WithdrawFailed();
    }

    error SenderIsNotTxOrigin();
    error GasPriceTooHigh();
    error AllSpaceshipBuilt();
    error NotTokenOwner();
    error TokenNotFound();
    error PlanetNotFound();
    error InsufficientGasFees();
    error WithdrawFailed();
}
