import { useEffect, useState } from "react";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import abi from "../lib/abi.json";
import Head from "next/head";
import "../styles/global.css";

const TEA_SEPOLIA_CHAIN_ID = "0xaa37dc";

const switchToTeaSepolia = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TEA_SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: TEA_SEPOLIA_CHAIN_ID,
              chainName: "Tea Sepolia",
              rpcUrls: ["https://tea-sepolia.g.alchemy.com/v2/0qiY9LelIcif8b0uECA5nFbWeTDvsU3t"],
              nativeCurrency: {
                name: "TEA",
                symbol: "TEA",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.explorer.tea.xyz"],
            },
          ],
        });
      } catch (addError) {
        alert("❌ ไม่สามารถเพิ่ม Tea Sepolia Network ได้");
      }
    } else {
      alert("❌ กรุณาเปลี่ยน network เป็น Tea Sepolia ก่อน");
    }
  }
};

const contractAddress = "0x5f81F2fbdE2B89BA0bF9c0C4d6CC15e83B08B686";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [clicksToday, setClicksToday] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyStats, setDailyStats] = useState("15 clicks");
  const [monthlyStats, setMonthlyStats] = useState("400 clicks");

  useEffect(() => {
    if (provider && signer) {
      const instance = new ethers.Contract(contractAddress, abi, signer);
      setContract(instance);
      fetchClickCount(instance);
      fetchLeaderboard();
    }
  }, [provider, signer]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      const walletConnect = new WalletConnectProvider({
        rpc: { 11155420: "https://tea-sepolia.g.alchemy.com/v2/0qiY9LelIcif8b0uECA5nFbWeTDvsU3t" },
        chainId: 11155420
      });
      await walletConnect.enable();
      const wcProvider = new ethers.providers.Web3Provider(walletConnect);
      const wcSigner = wcProvider.getSigner();
      setProvider(wcProvider);
      setSigner(wcSigner);
    } else {
      await switchToTeaSepolia();
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const signer = web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(signer);
    }
  };

  const handleClick = async () => {
    if (!contract) return;
    const tx = await contract.click();
    await tx.wait();
    fetchClickCount(contract);
    alert("✅ Click สำเร็จแล้ว!");
  };

  const fetchClickCount = async (contractInstance) => {
    const count = await contractInstance.getTodayClickCount();
    setClicksToday(count.toNumber());
  };

  const fetchLeaderboard = () => {
    setLeaderboard([
      { address: "0x123...abc", clicks: 50 },
      { address: "0x456...def", clicks: 30 },
      { address: "0x789...ghi", clicks: 20 },
    ]);
  };

  return (
    <>
      <Head>
        <title>TeaClick</title>
      </Head>
      <main className="container">
        <h1>🫖 TeaClick</h1>
        <button onClick={connectWallet}>Connect Wallet</button>
        <button onClick={handleClick}>Click!</button>
        <p>Today's Clicks: {clicksToday}</p>

        <h3>📊 Leaderboard</h3>
        <ul>
          {leaderboard.map((entry, idx) => (
            <li key={idx}>
              {entry.address} — {entry.clicks} clicks
            </li>
          ))}
        </ul>

        <h3>📆 Stats</h3>
        <p>🗓️ Daily: {dailyStats}</p>
        <p>📅 Monthly: {monthlyStats}</p>
      </main>
    </>
  );
}
