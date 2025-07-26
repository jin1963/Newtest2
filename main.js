let web3, account, contract, usdt;

async function connectWallet() {
  if (window.ethereum) {
    try {
      // Step 1: ขอเชื่อมบัญชี
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Step 2: เช็ค chain ปัจจุบัน
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x38') {
        try {
          // Step 3: ถ้ายังไม่อยู่บน BNB → สลับ chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], // BNB Chain
          });
        } catch (switchError) {
          // ถ้า chain ยังไม่ถูกเพิ่มใน wallet → ลองเพิ่มให้
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x38',
                  chainName: 'BNB Smart Chain',
                  nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                  },
                  rpcUrls: ['https://bsc-dataseed.binance.org/'],
                  blockExplorerUrls: ['https://bscscan.com']
                }]
              });
            } catch (addError) {
              document.getElementById("walletAddress").innerText = "❌ ไม่สามารถเพิ่ม BNB Chain ได้";
              return;
            }
          } else {
            document.getElementById("walletAddress").innerText = "❌ สลับ Chain ไม่สำเร็จ";
            return;
          }
        }
      }

      // Step 4: เชื่อมต่อสำเร็จ
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      contract = new web3.eth.Contract(contractABI, contractAddress);
      usdt = new web3.eth.Contract(usdtABI, usdtAddress);

      document.getElementById("walletAddress").innerText = "✅ " + account;
      document.getElementById("refSection").style.display = "block";
      document.getElementById("refLink").value = window.location.origin + window.location.pathname + "?ref=" + account;
    } catch (err) {
      console.error(err);
      document.getElementById("walletAddress").innerText = "❌ การเชื่อมต่อไม่สำเร็จ";
    }
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

    document.getElementById("status").innerText = "⏳ Approving USDT...";
    await usdt.methods.approve(contractAddress, usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "⏳ Purchasing KJC...";
    await contract.methods.buyWithReferralAndStake(usdtAmount).send({ from: account });

    document.getElementById("status").innerText = "✅ ซื้อและ Stake สำเร็จ";
  } catch (e) {
    document.getElementById("status").innerText = "❌ เกิดข้อผิดพลาด: " + e.message;
  }
}
