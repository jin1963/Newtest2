let web3;
let account;
let contract;
let usdt;

async function connectWallet() {
  if (window.ethereum || window.bitkeep?.ethereum) {
    web3 = new Web3(window.ethereum || window.bitkeep.ethereum);

    try {
      const chainId = await web3.eth.getChainId();
      if (chainId !== targetChainId) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: web3.utils.toHex(targetChainId) }]
        });
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      account = accounts[0];
      document.getElementById("walletAddress").innerText = `✅ ${account}`;
      document.getElementById("refSection").style.display = "block";

      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref && ref.toLowerCase() !== account.toLowerCase()) {
        document.getElementById("refInput").value = ref;
      }

      const refLink = `${window.location.origin}${window.location.pathname}?ref=${account}`;
      document.getElementById("refLink").value = refLink;

      contract = new web3.eth.Contract(contractABI, contractAddress);
      usdt = new web3.eth.Contract(usdtABI, usdtAddress);

    } catch (err) {
      alert("❌ Wallet connect error: " + err.message);
      console.error(err);
    }
  } else {
    alert("กรุณาติดตั้ง MetaMask หรือ Bitget Wallet");
  }
}

async function registerReferrer() {
  const ref = document.getElementById("refInput").value;
  if (!web3.utils.isAddress(ref)) return alert("ที่อยู่ Referrer ไม่ถูกต้อง");
  if (ref.toLowerCase() === account.toLowerCase()) return alert("ห้ามใส่ที่อยู่ตัวเอง");

  try {
    await contract.methods.registerReferrer(ref).send({ from: account });
    alert("✅ สมัคร Referrer สำเร็จแล้ว");
  } catch (err) {
    alert("❌ Error: " + err.message);
    console.error(err);
  }
}

async function purchase() {
  const amount = document.getElementById("usdtAmount").value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) return alert("กรุณากรอกจำนวน USDT ให้ถูกต้อง");

  const usdtAmount = web3.utils.toWei(amount, "ether");

  try {
    const allowance = await usdt.methods.allowance(account, contractAddress).call();
    console.log("✅ Allowance:", allowance);

    if (BigInt(allowance) < BigInt(usdtAmount)) {
      alert("⏳ กำลังอนุมัติ USDT...");
      await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });
      alert("✅ อนุมัติ USDT แล้ว");
    }

    alert("⏳ กำลังซื้อและ Stake...");
    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });
    alert("✅ สำเร็จ! ซื้อและ Stake เรียบร้อยแล้ว");

  } catch (err) {
    alert("❌ เกิดข้อผิดพลาด: " + err.message);
    console.error(err);
  }
}

function copyRefLink() {
  const input = document.getElementById("refLink");
  input.select();
  input.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("📋 คัดลอกลิงก์แล้ว!");
}
