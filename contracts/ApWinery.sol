// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IFutureVault.sol";
import "./interfaces/IFutureWallet.sol";
import "./interfaces/IController.sol";

import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";

import "hardhat/console.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

IFutureVault constant LIDO_FUTURE_VAULT = IFutureVault(
    0x35bBdC3FBdC26f7DfEe5670aF50B93c7EaBCe2c0
);
IERC20 constant LIDO_IBT = IERC20(0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84);
IERC20 constant LIDO_PT = IERC20(0x137189D1342AaBE7Cd75B42B265E4647596aaa01);
IController constant CONTROLLER = IController(
    0x4bA30FA240047c17FC557b8628799068d4396790
);
IFutureWallet constant LIDO_FUTURE_WALLET = IFutureWallet(
    0xb9aF29F981B4A69De421f5d8dA46c2C7c473c67c
);

address constant LINK_ADDRESS = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
address constant LINK_WRAPPER_ADDRESS = 0x5A861794B927983406fCE1D062e00b9368d97Df6;

contract ApWinery is VRFV2WrapperConsumerBase {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public userDeposits;
    address[] public tickets;

    uint256 public firstPeriodIndex;
    uint256 public lastLotteryRunPeriodIndex;

    mapping(address => uint256[]) private userIndicesInArray;

    uint256 private lastRandomnessRequestId;
    bool private hasPendingRandomness;

    constructor() VRFV2WrapperConsumerBase(LINK_ADDRESS, LINK_WRAPPER_ADDRESS) {
        LIDO_IBT.safeApprove(address(CONTROLLER), type(uint256).max);
        LIDO_PT.safeApprove(address(CONTROLLER), type(uint256).max);
    }

    function deposit() external payable {
        _deposit();
    }

    receive() external payable {
        _deposit();
    }

    modifier noPendingLotteries() {
        require(!hasPendingRandomness, "HAS_PENDING_RANDOMNESS");

        bool isFirstPeriod = lastLotteryRunPeriodIndex == 0;
        if (isFirstPeriod) {
            firstPeriodIndex = LIDO_FUTURE_VAULT.getCurrentPeriodIndex();
        } else {
            require(
                lastLotteryRunPeriodIndex + 1 ==
                    LIDO_FUTURE_VAULT.getCurrentPeriodIndex(),
                "LOTTERY_RUN_REQUIRED"
            );
        }

        _;
    }

    function _deposit() internal noPendingLotteries {
        require(msg.value >= 0.1 ether, "MIN_DEPOSIT");
        require(msg.value % 0.1 ether == 0, "ROUND_TICKET_PRICE");

        uint256 ptBalanceBeforeDeposit = getPTBalance();

        (bool success, ) = address(LIDO_IBT).call{value: msg.value}("");
        require(success, "DEPOSIT_FAILED");

        CONTROLLER.deposit(
            address(LIDO_FUTURE_VAULT),
            LIDO_IBT.balanceOf(address(this))
        );

        uint256 ptBalanceAfterDeposit = getPTBalance();
        uint256 depositedPT = ptBalanceAfterDeposit - ptBalanceBeforeDeposit;

        userDeposits[msg.sender] += depositedPT;
        userIndicesInArray[msg.sender].push(tickets.length);

        for (uint256 i = 0; 0.1 ether * i < msg.value; i++) {
            tickets.push(msg.sender);
        }
    }

    function getCurrentPeriodTotalFYTBalance() external view returns (uint256) {
        return getCurrentFYT().balanceOf(address(this));
    }

    function getPTBalance() public view returns (uint256) {
        return LIDO_PT.balanceOf(address(this));
    }

    function getUnrealizedYield() public view returns (uint256) {
        // return getPTBalance() * LIDO_FUTURE_VAULT.getUnrealisedYieldPerAPWIBT();
        return getPTBalance() * LIDO_FUTURE_VAULT.getUnrealisedYieldPerPT();
    }

    function getCurrentFYT() public view returns (IERC20) {
        return
            IERC20(
                LIDO_FUTURE_VAULT.getFYTofPeriod(
                    LIDO_FUTURE_VAULT.getCurrentPeriodIndex()
                )
            );
    }

    function withdraw() external noPendingLotteries {
        uint256 amountToWithdraw = userDeposits[msg.sender];
        require(amountToWithdraw > 0, "NO_DEPOSITS");
        userDeposits[msg.sender] = 0;

        IERC20 currentFYT = getCurrentFYT();

        if (currentFYT.allowance(address(this), address(CONTROLLER)) == 0) {
            currentFYT.safeApprove(address(CONTROLLER), type(uint256).max);
        }

        CONTROLLER.withdraw(address(LIDO_FUTURE_VAULT), amountToWithdraw);

        for (uint256 i = 0; i < userIndicesInArray[msg.sender].length; i++) {
            _removeAddressFromArray(
                tickets,
                msg.sender,
                userIndicesInArray[msg.sender][i]
            );
        }

        delete userIndicesInArray[msg.sender];
    }

    function _removeAddressFromArray(
        address[] storage array,
        address addr,
        uint256 startingIndex
    ) private {
        while (array[startingIndex] != addr) {
            if (startingIndex == array.length - 1) {
                array.pop();
                return;
            }

            array[startingIndex] = array[array.length - 1];
            array.pop();
            startingIndex++;
        }
    }

    function runLottery() external {
        require(!hasPendingRandomness, "HAS_PENDING_RANDOMNESS");

        bool isFirstPeriod = lastLotteryRunPeriodIndex == 0;
        if (isFirstPeriod) {
            lastLotteryRunPeriodIndex = firstPeriodIndex;
        } else {
            lastLotteryRunPeriodIndex++;
        }

        LIDO_FUTURE_WALLET.redeemYield(lastLotteryRunPeriodIndex);
        lastRandomnessRequestId = requestRandomness(100000, 3, 1);
    }

    // additionally may use new RANDOM opcode and/or once possible drand beacon
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        require(lastRandomnessRequestId == requestId, "REQUEST_NOT_FOUND");

        uint256 randomness = randomWords[0];

        uint256 winnerIndex = randomness % tickets.length;
        address winner = tickets[winnerIndex];

        LIDO_IBT.safeTransfer(winner, LIDO_IBT.balanceOf(address(this)));

        hasPendingRandomness = false;
    }
}
