let web3, account, contract, usdt;

async function connectWallet() {
  if (window.ethereum || window.bitkeep?.ethereum) {
    const provider = window.ethereum || window.bitkeep.ethereum;
    web3 = new Web3(provider);
    await provider.request({ method: "eth_requestAccounts" });
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];

    contract = new web3.eth.Contract(contractABI, contractAddress);
    usdt = new web3.eth.Contract(usdtABI, usdtAddress);

    // ✅ อัปเดตสถานะ
    document.getElementById("walletAddress").innerText = "✅ " + account;

    // ✅ แสดง ref link
    const refLink = window.location.origin + window.location.pathname + "?ref=" + account;
    document.getElementById("refLink").value = refLink;

    // ✅ แสดง section
    document.getElementById("refSection").style.display = "block";
  } else {
    alert("กรุณาติดตั้ง MetaMask หรือ Bitget Wallet");
  }
}

async function copyRefLink() {
  const refInput = document.getElementById("refLink");
  refInput.select();
  document.execCommand("copy");
  alert("คัดลอกลิงก์แล้ว!");
}

async function registerReferrer() {
  const ref = document.getElementById("refInput").value;
  if (!ref || ref.toLowerCase() === account.toLowerCase()) {
    document.getElementById("status").innerText = "❌ ลิงก์ไม่ถูกต้องหรือไม่สามารถแนะนำตนเองได้";
    return;
  }
  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    document.getElementById("status").innerText = "✅ สมัคร referrer สำเร็จ";
  } catch (e) {
    document.getElementById("status").innerText = "❌ สมัครไม่สำเร็จ: " + e.message;
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  if (!amount || amount <= 0) {
    alert("กรุณาระบุจำนวน USDT");
    return;
  }

  const usdtAmount = web3.utils.toWei(amount, "mwei"); // USDT = 6 decimals

  try {
    const balance = await usdt.methods.balanceOf(account).call();
    if (Number(balance) < Number(usdtAmount)) {
      document.getElementById("status").innerText = "❌ คุณไม่มี USDT เพียงพอในกระเป๋า";
      return;
    }

    document.getElementById("status").innerText = "⏳ กำลัง Approve USDT...";
    await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "⏳ กำลังซื้อ KJC และ Stake...";
    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "✅ ซื้อและ Stake สำเร็จ!";
  } catch (e) {
    document.getElementById("status").innerText = "❌ เกิดข้อผิดพลาด: " + e.message;
  }
}
