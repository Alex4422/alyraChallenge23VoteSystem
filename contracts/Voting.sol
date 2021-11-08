// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting
 * @author Alex
 * @notice allows to manage a system of voting
 * @dev uses the smart contract of Open Zeppelin
 */
contract Voting is Ownable{

    //structures
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    //enums
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    //======== state variables ========

    //the proposal which has the more votes
    uint public winningProposalID;
    //the variable status contains the state of the workflow where I am!
    WorkflowStatus status = WorkflowStatus.RegisteringVoters;
    //The address of the admin of the contract
    address public ownerOfVotes;

    //======== mappings ========
    mapping (address => Voter) public voters;
    mapping (string => Proposal) public proposal;
    mapping (string => bool) private presentProposal;

    //======== arrays ========
    address[] public addresses;
    Proposal[] public proposals;

    //======== events ========
    event VoterRegistered(address voterAddress);
    event ProposalsRegistrationStarted();
    event ProposalsRegistrationEnded();
    event ProposalRegistered(uint proposalId);
    event VotingSessionStarted();
    event VotingSessionEnded();
    event Voted (address voter, uint proposalId);
    event VotesTallied();
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus
    newStatus);

    //======== modifiers ========
    //With this modifier, only the registered users have the right to do the action
    modifier onlyRegistered(address _address){
        require(voters[_address].isRegistered == true, "This address (= this user) is not registered in the list");
        _;
    }

    //This modifier serves to compare the current state of workflow with the workflow status expected
    modifier isRightWorkflowStatus(WorkflowStatus _expectedStatus){
        require(status == _expectedStatus,'This workflow status is not the one expected');
        _;
    }

    /*
       title constructor
       @notice constructor which initialises the state variables of the contract
    */
    constructor() public{
        ownerOfVotes = msg.sender;
    }

    //======== Helper functions ========

    /**
     *   title: getAddresses
     *   @notice gives the different addresses of the whitelist
     *   @return list of addresses
     */
    function getAddresses() public view returns(address[] memory){
        return addresses;
    }

    /**
     *  title getProposals
     *  @notice returns the full proposals with an array of Proposal
     *  @return the array of proposals
     */
    function getProposals() public view returns(Proposal[] memory){
        return proposals;
    }

    /**
     * title: getStatusOfWorkflow
     * @notice gives the current status of the workflow
     * @return status of the workflow
     */
    function getStatusOfWorkflow() public view returns (WorkflowStatus){
        return status;
    }

    /**
     * title: changeWorkflowStatus
     * @notice Changes the current status of the workflow to a new one following the progression in
        the web application
     * @param newWorkflowStatus the next status in the list of enum
     */
    function changeWorkflowStatus(WorkflowStatus newWorkflowStatus) internal {
        emit WorkflowStatusChange(status, newWorkflowStatus);
        status = newWorkflowStatus;
    }

    /**
        title getVoter
        @param _address address of the voter
        @return the voter related to the address given in parameter
    */
    function getVoter(address _address) public view returns(Voter memory) {
        return voters[_address];
    }

    /**
     *  title getProposalDescriptionN
     *  @notice gives only one proposal identified by its number
     *  @return the description of proposal
     */
    function getProposalDescriptionN(uint256 proposalNumero) public view returns(string memory){
        return proposals[proposalNumero].description;
    }

    /**
     * title: getOwnerOfVotes
     * @notice gives the owner of the votes
     * @return address of owner of the contract
     */
    function getOwnerOfVotes() public view returns (address){
        return ownerOfVotes;
    }

    //======== functions asked ========

    /**
     * title: registerVoter
     * @notice registers a voter in a whitelist - The voting administrator registers a white list of
     *  voters identified by their Ethereum address.
     * @dev Check if we are at the correct status at the beginning of the function
     */
    function registerVoter(address _voterAddress) public onlyOwner isRightWorkflowStatus(WorkflowStatus.RegisteringVoters){

        require(voters[_voterAddress].isRegistered == false,'The voter is already registered');
        addresses.push(_voterAddress);
        voters[_voterAddress].isRegistered = true;

        emit VoterRegistered(_voterAddress);
    }

    /**
     * title: startProposalRegistrationSession
     * @notice starts a new session of Registration proposal. The voting administrator begins the
     *  proposal registration session.
     */
    function startProposalRegistrationSession() public onlyOwner isRightWorkflowStatus(WorkflowStatus.RegisteringVoters){

        status = WorkflowStatus.ProposalsRegistrationStarted;

        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, status);
        emit ProposalsRegistrationStarted();
    }

    /**
     *  title: registerProposal
     *  @notice Registered voters are allowed to register their proposals (only !!) while the
     *   registration session is active.
     *  @param _proposal The new proposal typed by the voter
     */
    function registerProposal(string memory _proposal) public isRightWorkflowStatus(WorkflowStatus.ProposalsRegistrationStarted) onlyRegistered(msg.sender){

        require(bytes(_proposal).length > 0,"Type, at least, one character please!");
        require(!presentProposal[_proposal],"This proposal is already present!");

        proposals.push(Proposal(_proposal, 0));
        presentProposal[_proposal] = true;

        emit ProposalRegistered(proposals.length - 1);
    }

    /**
     *   title: endProposalRegistrationSession
     *   @notice end a session of registration of a new proposal - The voting
     *   administrator closes the proposal registration session.
     */
    function endProposalRegistrationSession() public onlyOwner isRightWorkflowStatus(WorkflowStatus.ProposalsRegistrationStarted){

        require(proposals.length > 1, "We need more proposals please! You have to type at least two.");
        status = WorkflowStatus.ProposalsRegistrationEnded;

        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, status);
        emit ProposalsRegistrationEnded();

    }

    /**
     *   title: VotingSessionStarted
     *   @notice The voting administrator starts the voting session
     */
    function startVotingSession() public onlyOwner isRightWorkflowStatus(WorkflowStatus.ProposalsRegistrationEnded){

        status = WorkflowStatus.VotingSessionStarted;

        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, status);
        emit VotingSessionStarted();
    }

    /**
     *   title: doTheVote
     *   @notice increments the voteCount of 1 for the proposal voted by the registered person
     *   @param _proposalId the ID of the proposal
     */
    function doTheVote(uint _proposalId) external isRightWorkflowStatus(WorkflowStatus.VotingSessionStarted) onlyRegistered(msg.sender){

        require(voters[msg.sender].hasVoted == false, "The voter has already voted");

        voters[msg.sender].votedProposalId = _proposalId;
        proposals[_proposalId].voteCount++;
        voters[msg.sender].hasVoted = true;

        if (proposals[_proposalId].voteCount > proposals[winningProposalID].voteCount){
            winningProposalID = _proposalId;
        }

        emit Voted(msg.sender,_proposalId);
    }

    /**
     *   title: endVotingSession
     *   @notice closes the session of vote
     */
    function endVotingSession() public onlyOwner isRightWorkflowStatus(WorkflowStatus.VotingSessionStarted){

        status = WorkflowStatus.VotingSessionEnded;

        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, status);
        emit VotingSessionEnded();
    }

    /**
     *   title: TallyVotesSession
     *   @notice Begins the session to tally the votes by the owner
     */
    function tallyVotesSession() public onlyOwner isRightWorkflowStatus(WorkflowStatus.VotingSessionEnded){

        status = WorkflowStatus.VotesTallied;

        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, status);
        emit VotesTallied();
    }

    /**
     *   title: getWinningProposalId
     *   @notice selects the winning proposal
     *   @return winningProposalID the winning proposal
     */
    function getWinningProposalID() public view returns(uint){
        return winningProposalID;
    }

}
