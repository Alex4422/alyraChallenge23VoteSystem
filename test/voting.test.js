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
     * Management of the voter zone
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

        it('4. Reverts registering voter if the voter is already registered', async function() {

            await this.votingInstance.registerVoter(accounts[1], {from: owner});
            await expectRevert(this.votingInstance.registerVoter(accounts[1], {from:owner}),
                "The voter is already registered");
        });

        it('5. Reverts registering if it is the wrong status of workflow', async function()  {
            await this.votingInstance.startProposalRegistrationSession();
            await expectRevert(this.votingInstance.registerVoter(accounts[1],{from:owner}),
                "This workflow status is not the one expected");
        });
    })

    /**
     *  Management of the workflow zone
     */
    describe('B. Management of the status of the workflow', function() {

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
    describe('C. Registering of the proposals', function() {

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
        });

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

        it('14. Reverts if we have less than two proposals', async function() {

            await this.votingInstance.registerVoter(owner, {from: owner});
            await this.votingInstance.startProposalRegistrationSession();
            await this.votingInstance.registerProposal("footing");

            await expectRevert(this.votingInstance.endProposalRegistrationSession({from:owner}),
                "We need more proposals please! You have to type at least two.");
        });

        it('15. Ends registered proposal session', async function(){

            await this.votingInstance.registerVoter(voter2, {from: owner});
            await this.votingInstance.startProposalRegistrationSession();
            await this.votingInstance.registerProposal("swimming", {from: voter2});
            await this.votingInstance.registerProposal("reading", {from: voter2});

            //test OK? (it passed), which one to choose, is it important? We can let the two
            expectEvent( await this.votingInstance.endProposalRegistrationSession({from:owner}),
                "ProposalsRegistrationEnded");

            //test OK? (it passed)
            //await this.votingInstance.endProposalRegistrationSession({from: owner});
            let workflowStatus = await this.votingInstance.getStatusOfWorkflow();
            expect(workflowStatus).to.be.bignumber.equal(new BN(2));
        });

        it('16. sends an event when you start and you finish proposal registration', async function() {

            await this.votingInstance.registerVoter(owner, {from: owner});
            await this.votingInstance.registerVoter(voter, {from: owner});
            expectEvent( await this.votingInstance.startProposalRegistrationSession({from: owner}),
                "ProposalsRegistrationStarted");

            await this.votingInstance.registerProposal("reading", {from: voter});
            await this.votingInstance.registerProposal("skating", {from: owner});

            expectEvent( await this.votingInstance.endProposalRegistrationSession({from: owner}),
             "ProposalsRegistrationEnded");
        });
    });

    /**
     * Registering of the votes zone
     */
    describe('D. Test of the registering process of the votes', function() {

        beforeEach( async function() {

            //make all the operations needed before
            await this.votingInstance.registerVoter(voter, {from: owner});
            await this.votingInstance.registerVoter(owner, {from: owner});
            await this.votingInstance.registerVoter(voter2, {from: owner});

            await this.votingInstance.startProposalRegistrationSession({from: owner});
            await this.votingInstance.registerProposal("hiking", {from: owner});
            await this.votingInstance.registerProposal("swimming", {from: voter});
            await this.votingInstance.registerProposal("biking", {from: voter2});
            await this.votingInstance.endProposalRegistrationSession({from: owner});
        });

        it('17. Reverts if the voter is not registered', async function() {

            await this.votingInstance.startVotingSession({from: owner});
            await expectRevert( this.votingInstance.doTheVote(new BN(0), {from:accounts[4]}),
            "This address (= this user) is not registered in the list");
        });

        it('18. Reverts if it is not the correct status of workflow', async function() {

            //await this.votingInstance.startProposalRegistrationSession({from: owner});
            //await expectRevert( this.votingInstance.doTheVote(new BN(0), {from: owner}),
             //  "This workflow status is not the one expected");

            await expectRevert(this.votingInstance.doTheVote(new BN(2),{from: owner}),
            "This workflow status is not the one expected");

        });

        it('19. Reverts if the voter has already voted', async function () {

            await this.votingInstance.startVotingSession({from: owner});
            await this.votingInstance.doTheVote(new BN(0), {from: voter});
            await expectRevert( this.votingInstance.doTheVote(new BN(0), {from: voter}),
                "The voter has already voted");
        });

        it('20. Sends an event when the session of voting is begun & this one ends', async function() {

            expectEvent(await this.votingInstance.startVotingSession({from: owner}),
                "VotingSessionStarted");
            await this.votingInstance.doTheVote(new BN(0), {from: voter2});
            expectEvent( await this.votingInstance.endVotingSession({from: owner}),
                "VotingSessionEnded");
        });

        it('21. Sends an event when a vote is registered', async function() {

            await this.votingInstance.startVotingSession({from: owner});
            expectEvent( await this.votingInstance.doTheVote(new BN(0), {from: voter}),
                "Voted",  {voter: voter, proposalId: new BN(0)});
        });

        it('22. Registers votes ', async function() {

            await this.votingInstance.startVotingSession({from: owner});

            let voterBeforeVoting = await this.votingInstance.getVoter(voter);
            let ownerBeforeVoting = await this.votingInstance.getVoter(owner);
            let voter2BeforeVoting = await this.votingInstance.getVoter(voter2);

            expect(voterBeforeVoting.hasVoted).to.equal(false);
            expect(ownerBeforeVoting.hasVoted).to.equal(false);
            expect(voter2BeforeVoting.hasVoted).to.equal(false);

            await this.votingInstance.doTheVote(new BN(1), {from: voter});
            await this.votingInstance.doTheVote(new BN(1), {from: owner});
            await this.votingInstance.doTheVote(new BN(0), {from: voter2});

            let voterAfterVoting = await this.votingInstance.getVoter(voter);
            let ownerAfterVoting = await this.votingInstance.getVoter(owner);
            let voter2AfterVoting = await this.votingInstance.getVoter(voter2)

            expect(voterAfterVoting.hasVoted).to.equal(true);
            expect(ownerAfterVoting.hasVoted).to.equal(true);
            expect(voter2AfterVoting.hasVoted).to.equal(true);

            let proposals = await this.votingInstance.getProposals();

            let voteProposal1 = proposals[new BN(1)].voteCount;
            let voteProposal0 = proposals[new BN(0)].voteCount;

            expect(voteProposal1).to.be.bignumber.equal(new BN(2));
            expect(voteProposal0).to.be.bignumber.equal(new BN(1));
        });

        it('23. Updates winningProposalID', async function() {

            await this.votingInstance.startVotingSession({from: owner});

            let winningProposalIDBefore = await this.votingInstance.getWinningProposalID();

            //the init of winningProposalIDBefore is at 0 (uint)
            expect(winningProposalIDBefore).to.be.bignumber.equal(new BN(0));

            await this.votingInstance.doTheVote(new BN(1), {from:owner});
            await this.votingInstance.doTheVote(new BN(1), {from:voter});
            await this.votingInstance.doTheVote(new BN(2), {from:voter2});

            let winningProposalIDAfter = await this.votingInstance.getWinningProposalID();

            expect(winningProposalIDAfter).to.be.bignumber.equal(new BN(1));
        });
    });

    /**
     *  Tally votes zone
     */
    describe('E. Tally the votes', function() {

        it('24. Reverts the tally operation if we are in the wrong workflow', async function() {

            //await this.votingInstance.startVotingSession({from:owner});
            //await this.votingInstance.endProposalRegistrationSession({from: owner});
            //await this.votingInstance.startProposalRegistrationSession({from: owner});
            await expectRevert( this.votingInstance.tallyVotesSession({from:owner}),
                "This workflow status is not the one expected");

        });

        it('25. Sends an event after the end of the voting session for the votes tallied', async function() {

            //make all the operations needed before
            await this.votingInstance.registerVoter(voter, {from: owner});
            await this.votingInstance.registerVoter(owner, {from: owner});
            await this.votingInstance.registerVoter(voter2, {from: owner});

            await this.votingInstance.startProposalRegistrationSession({from: owner});
            await this.votingInstance.registerProposal("hiking", {from: owner});
            await this.votingInstance.registerProposal("swimming", {from: voter});
            await this.votingInstance.registerProposal("biking", {from: voter2});
            await this.votingInstance.endProposalRegistrationSession({from: owner});

            await this.votingInstance.startVotingSession({from: owner});

            await this.votingInstance.doTheVote(new BN(1), {from: owner});
            await this.votingInstance.doTheVote(new BN(1), {from: voter});
            await this.votingInstance.doTheVote(new BN(0), {from: voter2});

            await this.votingInstance.endVotingSession({from:owner});

            expectEvent( await this.votingInstance.tallyVotesSession({from: owner}),
                "VotesTallied");
        });
    })

})
