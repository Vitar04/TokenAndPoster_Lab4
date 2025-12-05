// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Poster {
    address public tokenAddress;
    uint256 public threshold;

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event NewPost(address indexed user, string content, bytes32 tagHash);

    constructor(address _tokenAddress, uint256 _threshold) public {
        // ЛР4: сохраняем адрес токена и порог
        tokenAddress = _tokenAddress;
        threshold = _threshold;

        // ЛР4: инициализируем владельца
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
    }

    // === ЛР4: модификатор владельца ===
    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    // === ЛР4: смена владельца (нужно для передачи в MetaMask-адрес) ===
    function transferOwnership(address _newOwner) public onlyOwner {
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }

    // === ЛР4: изменяемый адрес токена, только для owner ===
    function setTokenAddress(address _newTokenAddress) public onlyOwner {
        tokenAddress = _newTokenAddress;
    }

    // === ЛР4: изменяемый порог, только для owner ===
    function setThreshold(uint256 _newThreshold) public onlyOwner {
        threshold = _newThreshold;
    }

    // === Модифицированный post по ЛР4 ===
    function post(string memory content, string memory tag) public {
        // ЛР4: токен-гейтинг
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(msg.sender);
        if (balance < threshold) {
            revert("Not enough tokens");
        }

        bytes32 tagHash = keccak256(abi.encodePacked(tag));
        emit NewPost(msg.sender, content, tagHash);
    }
}
