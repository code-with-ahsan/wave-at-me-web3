import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import Loader from './Loader';
import * as confetti from 'canvas-confetti';
const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [showingConfetti, setShowingConfetti] = useState(false);
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const contractAddress = "0xC6e44c3506074A74b478fF22CF1A52652f1961c0";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const showConfetti = ({ethWon}) => {
    setShowingConfetti(true);
    alert(`You won! Congratulations! 🎉. You have got ${ethWon.toNumber()} ethers.`);
    setTimeout(() => {
      const myConfetti = confetti.create(
        document.querySelector('canvas'),
        { resize: true }
      );
      for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
          new Array(5).fill(0).map(() =>
            myConfetti({
              angle: random(60, 120),
              spread: random(10, 50),
              particleCount: random(40, 50),
              origin: {
                y: 0.6,
              },
            })
          );
        }, 750 * i);
      }
  
      setTimeout(() => {
        setShowingConfetti(false);
      }, 5000);
    }, 0);
  }

  const random = (min, max) => Math.random() * (max - min) + min

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          console.log(wave);
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            hasWon: wave.message,
            ethWon: wave.ethWon
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
        console.log('WHAT')
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      if (!message) {
        alert('Please write a message');
        return;
      }
      const { ethereum } = window;
      /**
       * Create a variable here that holds the contract address after you deploy!
       */
      if (ethereum) {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 10_000_00 })
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setMessage("");
        setIsLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setIsLoading(false);
      console.log(error)
    }
  }

  /**
 * Listen in for emitter events!
 */
useEffect(() => {
  let wavePortalContract;
  console.log('listening');
  const onNewWave = (from, timestamp, message, ethWon, hasWon) => {
    console.log("NewWave");
    console.log({
      from, timestamp, message, hasWon, ethWon
    });
    console.log('account', currentAccount);
    console.log('from', from);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message,
        hasWon,
        ethWon
      },
    ]);
    if (from.toLowerCase() === currentAccount.toLowerCase() && hasWon) {
      showConfetti({
        ethWon
      });
    }
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log('attaching listener')
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, [currentAccount]);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      {showingConfetti && <canvas className="canvas" id="canvas"/>}
      <div className="dataContainer">
        <h1 className="header">
          👋 Hey there!
        </h1>


        <div className="bio">
          I am <a
            target="_blank" rel="noopener noreferrer" href="https://twitter.com/codewith_ahsan">Ahsan</a> and I make the world a better place using Software. Connect your Ethereum wallet and wave at me!
        </div>

        {
          !isLoading ? <div id="inputContainer">
            <input id="msgInput" onChange={(e) => {
              setMessage(e.target.value);
            }} />
            <button className="waveButton" onClick={wave}>
              Wave at Me
          </button>
          </div> : <div className="loader">
              <div>
                <Loader />
              </div>
              <div>
                Transaction in progress...
          </div>
            </div>
        }

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <h3 style={{ marginBottom: 0 }}>Messages:</h3>

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={waveMessageBoxStyles}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

const waveMessageBoxStyles = {
  backgroundColor: "rgb(99, 102, 241)",
  color: 'white', marginTop: "16px", padding: "8px",
  borderRadius: "14px"
};

export default App