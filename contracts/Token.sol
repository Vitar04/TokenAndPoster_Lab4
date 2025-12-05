// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Token is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    string private _name;
    string private _symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(string memory name_, string memory symbol_, uint256 _totalSupply) {
        _name = name_;
        _symbol = symbol_;
        totalSupply = _totalSupply;

        address creator = _msgSender();
        balances[creator] = totalSupply;
        emit Transfer(address(0), creator, totalSupply);

        owner = creator;
        emit OwnershipTransferred(address(0), owner);
    }

    modifier onlyOwner() {
        require(owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    // ======= IERC20Metadata =======

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    // decimals — public constant, геттер сгенерируется автоматически

    // ======= IERC20 =======

    function balanceOf(address account) public view override returns (uint256) {
        return balances[account];
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address from = _msgSender();
        _transfer(from, to, amount);
        return true;
    }

    function allowance(address owner_, address spender) public view override returns (uint256) {
        return allowances[owner_][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        address from = _msgSender();
        _approve(from, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    // ======= onlyOwner функции =======

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "new owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function mint(address account, uint256 amount) public onlyOwner {
        require(account != address(0), "mint to the zero address");
        totalSupply += amount;
        balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    // ======= internal helpers =======

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            balances[from] = fromBalance - amount;
            balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(
        address owner_,
        address spender,
        uint256 amount
    ) internal {
        require(owner_ != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    function _spendAllowance(
        address owner_,
        address spender,
        uint256 amount
    ) internal {
        uint256 currentAllowance = allowance(owner_, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner_, spender, currentAllowance - amount);
            }
        }
    }
}
