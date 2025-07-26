let web3;
let account;
let contract;
let usdt;

async function connectWallet() {
  if (window.ethereum || window.bitkeep?.ethereum) {
    web3 = new Web3(window.ethereum || window.bitkeep.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await web3.eth.getChainId();
      if (chainId !== 56) {
        await switchToBSC();
      }
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      document.getElementById("walletAddress").innerText = `✅ ${account}`;
      document.getElementById("refSection").style.display = "block";
      contract = new web3.eth.Contract(contractABI, contractAddress);
      usdt = new web3.eth.Contract(usdtABI, usdtAddress);

      const refLink = `${window.location.origin}${window.location.pathname}?ref=${account}`;
      document.getElementById("refLink").value = refLink;
    } catch (err) {
      alert("เชื่อมต่อกระเป๋าไม่สำเร็จ");
    }
  } else {
    alert("กรุณาติดตั้ง MetaMask หรือ Bitget Wallet");
  }
}

async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x38" }],
    });
  } catch (switchError) {
    alert("กรุณาเปลี่ยนเป็น BNB Chain ใน Wallet ของคุณ");
  }
}

async function registerReferrer() {
  const ref = document.getElementById("refInput").value;
  if (!web3.utils.isAddress(ref)) {
    alert("Referrer address ไม่ถูกต้อง");
    return;
  }
  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    alert("สมัคร Referrer สำเร็จ");
  } catch (e) {
    alert("เกิดข้อผิดพลาดในการสมัคร Referrer");
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  const ref = new URLSearchParams(window.location.search).get("ref");

  if (!amount || isNaN(amount) || amount <= 0) {
    alert("กรุณากรอกจำนวน USDT ให้ถูกต้อง");
    return;
  }

  const usdtAmount = web3.utils.toWei(amount, "ether");

  try {
    const allowance = await usdt.methods.allowance(account, contractAddress).call();
    if (BigInt(allowance) < BigInt(usdtAmount)) {
      await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });
    }

    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });
    alert("ซื้อและ Stake สำเร็จแล้ว");
  } catch (e) {
    console.error(e);
    alert("❌ เกิดข้อผิดพลาด: " + (e.message || "ไม่สามารถดำเนินการได้"));
  }
}

function copyRefLink() {
  const link = document.getElementById("refLink");
  link.select();
  document.execCommand("copy");
  alert("คัดลอกลิงก์เรียบร้อยแล้ว");
}
