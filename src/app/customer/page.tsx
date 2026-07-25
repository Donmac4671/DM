'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'quickbuy' | 'history' | 'wallet' | 'complaints' | 'profile' | 'guides'>('quickbuy');

  // Packages state
  const [packages, setPackages] = useState<any[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<'All' | 'MTN' | 'Telecel' | 'AirtelTigo'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'AirtelTigo iShare' | 'AirtelTigo Big Time'>('All');

  // Topup state
  const [topupAmount, setTopupAmount] = useState('');
  const [refCode, setRefCode] = useState('');
  const [pendingRefCodeDetails, setPendingRefCodeDetails] = useState<any>(null);

  // Manual Claim state
  const [claimTxId, setClaimTxId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimRefCodeUsed, setClaimRefCodeUsed] = useState('');
  const [claimScreenshot, setClaimScreenshot] = useState('');
  const [claimStatusMsg, setClaimStatusMsg] = useState('');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [orderQuery, setOrderQuery] = useState('');
  const [orderRecipient, setOrderRecipient] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Wallet transaction history
  const [transactions, setTransactions] = useState<any[]>([]);

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Complaints
  const [complaints, setComplaints] = useState<any[]>([]);
  const [compSubject, setCompSubject] = useState('');
  const [compMessage, setCompMessage] = useState('');
  const [compScreenshot, setCompScreenshot] = useState('');

  // Chat simulator
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'agent', text: 'Hello! Welcome to Donmac Support. How can we help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Profile preferences
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [orderNotif, setOrderNotif] = useState(true);

  // Shopping Cart Floating
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setFullName(data.user.fullName);
      setPhone(data.user.phone);
      setEmailNotif(data.user.notificationPrefs.email);
      setSmsNotif(data.user.notificationPrefs.sms);
      setOrderNotif(data.user.notificationPrefs.orderUpdates);

      await Promise.all([
        fetchPackages(),
        fetchOrders(),
        fetchTransactions(),
        fetchAnnouncements(),
        fetchComplaints()
      ]);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    const res = await fetch('/api/packages');
    if (res.ok) {
      const data = await res.json();
      setPackages(data);
      setFilteredPackages(data);
    }
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
  };

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    if (res.ok) {
      const data = await res.json();
      setTransactions(data);
    }
  };

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/announcements');
    if (res.ok) {
      const data = await res.json();
      setAnnouncements(data);
    }
  };

  const fetchComplaints = async () => {
    const res = await fetch('/api/complaints');
    if (res.ok) {
      const data = await res.json();
      setComplaints(data);
    }
  };

  // Filter package helper
  useEffect(() => {
    let filtered = packages.filter((pkg) => !pkg.isHidden);

    if (networkFilter !== 'All') {
      filtered = filtered.filter((pkg) => pkg.network === networkFilter);
    }
    if (categoryFilter !== 'All' && networkFilter === 'AirtelTigo') {
      filtered = filtered.filter((pkg) => pkg.category === categoryFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pkg.dataAmount.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPackages(filtered);
  }, [searchQuery, networkFilter, categoryFilter, packages]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  // Top up Wallet
  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAmount || parseFloat(topupAmount) <= 0) return;

    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topupAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPendingRefCodeDetails(data);
      setTopupAmount('');
      fetchTransactions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit manual claim
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTxId || !claimAmount) return;

    try {
      const res = await fetch('/api/wallet/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: claimTxId,
          amount: claimAmount,
          referenceCodeUsed: claimRefCodeUsed,
          screenshotUrl: claimScreenshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClaimStatusMsg('Claim submitted successfully! Admin will review shortly.');
      setClaimTxId('');
      setClaimAmount('');
      setClaimRefCodeUsed('');
      setClaimScreenshot('');
      fetchTransactions();
    } catch (err: any) {
      setClaimStatusMsg(`Error: ${err.message}`);
    }
  };

  // Quick buy action
  const handleBuyPackage = async (pkg: any) => {
    setSelectedPackage(pkg);
  };

  const confirmOrder = async () => {
    if (!orderRecipient) {
      alert('Please enter recipient phone number.');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          recipientPhone: orderRecipient,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Order completed successfully! Data sent.');
      setSelectedPackage(null);
      setOrderRecipient('');
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Complaint
  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compSubject || !compMessage) return;

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: compSubject,
          message: compMessage,
          screenshotUrl: compScreenshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Complaint submitted successfully.');
      setCompSubject('');
      setCompMessage('');
      setCompScreenshot('');
      fetchComplaints();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update profile settings
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          password: password || undefined,
          notificationPrefs: {
            email: emailNotif,
            sms: smsNotif,
            orderUpdates: orderNotif,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Profile updated successfully.');
      setPassword('');
      fetchUserData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Shopping Cart actions
  const addToCart = (pkg: any) => {
    setCartItems([...cartItems, pkg]);
  };

  const removeFromCart = (index: number) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  const checkoutCart = async () => {
    if (cartItems.length === 0) return;
    const phoneNum = prompt('Enter Recipient Phone Number for Cart Checkout:');
    if (!phoneNum) return;

    for (const item of cartItems) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: item.id,
            recipientPhone: phoneNum,
          }),
        });
      } catch (err) {
        console.error('Cart purchase failed', err);
      }
    }

    alert('Cart checkouts completed successfully!');
    setCartItems([]);
    fetchUserData();
  };

  // Chat simulation submit
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Admin simulated responses depending on triggers
    setTimeout(() => {
      let replyText = "Thank you for contacting Donmac Support. An operator is reviewing your query.";
      if (chatInput.toLowerCase().includes('topup') || chatInput.toLowerCase().includes('wallet')) {
        replyText = "If you have topped up and didn't receive your credits, please make a claim with your MoMo ID in the Claim tab.";
      } else if (chatInput.toLowerCase().includes('pending') || chatInput.toLowerCase().includes('ref')) {
        replyText = "Kindly confirm you inputted the correct Reference code when making the transaction.";
      }
      setChatMessages((prev) => [...prev, { sender: 'agent', text: replyText }]);
    }, 1000);
  };

  // Helper toggle favorites
  const handleToggleFavorite = async (pkgId: string) => {
    let newFavorites = [...(user?.favorites || [])];
    if (newFavorites.includes(pkgId)) {
      newFavorites = newFavorites.filter((id) => id !== pkgId);
    } else {
      newFavorites.push(pkgId);
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: newFavorites }),
      });
      if (res.ok) {
        fetchUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <span className="text-xl font-bold">Connecting to Secure Hub...</span>
      </div>
    );
  }

  // Analytics helper metrics
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todaySpending = todayOrders.reduce((sum, o) => sum + o.amountPaid, 0);
  const todayData = todayOrders.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col sm:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full sm:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded text-xl">DONMAC</span>
            <span className="font-bold text-slate-400">HUB</span>
          </div>

          <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Your Balance</span>
            <span className="text-2xl font-black text-amber-500">GHS {user?.walletBalance.toFixed(2)}</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('quickbuy')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'quickbuy' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              🚀 Quick Buy
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'history' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📦 Order History
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'wallet' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              💳 Wallet Funding
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'complaints' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              💬 Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'profile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              ⚙️ Account Settings
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'guides' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📖 Documentation & Guides
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2 font-medium">Logged in as {user?.fullName}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 sm:p-10 max-w-6xl overflow-y-auto">
        {/* Header Broadcast announcements banner */}
        {announcements.length > 0 && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-amber-300">
            <span className="text-lg">📢</span>
            <div>
              <span className="font-bold block">Announcement: {announcements[0].title}</span>
              <span className="text-sm opacity-90">{announcements[0].content}</span>
            </div>
          </div>
        )}

        {/* Dashboard Grid Analytics for Today */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Spendings (Today)</span>
            <div className="text-2xl font-black mt-1 text-slate-100">GHS {todaySpending.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Packages Purchased (Today)</span>
            <div className="text-2xl font-black mt-1 text-slate-100">{todayData} Bundles</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Network Status</span>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-xs font-bold rounded">MTN</span>
                <span className="px-2 py-0.5 bg-red-600/20 text-red-500 text-xs font-bold rounded">TEL</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">Airtel</span>
              </div>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* --- Tab Panel 1: Quick Buy --- */}
        {activeTab === 'quickbuy' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black">Buy Fast Data Bundles</h2>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setNetworkFilter('All'); setCategoryFilter('All'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${networkFilter === 'All' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  All Networks
                </button>
                <button
                  onClick={() => { setNetworkFilter('MTN'); setCategoryFilter('All'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${networkFilter === 'MTN' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  MTN Ghana
                </button>
                <button
                  onClick={() => { setNetworkFilter('Telecel'); setCategoryFilter('All'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${networkFilter === 'Telecel' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  Telecel
                </button>
                <button
                  onClick={() => { setNetworkFilter('AirtelTigo'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${networkFilter === 'AirtelTigo' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  AirtelTigo
                </button>
              </div>
            </div>

            {/* AirtelTigo Specific Categories */}
            {networkFilter === 'AirtelTigo' && (
              <div className="flex gap-2 mb-6 bg-slate-950 p-2 rounded-xl border border-slate-800 self-start">
                <button
                  onClick={() => setCategoryFilter('All')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${categoryFilter === 'All' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  All AirtelTigo Category
                </button>
                <button
                  onClick={() => setCategoryFilter('AirtelTigo iShare')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${categoryFilter === 'AirtelTigo iShare' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  AirtelTigo iShare
                </button>
                <button
                  onClick={() => setCategoryFilter('AirtelTigo Big Time')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${categoryFilter === 'AirtelTigo Big Time' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  AirtelTigo Big Time
                </button>
              </div>
            )}

            {/* Search inputs */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                placeholder="🔍 Search for specific bundle packages (e.g. 5GB or 10GB)..."
              />
            </div>

            {/* Favorites List */}
            {user?.favorites && user.favorites.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">⭐️ Frequently Purchased Favorites</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.filter((pkg) => user.favorites.includes(pkg.id)).map((pkg) => (
                    <div key={`fav-${pkg.id}`} className="bg-slate-800/80 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-amber-400 font-bold block">{pkg.network} - {pkg.category}</span>
                        <span className="font-bold text-sm text-slate-100">{pkg.name} ({pkg.dataAmount})</span>
                      </div>
                      <button
                        onClick={() => handleBuyPackage(pkg)}
                        className="bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-amber-400 transition cursor-pointer"
                      >
                        Buy Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package Listings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => {
                const isFavorite = user?.favorites?.includes(pkg.id);
                const isOnline = pkg.isOnline;
                return (
                  <div key={pkg.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                    {/* Brand Highlight Colors */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${pkg.network === 'MTN' ? 'bg-yellow-400' : pkg.network === 'Telecel' ? 'bg-red-600' : 'bg-blue-500'}`} />

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-xs text-slate-400 font-bold tracking-wide uppercase block">{pkg.network}</span>
                          <span className="text-xs text-slate-500 font-semibold block">{pkg.category}</span>
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(pkg.id)}
                          className="text-lg text-amber-500 hover:scale-110 transition cursor-pointer"
                        >
                          {isFavorite ? '★' : '☆'}
                        </button>
                      </div>

                      <div className="text-3xl font-black text-slate-100 mb-2">{pkg.dataAmount}</div>
                      <p className="text-sm text-slate-400 font-medium mb-1">{pkg.name}</p>
                      <span className="text-xs bg-slate-950/60 text-slate-400 px-2 py-1 rounded inline-block">Validity: {pkg.validity}</span>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-750 flex items-center justify-between">
                      <span className="text-xl font-bold text-amber-500">GHS {pkg.price.toFixed(2)}</span>
                      {isOnline ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCart(pkg)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-xs py-2 px-3 rounded-lg transition cursor-pointer"
                          >
                            🛒 Add
                          </button>
                          <button
                            onClick={() => handleBuyPackage(pkg)}
                            className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs py-2 px-4 rounded-lg transition cursor-pointer"
                          >
                            Buy
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs bg-red-600/20 text-red-400 font-bold px-3 py-1 rounded-lg">Offline</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- Tab Panel 2: Order History --- */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Your Data Purchase History</h2>

            <div className="mb-6">
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                placeholder="🔍 Filter orders by phone or package name..."
              />
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-750">
                    <th className="p-4">Package</th>
                    <th className="p-4">Network</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-sm">
                  {orders
                    .filter(
                      (o) =>
                        o.packageName.toLowerCase().includes(orderQuery.toLowerCase()) ||
                        o.recipientPhone.includes(orderQuery)
                    )
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-slate-750/30 transition">
                        <td className="p-4 font-bold text-slate-100">{order.packageName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${order.network === 'MTN' ? 'bg-yellow-400/20 text-yellow-400' : order.network === 'Telecel' ? 'bg-red-600/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
                            {order.network}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{order.recipientPhone}</td>
                        <td className="p-4 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                        <td className="p-4 font-bold text-slate-200">GHS {order.amountPaid.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : order.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              alert(`--- DONMAC DATA HUB RECEIPT ---\nOrder ID: ${order.id}\nPackage: ${order.packageName}\nRecipient: ${order.recipientPhone}\nAmount: GHS ${order.amountPaid}\nStatus: ${order.status}\nDate: ${new Date(order.createdAt).toLocaleString()}`);
                            }}
                            className="bg-slate-750 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="p-8 text-center text-slate-500">No purchases found.</div>
              )}
            </div>
          </div>
        )}

        {/* --- Tab Panel 3: Wallet Funding --- */}
        {activeTab === 'wallet' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Wallet Funding Center</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Automated Top-up flow */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold mb-2">⚡ Automatic Wallet Top-up</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Initiate a request, copy the unique reference code, and send MoMo cash. Your wallet gets automatically credited instantly after our system parses the MoMo SMS!
                </p>

                <form onSubmit={handleTopup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Top-up Amount (GHS)</label>
                    <input
                      type="number"
                      required
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl cursor-pointer"
                  >
                    Generate Reference Code
                  </button>
                </form>

                {pendingRefCodeDetails && (
                  <div className="mt-6 bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-2">Instructions</span>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div>1. Send <strong className="text-white">GHS {pendingRefCodeDetails.amount}</strong> to the MoMo wallet: <strong className="text-white">{pendingRefCodeDetails.momoNumber}</strong></div>
                      <div>2. Use the Reference Code: <strong className="text-amber-400 text-sm select-all">{pendingRefCodeDetails.referenceCode}</strong></div>
                      <div className="text-amber-500 font-bold">⚠️ Warning: The reference code must be exactly as displayed and is valid for 2 hours.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Claims Fallback */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold mb-2">🛡️ Claim Payment (Fallback)</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Forgot to use the reference code? Enter your MoMo transaction ID and details below for admin approval.
                </p>

                {claimStatusMsg && (
                  <div className="bg-slate-950 text-amber-400 p-3 rounded-lg text-xs mb-4">
                    {claimStatusMsg}
                  </div>
                )}

                <form onSubmit={handleClaim} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">MoMo Transaction ID</label>
                    <input
                      type="text"
                      required
                      value={claimTxId}
                      onChange={(e) => setClaimTxId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                      placeholder="e.g. 293810293"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Amount Paid (GHS)</label>
                      <input
                        type="number"
                        required
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Reference Used (Optional)</label>
                      <input
                        type="text"
                        value={claimRefCodeUsed}
                        onChange={(e) => setClaimRefCodeUsed(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                        placeholder="e.g. DMH-123456"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Screenshot Url/Attachment</label>
                    <input
                      type="text"
                      value={claimScreenshot}
                      onChange={(e) => setClaimScreenshot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                      placeholder="Paste screenshot URL"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                  >
                    Submit Fallback Claim
                  </button>
                </form>
              </div>
            </div>

            {/* Topup History table */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-3">Wallet Loading Log</h3>
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-750">
                      <th className="p-4">Type</th>
                      <th className="p-4">Reference / MoMo ID</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-750 text-sm">
                    {transactions
                      .filter((t) => t.type === 'deposit')
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-750/30 transition">
                          <td className="p-4 text-slate-200 capitalize font-medium">{tx.type}</td>
                          <td className="p-4 text-slate-400 font-mono text-xs">{tx.reference}</td>
                          <td className="p-4 font-bold text-emerald-400">GHS {tx.amount.toFixed(2)}</td>
                          <td className="p-4 text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab Panel 4: Support Complaints Tickets --- */}
        {activeTab === 'complaints' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Support & Complaint Tickets</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Submit a Complaint</h3>

                <form onSubmit={handleComplaint} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Subject / Issue Topic</label>
                    <input
                      type="text"
                      required
                      value={compSubject}
                      onChange={(e) => setCompSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                      placeholder="e.g. Wallet not credited"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Description / Message</label>
                    <textarea
                      required
                      rows={4}
                      value={compMessage}
                      onChange={(e) => setCompMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                      placeholder="Explain what happened..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Screenshot URL (Optional)</label>
                    <input
                      type="text"
                      value={compScreenshot}
                      onChange={(e) => setCompScreenshot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                      placeholder="Paste screenshot URL"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </form>
              </div>

              {/* Tickets list */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Your Past Tickets</h3>
                {complaints.map((ticket) => (
                  <div key={ticket.id} className="bg-slate-800 border border-slate-750 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-100">{ticket.subject}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{ticket.message}</p>
                    {ticket.screenshotUrl && (
                      <span className="text-xs bg-slate-950 px-2 py-1 rounded text-amber-500 block w-max mb-4">Screenshot attached</span>
                    )}

                    {ticket.adminReply && (
                      <div className="mt-3 p-3 bg-slate-950 rounded-xl border-l-2 border-amber-500 text-xs text-slate-300">
                        <span className="font-bold text-amber-400 block mb-1">Admin Response:</span>
                        {ticket.adminReply}
                      </div>
                    )}
                  </div>
                ))}
                {complaints.length === 0 && (
                  <div className="text-slate-500 text-sm">No ticket logs found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Tab Panel 5: Profile & Password Settings --- */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Account Settings & Security</h2>

            <form onSubmit={handleUpdateProfile} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-2xl space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-755 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-755 rounded-xl px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Change Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-755 rounded-xl px-4 py-2 text-white"
                  placeholder="Enter new secure password"
                />
              </div>

              {/* Notification Prefs */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Notification Preferences</span>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotif}
                      onChange={(e) => setEmailNotif(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Receive email notifications for wallet top-ups</span>
                  </label>
                  <label className="flex items-center space-x-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotif}
                      onChange={(e) => setSmsNotif(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Receive SMS delivery notifications</span>
                  </label>
                  <label className="flex items-center space-x-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderNotif}
                      onChange={(e) => setOrderNotif(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Notify on automated bundle delivery updates</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="bg-amber-500 text-slate-950 hover:bg-amber-400 px-6 py-2.5 rounded-xl font-bold cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* --- Tab Panel 6: Guides --- */}
        {activeTab === 'guides' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Help Center & Guides</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold text-amber-400 mb-3">📖 How to Top Up Wallet</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                  <li>Navigate to the <strong className="text-white">Wallet Funding</strong> tab.</li>
                  <li>Enter the amount you wish to credit and tap "Generate Reference Code".</li>
                  <li>Note down the unique code generated (e.g., DMH-123456).</li>
                  <li>Send the exact amount via your Mobile Money to our merchant wallet.</li>
                  <li>Ensure you include the unique code in the transaction reference field.</li>
                  <li>Your wallet will be auto-funded instantly!</li>
                </ol>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold text-amber-400 mb-3">📖 How to Buy Bundles</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                  <li>Navigate to the <strong className="text-white">Quick Buy</strong> tab.</li>
                  <li>Filter packages by network (MTN, Telecel, AirtelTigo).</li>
                  <li>For AirtelTigo, choose between iShare and Big Time category structures.</li>
                  <li>Select a package, enter the recipient phone number, and confirm order.</li>
                  <li>The bundle is dispatched instantly!</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- FLOATING SHOPPING CART --- */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-slate-950 border-2 border-amber-500 p-5 rounded-2xl shadow-2xl max-w-xs w-full z-50 text-xs">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-slate-100 text-sm">🛒 Cart ({cartItems.length})</span>
            <button onClick={() => setCartItems([])} className="text-red-400 font-bold">Clear</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
            {cartItems.map((item, idx) => (
              <div key={`cart-${idx}`} className="flex justify-between text-slate-300">
                <span>{item.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">GHS {item.price}</span>
                  <button onClick={() => removeFromCart(idx)} className="text-red-400 font-bold">×</button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={checkoutCart}
            className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-lg cursor-pointer"
          >
            Checkout Cart
          </button>
        </div>
      )}

      {/* --- WHATSAPP SUPPORT BUTTON & LIVE CHAT SIMULATOR --- */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        {/* Real-time Simulated Live Chat */}
        {isChatOpen && (
          <div className="bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl w-72 h-96 flex flex-col justify-between overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
              <span className="font-bold text-xs text-slate-200">💬 Live Chat Support</span>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 font-bold hover:text-white">×</button>
            </div>
            <div className="flex-grow p-3 space-y-3 overflow-y-auto text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={`msg-${idx}`} className={`max-w-[80%] p-2 rounded-xl ${msg.sender === 'user' ? 'bg-amber-500 text-slate-950 self-end ml-auto' : 'bg-slate-800 text-slate-200 self-start mr-auto'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendChatMessage} className="border-t border-slate-850 p-2 flex gap-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type help query..."
                className="flex-grow bg-slate-900 border border-slate-805 rounded-lg px-2 py-1 text-xs focus:outline-none"
              />
              <button type="submit" className="bg-amber-500 text-slate-950 px-2.5 rounded-lg font-bold">Send</button>
            </form>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-slate-850 border border-slate-700 text-white font-bold text-xs px-4 py-3 rounded-full shadow-lg hover:bg-slate-800 cursor-pointer"
          >
            💬 Support Chat
          </button>
          <a
            href="https://wa.me/233241234567"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-3 rounded-full shadow-lg hover:bg-emerald-450 text-center"
          >
            🟢 WhatsApp Support
          </a>
        </div>
      </div>

      {/* --- QUICK BUY ORDER DIALOGUE MODAL --- */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 max-w-md w-full p-6 rounded-2xl shadow-2xl relative">
            <h3 className="text-xl font-bold mb-2">Confirm Purchase</h3>
            <p className="text-xs text-slate-400 mb-6">
              You are purchasing <strong className="text-white">{selectedPackage.name} ({selectedPackage.dataAmount})</strong> for GHS <strong className="text-amber-500">{selectedPackage.price.toFixed(2)}</strong>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Recipient Phone Number</label>
                <input
                  type="text"
                  required
                  value={orderRecipient}
                  onChange={(e) => setOrderRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                  placeholder="e.g. 0557654321"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedPackage(null)}
                className="bg-slate-700 hover:bg-slate-650 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                className="bg-amber-500 text-slate-950 hover:bg-amber-400 px-5 py-2 rounded-lg text-sm font-bold cursor-pointer"
              >
                Pay & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
