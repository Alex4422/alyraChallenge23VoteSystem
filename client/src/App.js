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
    state = { web3: null, accounts: null, contract: null, whitelist: [],
        formAddress: null, ownerOfVotes: null, workflowStatusNum: 0};

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
        const {accounts, contract} = this.state;

        //Get the authorised account list
        const whitelist = await contract.methods.getAddresses().call();
        const ownerOfVotes = Web3.utils.toChecksumAddress(await contract.methods.getOwnerOfVotes().call());

        console.log('Checksum of ownerOfVotes: ', ownerOfVotes);

        //update the state
        this.setState({whitelist, ownerOfVotes} );

        //List of the different events defined in the smart contract Voting & application for the DAPP
        contract.events.VoterRegistered().on('data', (event) => this.checkEventVoterRegistered(event)).on('error', console.error);
        contract.events.WorkflowStatusChange().on('data', (event) => this.checkEventWorkflowStatusChange(event)).on('error', console.error);
    }

    /**
     * name: checkEventVoterRegistered
     * description: manages the information of the list of the registered users in the smart contract
     * @param event
     * @returns {Promise<void>}
     */
    checkEventVoterRegistered = async (event) => {
        const { whitelist } = this.state;
        const updatedWhitelist = whitelist;
        updatedWhitelist.push(event.returnValues[0]);
        this.setState({ whitelist: updatedWhitelist });
    }

    /**
     * name: checkVoterRegistered
     * description: registers the voters
     * @param event
     * @returns {Promise<void>}
     */
    checkVoterRegistered = async(event) => {
        event.preventDefault();
        const {accounts,contract} = this.state;
        const address = this.state.formAddress;
        try {
            this.setState({formError: null});
            //We use the registerVoter method defined in the smart contract
            await contract.methods.registerVoter(address).send({from: accounts[0]});
            //this.setState({formAddress: null});
        } catch (error){
            this.setState({formError: error.message});
        }
    }

    /**
     * name: checkEventWorkflowStatusChange
     * description: allows to move in the different states of the workflow defined in Voting.sol
     * @param event
     * @returns {Promise<void>}
     */
    checkEventWorkflowStatusChange = async (event) => {
        const { workflowStatusNum } = this.state;
        const newWorkflowStatusNum = parseInt(workflowStatusNum) + 1;
        this.setState({workflowStatusNum: parseInt(newWorkflowStatusNum)});
    }



    //************************ render ************************
    render(){
        const { accounts, whitelist, formError, ownerOfVotes, workflowStatusNum } = this.state;
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

                if (cSAccounts0 === ownerOfVotes) {

                    return (
                        <div>
                            {header}
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

            //We will start the session of proposal voting
            case 2:

                if (cSAccounts0 === ownerOfVotes) {

                    return (
                        <div>
                            {header}
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

                if (cSAccounts0 === ownerOfVotes) {

                    return (
                        <div>
                            {header}
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

            //We will begin the tally session
            case 4:

                if (cSAccounts0 === ownerOfVotes) {

                    return (
                        <div>
                            {header}
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
                        </div>
                    )
            default:
                return(<div><h1>The application doesn't seem to work well!</h1></div>);


        }//end of switch
    }//end of the render


}//end of the class App

export default App;