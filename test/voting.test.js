const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Voting = artifacts.require('Voting');

contract("Voting", accounts => {

    const owner = accounts[0];
    const voter = accounts[1];
    const voter2 = accounts[2];

    /**
     * Clean each time the instance of the smart contract
     */
    beforeEach(async function () {

        this.votingInstance = await Voting.new({from: owner});
    });


    describe('Registering Voters', function() {

        it('creates a voter', async function () {


        });
    }


    )

})
