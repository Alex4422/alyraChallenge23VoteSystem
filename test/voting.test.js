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

    /**
     *   Management of the voter zone
     */
    describe('A. Registering Voters', function() {

        it('1. creates a voter', async function () {

            await this.votingInstance.registerVoter(accounts[1], {from: owner});
            //await this.votingInstance.registerVoter(accounts[2], {from: owner});


            let addresses = await this.votingInstance.getAddresses();
            let voter = await this.votingInstance.getVoter(accounts[1]);

            expect(addresses[0]).to.equal(accounts[1]);
            expect(voter.isRegistered).to.equal(true);
        });

        it('2. Sends an event after registering a voter', async function () {

            expectEvent(await this.votingInstance.registerVoter(accounts[1], {from: owner}),
                'VoterRegistered', {voterAddress: accounts[1]});
        });

        it('3. Reverts registering voter if you are not the owner', async function() {

            await expectRevert(this.votingInstance.registerVoter(accounts[1], {from: accounts[2]}),
            "Ownable: caller is not the owner");

        });

        it('4. Reverts registering if the voter is already registered', async function() {

            await this.votingInstance.registerVoter(accounts[1], {from: owner});
            await expectRevert(this.votingInstance.registerVoter(accounts[1], {from:owner}),
                "The voter is already registered");
        });

        it('5. Reverts if it is the wrong status of workflow', async function()  {
            await this.votingInstance.startProposalRegistrationSession();
            await expectRevert(this.votingInstance.registerVoter(accounts[1],{from:owner}),
                "This workflow status is not the one expected");
        });
    })

    /**
     *  Management of the workflow zone
     */
    describe('B. Management of the status of the workflow', async function() {

        it('6. Changes worflow status', async function() {

            let workflowStatus = await this.votingInstance.getStatusOfWorkflow();
            expect(workflowStatus).to.be.bignumber.equal(new BN(0));

            await this.votingInstance.startProposalRegistrationSession();
            let workflowStatus2 = await this.votingInstance.getStatusOfWorkflow();

            expect(workflowStatus2).to.be.bignumber.equal(new BN(1));
        });

        it('7. Sends an event after the modification of workflow', async function() {

            expectEvent( await this.votingInstance.startProposalRegistrationSession(),
                'WorkflowStatusChange', {previousStatus: new BN(0), newStatus: new BN(1)});

        });
    })

    /**
     * Registering of the proposals zone
     */
    describe('C. Registering of the proposals', async function() {

        it('8. Reverts if caller is not registered', async function() {

            await this.votingInstance.startProposalRegistrationSession();
            await expectRevert(this.votingInstance.registerProposal("hiking", {from: voter}),
                "This address (= this user) is not registered in the list");
        });

        it('9. Reverts registered proposal if it is not the correct workflow waited', async function() {

            await this.votingInstance.registerVoter(voter, {from: owner});
            await expectRevert(this.votingInstance.registerProposal("hiking", {from: voter}),
                "This workflow status is not the one expected");

        });

        it('10. Reverts if the proposal doesn\'t contain any character', async function() {

            await this.votingInstance.registerVoter(voter, {from: owner});
            await this.votingInstance.startProposalRegistrationSession();
            await expectRevert( this.votingInstance.registerProposal("", {from: voter}),
                "Type, at least, one character please!" );

        })

        it('11. Reverts if the proposal is already present', async function() {

            //await this.votingInstance.registerVoter(accounts[2], {from: owner});
            //let voter2 = await this.votingInstance.getVoter(accounts[2]);

            await this.votingInstance.registerVoter(voter, {from: owner});
            await this.votingInstance.startProposalRegistrationSession();

            await this.votingInstance.registerProposal("Eating!!", {from: voter});
            await expectRevert(this.votingInstance.registerProposal("Eating!!", {from: voter}),
                "This proposal is already present!");
        });

        it('12. Registers proposals', async function() {

            await this.votingInstance.registerVoter(owner, {from:owner});
            await this.votingInstance.registerVoter(voter, {from:owner});
            await this.votingInstance.startProposalRegistrationSession();

            await this.votingInstance.registerProposal("swimming", {from: owner});
            await this.votingInstance.registerProposal("reading", {from: voter});

            let proposals = await this.votingInstance.getProposals();

            expect(proposals[0].description).to.equal("swimming");
            expect(proposals[1].description).to.equal("reading");

        });

        it('13. Sends an event when a proposal is registered', async function() {

            await this.votingInstance.registerVoter(voter, {from: owner});
            await this.votingInstance.startProposalRegistrationSession();

            expectEvent( await this.votingInstance.registerProposal("sunday hacking", {from: voter}),
                "ProposalRegistered", {proposalId: new BN(0)});

        });

    })


})
