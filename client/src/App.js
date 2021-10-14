import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import Web3 from "web3";
import "./App.css";


class App extends Component {

    //initialisations
    state = { web3: null, accounts: null, contract: null,
        formError: null,formAddress: null, formProposal: null, ownerOfVotes: null,
        workflowStatusNum: 0, whitelist: [], proposals: [], winningProposalID: null};

    /**
     * name: componentDidMount
     * description: initialisation of the application (get the smart contract etc.)
     * @returns {Promise<void>}
     */
    componentDidMount = async () => {

        try {

            //get the web3 provider
            const web3 = await getWeb3();

            //using of web3 to get the accounts of the user (in metamask)
            const accounts = await web3.eth.getAccounts();

            //get the instance of the smart contract "Voting" with web3 and the informations of deployed file (client/src/contracts/Voting.json)
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Voting.networks[networkId];

            const instance = new web3.eth.Contract(
                Voting.abi,
                deployedNetwork && deployedNetwork.address,
            );



            // To avoid the problem of switch accounts in order to refresh the screen
            // related to the account where I am
            window.ethereum.on('accountsChanged', (accounts) => {

                this.setState({accounts});

            });

            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({web3, accounts, contract: instance}, this.runInit);
        } catch (error) {
            // Catch any errors for any of the above operations
            alert(
                `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`,
            );
            console.error(error);
        }
    };

    /**
     * name: runInit
     * description: used to start the application, to set the events, do the call etc.
     * @returns {Promise<void>}
     */
    runInit = async() => {
        const {contract} = this.state;

        //Get the authorised account list
        const whitelist = await contract.methods.getAddresses().call();

        //Get the different proposals written at the first launch of the website and at
        //the refresh of the page
        const proposals = await contract.methods.getProposals().call();

        //Get the winning proposal ID
        const winningProposalID = await contract.methods.getWinningProposalID().call();

        //Get the workflow status
        const workflowStatusNum = parseInt(await contract.methods.getStatusOfWorkflow().call());
        console.log('workflowStatusNum: ', workflowStatusNum);
        let ownerOfVotes = Web3.utils.toChecksumAddress(await contract.methods.getOwnerOfVotes().call());
        console.log('Checksum of ownerOfVotes: ', ownerOfVotes);

        //update the state
        this.setState({whitelist, ownerOfVotes, workflowStatusNum, proposals, winningProposalID} );

        //List of the different events defined in the smart contract Voting & application for the DAPP
        //the voter is registered
        contract.events.VoterRegistered().on('data', (event) => this.eventVoterRegistered(event)).on('error', console.error);

        //the workflow status is changed
        contract.events.WorkflowStatusChange().on('data', (event) => this.eventWorkflowStatusChange(event)).on('error', console.error);

        //the proposal is registered
        contract.events.ProposalRegistered().on('data', (event) => this.eventProposalRegistered(event)).on('error', console.error);

        //the vote is registered
        contract.events.Voted().on('data', (event) => this.eventProposalVoted(event)).on('error', console.error);

    }

    /**
     * name: eventVoterRegistered
     * description: manages the information of the list of the registered users in the smart contract
     * @param event
     * @returns {Promise<void>}
     */
    eventVoterRegistered = async (event) => {
        const { contract } = this.state;
        //1 method
        //const updatedWhitelist = whitelist;
        //updatedWhitelist.push(event.returnValues[0]);

        //2e method
        const updatedWhitelist = await contract.methods.getAddresses().call();
        this.setState({ whitelist: updatedWhitelist });
    }

    /**
     * name: RegisterVoter
     * description: registers the voters
     * @param event
     * @returns {Promise<void>}
     */
    RegisterVoter = async(event) => {

        event.preventDefault();
        const { accounts, contract } = this.state;
        const address = this.state.formAddress;

        try {
            this.setState({ formError: null });
            //We use the registerVoter method defined in the smart contract
            await contract.methods.registerVoter(address).send({from: accounts[0]});
        } catch (error){
            console.error(error.message);
            this.setState({formError: error.message});
        }
    }

    /**
     * name: eventWorkflowStatusChange
     * description: allows to move in the different states of the workflow defined in Voting.sol
     * @param event
     * @returns {Promise<void>}
     */
    eventWorkflowStatusChange = async (event) => {
        const { contract } = this.state;

        const updatedworkflowStatusNum = parseInt(await contract.methods.getStatusOfWorkflow().call());
        this.setState({ workflowStatusNum: updatedworkflowStatusNum });

        //const newWorkflowStatusNum = parseInt(workflowStatusNum) + 1;
        //this.setState({workflowStatusNum: parseInt(newWorkflowStatusNum)});
    }

    /**
     * name: getStatusOfWorkflow
     * description: get the number of status of the workflow where I am
     * @param event
     * @returns {Promise<void>}
     */
    getStatusOfWorkflow = async (event) => {

        const { contract } = this.state;

        const workflowStatus = await contract.methods.getStatusOfWorkflow().call();
        console.log('The current status of the workflow is: ', workflowStatus);
    }

    /**
     * name: checkEventProposalsRegistrationStarted
     * description: starts the step, in the workflow, to register the proposals for the voters
     * @param event
     * @returns {Promise<void>}
     */
    startProposalsRegistrationSession = async() => {

        const { accounts, contract } = this.state;
        await contract.methods.startProposalRegistrationSession().send({from: accounts[0]});
    }

    /**
     * name: eventProposalRegistered
     * description: manages the information of the list of the registered proposals in the smart contract
     * @param event
     * @returns {Promise<void>}
     */
    eventProposalRegistered = async(event) => {

        const {contract} = this.state;
        //2e method
        // retrieve the list of the registered proposals
        const updatedProposals = await contract.methods.getProposals().call();

        this.setState({proposals: updatedProposals});
    }

    /**
     * name: registerANewProposal
     * description: allows to register a new proposal
     * @returns {Promise<void>}
     */
    registerANewProposal = async(event) => {

        //event.preventDefault();
        const { accounts, contract  } = this.state;

        const yourProposal = this.state.formProposal;

        try{
            this.setState({formError:null});
            //We use the registerProposal method defined in the smart contract
            await contract.methods.registerProposal(yourProposal).send({from:accounts[0]});
            //this.setState({formProposal:null});
        }catch (error){
            console.error(error.message);
            this.setState({formError:error.message});
        }

    }

    /**
     * name: endProposalsRegistrationSession
     * description: run the function of the smart contract which allows to close the
     * registration of the proposals
     * @param event
     * @returns {Promise<void>}
     */
    endProposalsRegistrationSession = async() => {

        const { accounts, contract } = this.state;
        await contract.methods.endProposalRegistrationSession().send({from: accounts[0]});
    }

    /**
     * name: startVotingSession
     * description: allows to start the session of proposals voting
     * @returns {Promise<void>}
     */
    startVotingSession = async() => {

        const { accounts, contract } = this.state;
        await contract.methods.startVotingSession().send({from:accounts[0]});
    }

    /**
     * name: eventProposalVoted
     * description: allows to update the proposals voted in the list
     * @param event
     * @returns {Promise<void>}
     */
    eventProposalVoted = async(event) => {

        const { proposals, contract } = this.state;

        let updatedProposals = proposals;
        updatedProposals[event.returnValues[1]].voteCount = parseInt(updatedProposals[event.returnValues[1]].voteCount);

        updatedProposals = await contract.methods.getProposals().call();
        console.log('This updatedProposals was voted :', updatedProposals);

        this.setState({proposals: updatedProposals});
    }

    /**
     * name: registerVotes
     * description: allows to register a vote for the proposal chosen by the voter
     * @returns {Promise<void>}
     */
    registerVotes = async() => {

        const { accounts, contract} = this.state;

        const vote = parseInt(this.state.formVote);

        try {
            this.setState({formError: null});
            await contract.methods.doTheVote(vote).send({from: accounts[0]});
        } catch (error) {
            console.error(error.message);
            this.setState({ formError: error.message });
        }

    }

    /**
     * name: endSessionVotes
     * description: allows the admin to close the session of votes
     * @returns {Promise<void>}
     */
    endSessionVotes = async () => {

        const { accounts, contract } = this.state;
        await contract.methods.endVotingSession().send({from:accounts[0]});
    }

    /**
     * name: beginTallySession
     * description: allows the administrator to begin the session to tally the votes
     * @returns {Promise<void>}
     */
    beginTallySession = async () => {

        const { accounts, contract } = this.state;
        await contract.methods.tallyVotesSession().send({from: accounts[0]});
    }

    /**
     * name: getWinningProposalID
     * description: allows to get the ID of winning proposal
     * @returns {Promise<void>}
     */
    getWinningProposalID = async() => {

        const { contract } = this.state;
        const winningProposalID = await contract.methods.getWinningProposalID().call();
        this.setState(winningProposalID);
    }

    //************************ render ************************
    render(){
        const { accounts, whitelist, proposals, formError, ownerOfVotes, winningProposalID } = this.state;
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }

        //************************ header ************************
        let header =
            <div className="App">
                <div>
                    <h2 className="text-center">Welcome to the voting system DAPP!</h2>

                    <hr></hr>
                    <br></br>
                </div>

                <br></br>
                <br></br>
            </div>;

        //************************ definition of forbidden operations area ************************
        let forbiddenOperationsArea =
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <h1>Operation forbidden because you are not the admin of the voting system!</h1>
            </div>

        let cSAccounts0 = Web3.utils.toChecksumAddress(accounts[0]);


        //************************ logic of the display  ************************
        switch(this.state.workflowStatusNum) {

            //We register the voters
            case 0:
                if (cSAccounts0 === ownerOfVotes) {

                    return (

                        <div>
                            {header}

                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>List of authorised accounts</strong></Card.Header>
                                    <Card.Body>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item >
                                                <Table striped bordered hover>
                                                    <thead>
                                                    <tr>
                                                        <th>@</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                        {whitelist.map((a,index) => <tr key={index}>
                                                            <td>{a}</td>
                                                        </tr>)
                                                        }
                                                    </tbody>
                                                </Table>
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card.Body>
                                </Card>

                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>Authorise a new account</strong></Card.Header>
                                    <Card.Body>
                                        <Form.Group  >

                                            <Form.Control placeholder="Enter Address please " isInvalid={Boolean(formError)} onChange={e => this.setState({ formAddress: e.target.value, formError: null })} type="text" id="address"
                                            />

                                        </Form.Group>

                                        <br/>
                                        <div style={{display: 'flex', justifyContent: 'center'}}>

                                            <Button style={{minWidth:'350px'}} onClick={this.RegisterVoter} variant="dark"> Authorise </Button>

                                        </div>

                                    </Card.Body>
                                </Card>

                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>Your role: admin </strong></Card.Header>

                                    <Card.Body>
                                        <div style={{display: 'flex', justifyContent: 'center' }}>
                                            <Button style={{minWidth:'350px'}} onClick={this.startProposalsRegistrationSession} variant="danger"> Start the session of
                                                registration of proposals </Button>
                                        </div>

                                        <br/>

                                        <div style={{display: 'flex', justifyContent: 'center'}} >
                                            <Button style={{minWidth:'350px'}} onClick={this.getStatusOfWorkflow} variant="info"> Get the status of the workflow (console) </Button>
                                        </div>

                                    </Card.Body>

                                </Card>

                            </div>

                        </div>

                    )

                } else {
                    return (
                        <div>
                            {header}
                            {forbiddenOperationsArea}
                        </div>
                    )
                }
                break;

            //We start to register the proposals
            case 1:

                    return (
                        <div>
                            {header}

                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>List of the proposals:</strong></Card.Header>
                                    <Card.Body>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item >
                                                <Table striped bordered hover>
                                                    <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Description</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                        {proposals !== null && proposals.map((a, index) =>
                                                            <tr key={index}>
                                                                <td>{index}</td>
                                                                <td>{a.description}</td>
                                                            </tr>)
                                                        }
                                                    </tbody>
                                                </Table>
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card.Body>
                                </Card>

                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>Write your proposal:</strong></Card.Header>
                                    <Card.Body>
                                        <Form.Group  >

                                            <Form.Control placeholder="Your proposal please " isInvalid={Boolean(formError)} onChange={e => this.setState({ formProposal: e.target.value, formError: null })} type="text" id="proposal"
                                            />

                                        </Form.Group>

                                        <br/>
                                        <div style={{display: 'flex', justifyContent: 'center'}}>

                                            <Button style={{minWidth:'350px'}} onClick={this.registerANewProposal} variant="dark"> Submit this one! </Button>

                                        </div>

                                    </Card.Body>
                                </Card>

                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>Your role: admin </strong></Card.Header>

                                    <Card.Body>
                                        <div style={{display: 'flex', justifyContent: 'center'}}>
                                            <Button style={{minWidth:'350px'}} onClick={this.endProposalsRegistrationSession} variant="danger"> End the session of
                                                registration of proposals </Button>
                                        </div>

                                        <br/>

                                        <div style={{display: 'flex', justifyContent: 'center'}}>
                                            <Button style={{minWidth:'350px'}} onClick={this.getStatusOfWorkflow} variant="info"> Get the status of the workflow (console) </Button>
                                        </div>

                                    </Card.Body>

                                </Card>

                            </div>
                        </div>
                    )
                break;

            //The admin could start the session of proposal voting
            case 2:

                if (cSAccounts0 === ownerOfVotes) {

                    return (
                        <div>
                            {header}

                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{minWidth:'350px'}} onClick={this.startVotingSession} variant="secondary"> Begin the votes of the proposals! </Button>
                            </div>
                            <br/>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{minWidth:'350px'}} onClick={this.getStatusOfWorkflow} variant="info"> Get the status of the workflow (console) </Button>
                            </div>
                        </div>
                    )
                } else {
                    return (
                        <div>
                            {header}
                            {forbiddenOperationsArea}
                        </div>
                    )
                }
                break;

            //We vote the different proposals written by the voters
            case 3:

                    return (
                        <div>
                            {header}

                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center"><strong>List of registered proposals</strong></Card.Header>
                                    <Card.Body>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item>
                                                <Table striped bordered hover>
                                                    <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>proposal(s)</th>
                                                        <th>Number of votes for this one: </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>

                                                       {proposals !== null && proposals.map((a, index) =>
                                                           <tr key={index}>
                                                               <td>{index}</td>
                                                               <td>{a.description}</td>
                                                               <td>{a.voteCount}</td>
                                                           </tr>)
                                                       }

                                                    </tbody>
                                                </Table>
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card.Body>
                                </Card>

                                <Card style={{width: '50rem',justifyContent: 'center'}}>
                                    <Card.Header className="text-center"><strong>Vote for your favorite proposal, please</strong></Card.Header>
                                    <Card.Body >

                                        <Form.Group>
                                            <Form.Control defaultValue={'Default'} as="select" onChange={e => this.setState({ formVote: e.target.value })}>
                                                <option value="Default" disabled hidden ></option>
                                                    { proposals !== null && proposals.map((a, index) =>
                                                        <option key={index} value={index}>
                                                            {a.description}
                                                        </option>)
                                                    }
                                            </Form.Control>

                                            <br/>
                                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                                <Button style={{minWidth:'350px'}} variant="primary" onClick={this.registerVotes}>Vote this one!</Button>
                                            </div>
                                        </Form.Group>

                                        <br/>

                                    </Card.Body>
                                </Card>

                                <Card style={{width: '50rem'}}>
                                    <Card.Header className="text-center" ><strong>Your role: admin </strong> </Card.Header>

                                    <Card.Body >
                                        <div style={{display: 'flex', justifyContent: 'center'}}>
                                            <Button style={{minWidth:'350px'}} onClick={this.endSessionVotes} variant="danger"> Close the session of votes </Button>
                                        </div>
                                        <br/>

                                        <div style={{display: 'flex', justifyContent: 'center'}}>
                                            <Button style={{minWidth:'350px'}} onClick={this.getStatusOfWorkflow} variant="info"> Get the status of the workflow (console) </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        </div>
                    )

              break;

            //The admin could begin the tally session
            case 4:

                if (cSAccounts0 === ownerOfVotes) {

                    return (
                        <div>
                            {header}

                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{minWidth:'350px'}} onClick={this.beginTallySession} variant="success"> Begin the tally session </Button>
                            </div>
                            <br/>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{minWidth:'350px'}} onClick={this.getStatusOfWorkflow} variant="info"> Get the status of the workflow (console) </Button>
                            </div>
                        </div>
                    )


                } else {
                    return (
                        <div>
                            {header}
                            {forbiddenOperationsArea}
                        </div>
                    )
                }
                break;

            //We can consult, now, for every voters, the winning proposal
            case 5:

                return (
                    <div>
                        {header}

                        <div style={{display: 'flex', justifyContent: 'center'}}>
                            <Card style={{width: '50rem'}}>
                                <Card.Header className="text-center"><strong>List of registered proposals</strong></Card.Header>
                                <Card.Body>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item>
                                            <Table striped bordered hover>
                                                <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>proposal(s)</th>
                                                    <th>Number of votes for this one: </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                    {/* list all the proposals from the smart contract */}
                                                    { proposals !== null && proposals.map((key, index) =>
                                                        <tr key={index}>
                                                            <td>{index}</td>
                                                            <td>{key.description}</td>
                                                            <td>{key.voteCount}</td>
                                                        </tr>
                                                    )}

                                                </tbody>
                                            </Table>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                            </Card>

                            <Card style={{width: '50rem',justifyContent: 'center'}}>
                                <Card.Header className="text-center"><strong>The winning proposal is:</strong></Card.Header>
                                <Card.Body >

                                    <Form.Group>

                                        <br/>
                                        <div style={{display: 'flex', justifyContent: 'center'}}>
                                            <h3>{proposals[winningProposalID].description}</h3>
                                        </div>
                                    </Form.Group>
                                    <br/>

                                </Card.Body>
                            </Card>

                            <Card style={{width: '50rem'}}>
                                <Card.Header className="text-center" ><strong>Your role: admin </strong> </Card.Header>

                                <Card.Body >

                                    <div style={{display: 'flex', justifyContent: 'center'}}>
                                        <Button onClick={this.getStatusOfWorkflow} variant="info"> Get the status of the workflow (console) </Button>
                                    </div>

                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                )
            default:
                return(<div><h1>The application doesn't seem to work well!</h1></div>);


        }//end of switch
    }//end of the render


}//end of the class App

export default App;

