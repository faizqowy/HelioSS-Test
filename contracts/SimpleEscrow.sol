// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleEscrow {
    address public payer;
    address public payee;
    uint256 public amount;

    bool public isFunded;
    bool public isReleased;

    constructor(address _payee) payable {
        payer = msg.sender;
        payee = _payee;
        amount = msg.value;
        isFunded = msg.value > 0;
    }

    function release() public {
        require(msg.sender == payer, "Only payer can release funds");
        require(isFunded, "Escrow not funded");
        require(!isReleased, "Already released");

        isReleased = true;
        (bool success, ) = payee.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function cancel() public {
        require(msg.sender == payer, "Only payer can cancel");
        require(!isReleased, "Already released");

        (bool success, ) = payer.call{value: address(this).balance}("");
        require(success, "Refund failed");
    }
}
