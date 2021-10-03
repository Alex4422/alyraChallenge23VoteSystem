import  React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

import Whitelist from "./contracts/Whitelist.json";
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

            //get the instance of the smart contract "Whitelist" with web3 and the informations of deployed file (client/src/contracts/Whitelist.json)
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Whitelist.networks[networkId];

            const instance = new web3.eth.Contract(
                Whitelist.abi,
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
        const { accounts, contract } = this.state;

        //Get the authorised account list
        const whitelist = await contract.methods.getAddresses().call();

        //update the state
        this.setState({whitelist: whitelist});
    };

    /**
     *
     * @returns {Promise<void>}
     */
    whitelist = async() => {
        const { accounts, contract} = this.state;
        const address = this.address.value;

        //Interaction with the smart contract to add an account
        await contract.methods.whitelist(address).send({from: accounts[0]});

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
                Hi, this is Alex!







            </div>


        )


    }

}

export default App;