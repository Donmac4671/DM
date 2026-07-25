'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Nav tab selection
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'topups' | 'packages' | 'users' | 'complaints' | 'announcements' | 'logs'>('analytics');

  // Database resource states
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Package CRUD Form State
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgNetwork, setPkgNetwork] = useState<'MTN' | 'Telecel' | 'AirtelTigo'>('MTN');
  const [pkgCategory, setPkgCategory] = useState<'AirtelTigo iShare' | 'AirtelTigo Big Time' | 'MTN Regular' | 'Telecel Special' | 'Default'>('Default');
  const [pkgName, setPkgName] = useState('');
  const [pkgDataAmount, setPkgDataAmount] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgValidity, setPkgValidity] = useState('30 Days');
  const [pkgIsOnline, setPkgIsOnline] = useState(true);
  const [pkgIsHidden, setPkgIsHidden] = useState(false);
  const [pkgSortOrder, setPkgSortOrder] = useState('1');

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annNetwork, setAnnNetwork] = useState<any>('');

  // Complaint reply State
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [complaintReplyText, setComplaintReplyText] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // SMS webhook simulation states inside control panel
  const [smsSender, setSmsSender] = useState('MTN MoMo');
  const [smsSmsContent, setSmsSmsContent] = useState('Received GHS 100.00 from Kojo. Reference: DMH-123456. Transaction ID: TX10293847');
  const [simulationResponse, setSimulationResponse] = useState('');

  useEffect(() => {
    fetchAdminSession();
  }, []);

  const fetchAdminSession = async () => {
    try {
      const res = await fetch('/api/auth');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        router.push('/customer');
        return;
      }
      setAdmin(data.user);

      await Promise.all([
        fetchUsers(),
        fetchOrders(),
        fetchTransactions(),
        fetchClaims(),
        fetchPackages(),
        fetchComplaints(),
        fetchAnnouncements(),
        fetchAuditLogs()
      ]);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    if (res.ok) setOrders(await res.json());
  };

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    if (res.ok) setTransactions(await res.json());
  };

  const fetchClaims = async () => {
    const res = await fetch('/api/admin/claims');
    if (res.ok) setClaims(await res.json());
  };

  const fetchPackages = async () => {
    const res = await fetch('/api/packages');
    if (res.ok) setPackages(await res.json());
  };

  const fetchComplaints = async () => {
    const res = await fetch('/api/complaints');
    if (res.ok) setComplaints(await res.json());
  };

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/announcements');
    if (res.ok) setAnnouncements(await res.json());
  };

  const fetchAuditLogs = async () => {
    const res = await fetch('/api/admin/logs');
    if (res.ok) setAuditLogs(await res.json());
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  // --- PACKAGE MANAGEMENT CRUD Actions ---
  const savePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || !pkgDataAmount || !pkgPrice) return;

    const payload = {
      id: editingPkgId || undefined,
      network: pkgNetwork,
      category: pkgCategory,
      name: pkgName,
      dataAmount: pkgDataAmount,
      price: parseFloat(pkgPrice),
      validity: pkgValidity,
      isOnline: pkgIsOnline,
      isHidden: pkgIsHidden,
      sortOrder: parseInt(pkgSortOrder),
    };

    try {
      const res = await fetch('/api/packages', {
        method: editingPkgId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      alert(editingPkgId ? 'Package updated!' : 'Package created!');
      resetPackageForm();
      fetchPackages();
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEditPackage = (pkg: any) => {
    setEditingPkgId(pkg.id);
    setPkgNetwork(pkg.network);
    setPkgCategory(pkg.category);
    setPkgName(pkg.name);
    setPkgDataAmount(pkg.dataAmount);
    setPkgPrice(pkg.price.toString());
    setPkgValidity(pkg.validity);
    setPkgIsOnline(pkg.isOnline);
    setPkgIsHidden(pkg.isHidden);
    setPkgSortOrder(pkg.sortOrder.toString());
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const res = await fetch('/api/packages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert('Package deleted.');
        fetchPackages();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetPackageForm = () => {
    setEditingPkgId(null);
    setPkgName('');
    setPkgDataAmount('');
    setPkgPrice('');
    setPkgValidity('30 Days');
    setPkgIsOnline(true);
    setPkgIsHidden(false);
    setPkgSortOrder('1');
  };

  // --- PROCESS MANUAL CLAIM ---
  const handleProcessClaim = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Claim successfully ${status}!`);
      fetchClaims();
      fetchTransactions();
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- SUBMIT BROADCAST ANNOUNCEMENT ---
  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          networkSpecific: annNetwork || null,
        }),
      });
      if (res.ok) {
        alert('Announcement broadcasted successfully!');
        setAnnTitle('');
        setAnnContent('');
        setAnnNetwork('');
        fetchAnnouncements();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert('Announcement removed.');
        fetchAnnouncements();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- COMPLAINT REPLY ---
  const submitComplaintReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintReplyText) return;

    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedComplaint.id,
          adminReply: complaintReplyText,
          status: 'resolved',
        }),
      });
      if (res.ok) {
        alert('Reply submitted and complaint marked resolved.');
        setSelectedComplaint(null);
        setComplaintReplyText('');
        fetchComplaints();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- SIMULATION SMS WEBHOOK TRIGGER ---
  const simulateMoMoSMS = async () => {
    setSimulationResponse('Sending simulated SMS...');
    try {
      const res = await fetch('/api/webhook/momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smsContent: smsSmsContent,
          senderNumber: smsSender,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSimulationResponse(`Error: ${data.error}`);
      } else {
        setSimulationResponse(`Success: ${data.message}. Target: ${data.user.email} (New Balance: GHS ${data.user.walletBalance})`);
        fetchTransactions();
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err: any) {
      setSimulationResponse(`Error: ${err.message}`);
    }
  };

  // --- EXPORT TO CSV HELPER ---
  const exportToCSV = (dataList: any[], filename: string) => {
    if (dataList.length === 0) return;
    const headers = Object.keys(dataList[0]).join(',');
    const rows = dataList.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <span className="text-xl font-bold">Connecting Secure Terminal...</span>
      </div>
    );
  }

  // Calculate analytics totals
  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.amountPaid, 0);
  const totalCompletedOrders = orders.filter((o) => o.status === 'completed').length;
  const totalPendingClaims = claims.filter((c) => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col sm:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full sm:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded text-xl">DONMAC</span>
            <span className="font-bold text-slate-400">ADMIN</span>
          </div>

          <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-black text-emerald-400">GHS {totalRevenue.toFixed(2)}</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📊 Analytics Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📦 Orders Management
            </button>
            <button
              onClick={() => setActiveTab('topups')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'topups' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              💳 Claims & Top-ups ({totalPendingClaims})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'packages' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📶 Package Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'users' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              👥 User Management
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'complaints' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              💬 Complaints Reply
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'announcements' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📣 Broadcast Center
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'logs' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              📜 Audit Logs
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2 font-medium">Console: {admin?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Terminal Signout
          </button>
        </div>
      </aside>

      {/* Main admin control area */}
      <main className="flex-grow p-6 sm:p-10 max-w-6xl overflow-y-auto">
        {/* Universal Search Filter */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex-grow w-full">
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase block mb-1">Live Search Console</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, package IDs, phone recipients, transaction references, or subjects..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto self-end">
            <button
              onClick={() => exportToCSV(orders, 'orders_export')}
              className="bg-slate-700 hover:bg-slate-650 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition w-full sm:w-auto"
            >
              📥 Export Orders CSV
            </button>
            <button
              onClick={() => exportToCSV(transactions, 'transactions_export')}
              className="bg-slate-700 hover:bg-slate-650 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition w-full sm:w-auto"
            >
              📥 Export Ledger CSV
            </button>
          </div>
        </div>

        {/* --- Tab Panel 1: Analytics Overview --- */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-black mb-6">System Status & Analytics Dashboard</h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold">Total Revenue</span>
                <div className="text-3xl font-black mt-1 text-slate-100">GHS {totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold">Completed Orders</span>
                <div className="text-3xl font-black mt-1 text-slate-100">{totalCompletedOrders} Fulfillments</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold">Registered Users</span>
                <div className="text-3xl font-black mt-1 text-slate-100">{users.length} Terminals</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold">Pending Claims</span>
                <div className="text-3xl font-black mt-1 text-amber-500">{totalPendingClaims} Pending</div>
              </div>
            </div>

            {/* Quick Chart Simulation info */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
              <h3 className="text-lg font-bold mb-4">📈 Cumulative Revenue Charts</h3>
              <div className="h-48 w-full bg-slate-950 rounded-xl border border-slate-855 p-4 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-mono">System live telemetry graph rendering...</span>
                <div className="flex items-end justify-between gap-2 h-28">
                  <div className="w-1/6 bg-amber-500/30 rounded h-[10%] text-center text-[10px] font-bold text-amber-500 flex items-center justify-center">Mon</div>
                  <div className="w-1/6 bg-amber-500/50 rounded h-[30%] text-center text-[10px] font-bold text-amber-500 flex items-center justify-center">Tue</div>
                  <div className="w-1/6 bg-amber-500/70 rounded h-[55%] text-center text-[10px] font-bold text-amber-500 flex items-center justify-center">Wed</div>
                  <div className="w-1/6 bg-amber-500/40 rounded h-[20%] text-center text-[10px] font-bold text-amber-500 flex items-center justify-center">Thu</div>
                  <div className="w-1/6 bg-amber-500 rounded h-[85%] text-center text-[10px] font-bold text-slate-950 flex items-center justify-center">Fri</div>
                  <div className="w-1/6 bg-emerald-500 rounded h-[100%] text-center text-[10px] font-bold text-slate-950 flex items-center justify-center">Today</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab Panel 2: Orders Management --- */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Global Orders Management</h2>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-750">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer ID</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Recipient Phone</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-sm">
                  {orders
                    .filter((o) =>
                      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      o.recipientPhone.includes(searchQuery) ||
                      o.packageName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-slate-750/30 transition">
                        <td className="p-4 font-mono text-xs">{o.id}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{o.userId}</td>
                        <td className="p-4 font-bold text-slate-100">{o.packageName}</td>
                        <td className="p-4 text-slate-300">{o.recipientPhone}</td>
                        <td className="p-4 text-slate-400 text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                        <td className="p-4 font-bold text-slate-200">GHS {o.amountPaid.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : o.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {o.status !== 'failed' && (
                            <button
                              onClick={async () => {
                                if (confirm('Mark as failed & trigger auto balance refund?')) {
                                  const res = await fetch('/api/orders', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: o.id, status: 'failed' }),
                                  });
                                  if (res.ok) {
                                    alert('Order failed & refund completed!');
                                    fetchOrders();
                                    fetchAuditLogs();
                                    fetchUsers();
                                  }
                                }
                              }}
                              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition font-bold"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab Panel 3: Claims & Wallet Topups --- */}
        {activeTab === 'topups' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Payment Claims & Wallet Top-ups</h2>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-8">
              <h3 className="text-sm font-bold bg-slate-950 p-4 border-b border-slate-750 text-slate-300">Pending Fallback Claims Approval</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase bg-slate-950 border-b border-slate-750">
                    <th className="p-4">Claim ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Tx ID (MoMo)</th>
                    <th className="p-4">Ref Code Used</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Action Approve / Reject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-sm">
                  {claims
                    .filter((c) => c.status === 'pending')
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-slate-750/30 transition">
                        <td className="p-4 font-mono text-xs">{c.id}</td>
                        <td className="p-4 text-slate-300">{c.userEmail}</td>
                        <td className="p-4 text-slate-100 font-mono text-xs font-bold">{c.transactionId}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{c.referenceCodeUsed || 'N/A'}</td>
                        <td className="p-4 font-bold text-slate-200">GHS {c.amount.toFixed(2)}</td>
                        <td className="p-4 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleProcessClaim(c.id, 'approved')}
                            className="bg-emerald-500 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-emerald-450 transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter Rejection Reason:');
                              if (reason) handleProcessClaim(c.id, 'rejected', reason);
                            }}
                            className="bg-red-600/20 text-red-400 font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-red-600 hover:text-white transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {claims.filter((c) => c.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-slate-500">No pending fallback claims.</div>
              )}
            </div>
          </div>
        )}

        {/* --- Tab Panel 4: Package Management --- */}
        {activeTab === 'packages' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Package Management</h2>

            {/* Form */}
            <form onSubmit={savePackage} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8 space-y-4">
              <h3 className="text-lg font-bold text-amber-500">{editingPkgId ? 'Edit Telecom Package' : 'Create Telecom Package'}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Network</label>
                  <select
                    value={pkgNetwork}
                    onChange={(e: any) => setPkgNetwork(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="MTN">MTN</option>
                    <option value="Telecel">Telecel</option>
                    <option value="AirtelTigo">AirtelTigo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category Category</label>
                  <select
                    value={pkgCategory}
                    onChange={(e: any) => setPkgCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Default">Default Category</option>
                    <option value="AirtelTigo iShare">AirtelTigo iShare</option>
                    <option value="AirtelTigo Big Time">AirtelTigo Big Time</option>
                    <option value="MTN Regular">MTN Regular</option>
                    <option value="Telecel Special">Telecel Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    placeholder="e.g. iShare Large"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Data Amount</label>
                  <input
                    type="text"
                    required
                    value={pkgDataAmount}
                    onChange={(e) => setPkgDataAmount(e.target.value)}
                    placeholder="e.g. 10GB"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Price (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Validity</label>
                  <input
                    type="text"
                    value={pkgValidity}
                    onChange={(e) => setPkgValidity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={pkgSortOrder}
                    onChange={(e) => setPkgSortOrder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIsOnline}
                    onChange={(e) => setPkgIsOnline(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>Online (Can be purchased)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIsHidden}
                    onChange={(e) => setPkgIsHidden(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>Hidden (Hide completely)</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-6 rounded-xl cursor-pointer"
                >
                  Save Package
                </button>
                {editingPkgId && (
                  <button
                    type="button"
                    onClick={resetPackageForm}
                    className="bg-slate-700 hover:bg-slate-650 text-white font-bold py-2 px-6 rounded-xl cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            {/* List */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-750">
                    <th className="p-4">Sort</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Network</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Availability</th>
                    <th className="p-4">Visibility</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-sm">
                  {packages
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-750/30 transition">
                        <td className="p-4 font-mono text-xs">{p.sortOrder}</td>
                        <td className="p-4 font-bold text-slate-100">{p.name} ({p.dataAmount})</td>
                        <td className="p-4 text-slate-300">{p.network}</td>
                        <td className="p-4 text-slate-400 text-xs">{p.category}</td>
                        <td className="p-4 font-bold text-amber-500">GHS {p.price.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {p.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${!p.isHidden ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-950 text-slate-500'}`}>
                            {!p.isHidden ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => startEditPackage(p)}
                            className="bg-slate-750 hover:bg-slate-700 text-xs py-1 px-2 rounded cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePackage(p.id)}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs py-1 px-2 rounded cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab Panel 5: User Management --- */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-black mb-6">User Accounts & Balances</h2>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-750">
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Fund Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-sm">
                  {users
                    .filter((u) => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-750/30 transition">
                        <td className="p-4 font-bold text-slate-100">{u.fullName}</td>
                        <td className="p-4 text-slate-300">{u.email}</td>
                        <td className="p-4 text-slate-400">{u.phone}</td>
                        <td className="p-4 font-mono font-bold text-amber-500">GHS {u.walletBalance.toFixed(2)}</td>
                        <td className="p-4 uppercase text-xs font-bold text-slate-500">{u.role}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={async () => {
                              const amt = prompt(`Enter new balance for user ${u.email}:`);
                              if (amt && !isNaN(parseFloat(amt))) {
                                const res = await fetch('/api/users', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: u.id, walletBalance: parseFloat(amt), actionType: 'admin_balance_adjustment' }),
                                });
                                if (res.ok) {
                                  alert('Wallet adjusted successfully.');
                                  fetchUsers();
                                  fetchAuditLogs();
                                }
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-1 px-3 rounded-lg cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab Panel 6: Complaints Response --- */}
        {activeTab === 'complaints' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Support & Complaint Responses</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Open Tickets</h3>
                {complaints
                  .filter((c) => c.status === 'open')
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`p-5 rounded-2xl border transition cursor-pointer ${selectedComplaint?.id === c.id ? 'bg-slate-750 border-amber-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-100">{c.subject}</span>
                        <span className="text-xs bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded font-bold">Open</span>
                      </div>
                      <span className="text-xs text-slate-400 block mb-3">Submitted by {c.userEmail}</span>
                      <p className="text-xs text-slate-300">{c.message}</p>
                    </div>
                  ))}
                {complaints.filter((c) => c.status === 'open').length === 0 && (
                  <div className="text-slate-500 text-sm">No open complaint tickets.</div>
                )}
              </div>

              <div>
                {selectedComplaint ? (
                  <form onSubmit={submitComplaintReply} className="bg-slate-800 p-6 rounded-2xl border border-slate-750 space-y-4">
                    <h3 className="text-lg font-bold text-amber-500">Reply to: {selectedComplaint.subject}</h3>
                    <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-300">
                      <strong>Customer message:</strong> {selectedComplaint.message}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Reply Message</label>
                      <textarea
                        required
                        rows={4}
                        value={complaintReplyText}
                        onChange={(e) => setComplaintReplyText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-750 rounded-xl px-4 py-2 text-white"
                        placeholder="Write helpful response..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-6 rounded-xl cursor-pointer"
                    >
                      Send Reply
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-750 border-dashed text-center text-slate-500 text-sm">
                    Select an open ticket to draft and send a reply.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Tab Panel 7: Announcements Broadcast --- */}
        {activeTab === 'announcements' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Broadcast Announcements</h2>

            <form onSubmit={handleAnnouncement} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8 space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-755 rounded-xl px-4 py-2 text-white"
                  placeholder="e.g. Scheduled Network Maintenance"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Broadcast Content</label>
                <textarea
                  required
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-755 rounded-xl px-4 py-2 text-white"
                  placeholder="Write full message details..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Network (Optional)</label>
                <select
                  value={annNetwork}
                  onChange={(e) => setAnnNetwork(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-755 rounded-xl px-4 py-2 text-white"
                >
                  <option value="">All Networks</option>
                  <option value="MTN">MTN Only</option>
                  <option value="Telecel">Telecel Only</option>
                  <option value="AirtelTigo">AirtelTigo Only</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-6 rounded-xl cursor-pointer"
              >
                Publish Broadcast Announcement
              </button>
            </form>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">Past Announcements</h3>
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-100 block">{ann.title}</span>
                    <span className="text-xs text-slate-400 block mb-2">{ann.content}</span>
                    {ann.networkSpecific && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-amber-500 font-bold">Network: {ann.networkSpecific}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="text-red-400 font-bold hover:text-red-300 text-sm cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Tab Panel 8: Audit Logs --- */}
        {activeTab === 'logs' && (
          <div>
            <h2 className="text-2xl font-black mb-6">Security & Admin Audit Logs</h2>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-750">
                    <th className="p-4">Log ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                    <th className="p-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-sm">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-750/30 transition">
                      <td className="p-4 font-mono text-xs text-slate-500">{log.id}</td>
                      <td className="p-4 text-slate-300">{log.userEmail}</td>
                      <td className="p-4"><span className="bg-slate-950 px-2 py-1 rounded text-xs font-mono font-bold text-amber-500">{log.action}</span></td>
                      <td className="p-4 text-slate-400 text-xs">{log.details}</td>
                      <td className="p-4 text-right text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- AUTOMATED SMS SIMULATION WEBPAGE CONTROL PANEL --- */}
      <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border-2 border-red-500 p-5 rounded-2xl shadow-2xl max-w-md w-full">
        <h4 className="text-sm font-black text-red-500 mb-2">⚡ SIMULATION CONTROL PANEL (MoMo SMS Webhook)</h4>
        <p className="text-[10px] text-slate-400 mb-4">
          Simulate standard Automated SMS forwarding. Copy reference code from customer tab and place inside text below to instantly test auto credit funding.
        </p>

        <div className="space-y-3 text-xs mb-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">SMS Sender</label>
            <input
              type="text"
              value={smsSender}
              onChange={(e) => setSmsSender(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">SMS Content Body</label>
            <textarea
              rows={3}
              value={smsSmsContent}
              onChange={(e) => setSmsSmsContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white"
            />
          </div>
        </div>

        <button
          onClick={simulateMoMoSMS}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg cursor-pointer text-xs"
        >
          Send Webhook SMS
        </button>

        {simulationResponse && (
          <div className="mt-3 bg-slate-900 p-2.5 rounded border border-slate-805 text-[10px] text-slate-300 font-mono">
            {simulationResponse}
          </div>
        )}
      </div>
    </div>
  );
}
