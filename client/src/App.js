import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";

class App extends Component {

    //initialisations
    state = { web3: null, accounts: null, contract: null, whitelist: null};

    /**
     *
     * @returns {Promise<void>}
     */
    componentWillMount = async () => {

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
     *
     * @returns {Promise<void>}
     */
    runInit = async() => {
        const {accounts, contract} = this.state;

        //Get the authorised account list
        const whitelist = await contract.methods.getAddresses().call();

        //update the state
        this.setState({whitelist: whitelist});
    }

    /**
     *
     * @returns {Promise<void>}
     */
    whitelist = async() => {
         const {accounts, contract} = this.state;
         const address = this.address.value;

         //Interaction with the smart contract to add an account
         await contract.methods.registerVoter(address).send({from: accounts[0]});

         //get the list of authorised account list
         this.runInit();
    }


    render(){
        const { whitelist } = this.state;
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }

        return (

            <div className="App">

                <div>
                    <h2 className="text-center">Welcome to the voting system DAPP!</h2>
                    <hr></hr>
                    <br></br>
                </div>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Card style={{ width: '50rem' }}>
                        <Card.Header><strong>List of the authorised accounts</strong></Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                <ListGroup.Item>
                                    <Table striped bordered hover>
                                        <thead>
                                        <tr>
                                            <th>@</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {whitelist !== null &&
                                        whitelist.map((a) => <tr><td>{a}</td></tr>)
                                        }
                                        </tbody>
                                    </Table>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </div>
                <br></br>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Card style={{ width: '50rem' }}>
                        <Card.Header><strong>Authorise a new account</strong></Card.Header>
                        <Card.Body>
                            <Form.Group >
                                <Form.Control type="text" id="address"
                                              ref={(input) => { this.address = input }}
                                />
                            </Form.Group>
                            <Button onClick={ this.whitelist } variant="dark" > Authorise </Button>
                        </Card.Body>
                    </Card>
                </div>
                <br></br>

            </div>
        )
    }
}

export default App;