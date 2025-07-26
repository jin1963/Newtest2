let web3, account, contract, usdt;

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    contract = new web3.eth.Contract(contractABI, contractAddress);
    usdt = new web3.eth.Contract(usdtABI, usdtAddress);
    document.getElementById("walletAddress").innerText = "✅ " + account;
    document.getElementById("refSection").style.display = "block";
    document.getElementById("refLink").value = window.location.origin + window.location.pathname + "?ref=" + account;
    loadStakes();
  } else {
    alert("Please install MetaMask or Bitget Wallet");
  }
}

async function copyRefLink() {
  const refInput = document.getElementById("refLink");
  refInput.select();
  document.execCommand("copy");
  alert("Referral link copied!");
}

async function registerReferrer() {
  const ref = document.getElementById("refInput").value;
  if (!ref || ref.toLowerCase() === account.toLowerCase()) {
    document.getElementById("status").innerText = "❌ Invalid or self-referral";
    return;
  }
  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    document.getElementById("status").innerText = "✅ Referrer registered";
  } catch (e) {
    document.getElementById("status").innerText = "❌ Error: " + e.message;
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  if (!amount || amount <= 0) return alert("Enter USDT amount");

  const usdtAmount = web3.utils.toWei(amount, "mwei");
  try {
    const balance = await usdt.methods.balanceOf(account).call();
    if (Number(balance) < Number(usdtAmount)) return alert("Insufficient USDT");

    await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });
    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "✅ Purchased and staked KJC";
    loadStakes();
  } catch (e) {
    document.getElementById("status").innerText = "❌ Error: " + e.message;
  }
}

async function claimReferralReward() {
  try {
    await contract.methods.claimReferralReward().send({ from: account });
    document.getElementById("status").innerText = "✅ Referral reward claimed!";
  } catch (e) {
    document.getElementById("status").innerText = "❌ Claim failed: " + e.message;
  }
}

async function loadStakes() {
  const container = document.getElementById("stakesContainer");
  container.innerHTML = "";
  const count = await contract.methods.getStakeCount(account).call();

  for (let i = 0; i < count; i++) {
    const stake = await contract.methods.getStake(account, i).call();
    const div = document.createElement("div");
    div.innerHTML = `
      <p>💰 Amount: ${web3.utils.fromWei(stake.amount)} KJC</p>
      <p>🕒 Start: ${new Date(stake.startTime * 1000).toLocaleString()}</p>
      <p>⏳ Last Claim: ${new Date(stake.lastClaimTime * 1000).toLocaleString()}</p>
      <p>✅ Claimed: ${stake.claimed}</p>
      <button onclick="claimStakeReward(${i})">Claim Reward</button>
      <button onclick="unstake(${i})">Unstake</button>
      <hr/>
    `;
    container.appendChild(div);
  }
}

async function claimStakeReward(index) {
  try {
    await contract.methods.claimStakeReward(index).send({ from: account });
    document.getElementById("status").innerText = "✅ Stake reward claimed!";
    loadStakes();
  } catch (e) {
    document.getElementById("status").innerText = "❌ Claim failed: " + e.message;
  }
}

async function unstake(index) {
  try {
    await contract.methods.unstake(index).send({ from: account });
    document.getElementById("status").innerText = "✅ Unstaked!";
    loadStakes();
  } catch (e) {
    document.getElementById("status").innerText = "❌ Unstake failed: " + e.message;
  }
}
