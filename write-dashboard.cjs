const fs = require("fs");

const content = `import { useState } from "react";
import { trpc } from "@/lib/trpc";

function fmt(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function Badge({ label, color }) {
  const colors = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-700",
  };
  return <span className={"px-2 py-0.5 rounded text-xs font-medium " + (colors[color] || colors.gray)}>{label}</span>;
}

function UserStatusBadge({ user }) {
  if (user.isBanned) return <Badge label="Banned" color="red" />;
  if (user.isSuspended) return <Badge label="Suspended" color="yellow" />;
  return <Badge label="Active" color="green" />;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r flex flex-col py-6 px-4 gap-2 fixed h-full">
        <div className="mb-6">
          <div className="font-bold text-lg text-orange-500">Admin Panel</div>
        </div>
        {["overview","users","withdrawals"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"text-left px-3 py-2 rounded capitalize font-medium " + (tab === t ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100")}>
            {t}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-2">
          <a href="/" className="text-center px-3 py-2 rounded border text-sm text-gray-600 hover:bg-gray-50">View Site</a>
          <button onClick={() => { document.cookie = "session=; max-age=0; path=/"; window.location.href = "/"; }}
            className="text-center px-3 py-2 rounded border text-sm text-red-500 hover:bg-red-50">Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div className="ml-56 flex-1 p-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "withdrawals" && <WithdrawalsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = trpc.admin.getAnalytics.useQuery();
  const { data: wds } = trpc.admin.getAllWithdrawals.useQuery({ status: "pending", page: 1, limit: 10 });

  if (isLoading) return <div className="text-gray-500">Loading...</div>;

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? 0 },
    { label: "Active Users", value: data?.activeUsers ?? 0 },
    { label: "Suspended", value: data?.suspendedUsers ?? 0 },
    { label: "Banned", value: data?.bannedUsers ?? 0 },
    { label: "Total Earned", value: fmt(data?.totalEarnedCents ?? 0) },
    { label: "Total Withdrawn", value: fmt(data?.totalWithdrawnCents ?? 0) },
    { label: "Transactions", value: data?.totalTransactions ?? 0 },
    { label: "Pending Withdrawals", value: data?.pendingWithdrawals ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Overview</h1>
      <p className="text-gray-500 mb-6">Platform stats</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Pending Withdrawals</h2>
        {!wds?.withdrawals?.length ? (
          <div className="text-gray-400 text-center py-8">No pending withdrawals</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-2">ID</th><th className="pb-2">User</th><th className="pb-2">Amount</th><th className="pb-2">Method</th><th className="pb-2">Actions</th>
            </tr></thead>
            <tbody>
              {wds.withdrawals.map(w => <WithdrawalRow key={w.id} w={w} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function WithdrawalRow({ w }) {
  const utils = trpc.useUtils();
  const approve = trpc.admin.approveWithdrawal.useMutation({ onSuccess: () => utils.admin.getAllWithdrawals.invalidate() });
  const reject = trpc.admin.rejectWithdrawal.useMutation({ onSuccess: () => utils.admin.getAllWithdrawals.invalidate() });
  return (
    <tr className="border-b last:border-0">
      <td className="py-2">#{w.id}</td>
      <td className="py-2">User {w.userId}</td>
      <td className="py-2 font-medium">{fmt(w.amountCents)}</td>
      <td className="py-2">{w.method}</td>
      <td className="py-2 flex gap-2">
        <button onClick={() => approve.mutate({ withdrawalId: w.id })}
          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">Approve</button>
        <button onClick={() => reject.mutate({ withdrawalId: w.id })}
          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Reject</button>
      </td>
    </tr>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getUsers.useQuery({ page, limit: 20, search: search || undefined, filter });
  const suspend = trpc.admin.suspendUser.useMutation({ onSuccess: () => utils.admin.getUsers.invalidate() });
  const unsuspend = trpc.admin.unsuspendUser.useMutation({ onSuccess: () => utils.admin.getUsers.invalidate() });
  const ban = trpc.admin.banUser.useMutation({ onSuccess: () => utils.admin.getUsers.invalidate() });
  const unban = trpc.admin.unbanUser.useMutation({ onSuccess: () => utils.admin.getUsers.invalidate() });
  const del = trpc.admin.deleteUser.useMutation({ onSuccess: () => utils.admin.getUsers.invalidate() });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Users</h1>
      <p className="text-gray-500 mb-6">All registered users on SurveyEarn Pro</p>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email..."
          className="border rounded px-3 py-2 text-sm flex-1 max-w-xs" />
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border">
        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : !data?.users?.length ? (
          <div className="text-gray-400 text-center py-12">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {data.users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email ?? "—"}</td>
                  <td className="px-4 py-3"><UserStatusBadge user={u} /></td>
                  <td className="px-4 py-3"><Badge label={u.role} color={u.role === "admin" ? "blue" : "gray"} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => setSelectedUser(u)}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50">View</button>
                      {u.isSuspended
                        ? <button onClick={() => unsuspend.mutate({ userId: u.id })}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100">Unsuspend</button>
                        : <button onClick={() => suspend.mutate({ userId: u.id })}
                            className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100">Suspend</button>
                      }
                      {u.isBanned
                        ? <button onClick={() => unban.mutate({ userId: u.id })}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">Unban</button>
                        : <button onClick={() => ban.mutate({ userId: u.id })}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100">Ban</button>
                      }
                      <button onClick={() => { if(confirm("Delete user permanently?")) del.mutate({ userId: u.id }); }}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.total > 20 && (
          <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-500">
            <span>Showing {((page-1)*20)+1}–{Math.min(page*20, data.total)} of {data.total}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={page*20>=data.total} onClick={() => setPage(p=>p+1)}
                className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  const [adjustAmt, setAdjustAmt] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const utils = trpc.useUtils();
  const { data } = trpc.admin.getUserDetail.useQuery({ userId: user.id });
  const adjust = trpc.admin.adjustBalance.useMutation({ onSuccess: () => { utils.admin.getUserDetail.invalidate(); setAdjustAmt(""); setAdjustNote(""); } });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <div className="font-bold text-lg">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {data?.wallet && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Balance</div>
                <div className="font-bold text-lg">{fmt(data.wallet.balanceCents)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Total Earned</div>
                <div className="font-bold text-lg">{fmt(data.wallet.totalEarnedCents)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Withdrawn</div>
                <div className="font-bold text-lg">{fmt(data.wallet.totalWithdrawnCents)}</div>
              </div>
            </div>
          )}
          <div>
            <div className="font-medium mb-2">Adjust Balance</div>
            <div className="flex gap-2">
              <input value={adjustAmt} onChange={e => setAdjustAmt(e.target.value)}
                placeholder="Amount in cents (negative to deduct)"
                className="border rounded px-3 py-2 text-sm flex-1" />
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                placeholder="Note (optional)"
                className="border rounded px-3 py-2 text-sm flex-1" />
              <button onClick={() => adjust.mutate({ userId: user.id, amountCents: parseInt(adjustAmt), note: adjustNote || undefined })}
                className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600">Apply</button>
            </div>
          </div>
          <div>
            <div className="font-medium mb-2">Recent Transactions</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {data?.transactions?.length ? data.transactions.map(t => (
                <div key={t.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-gray-500">{t.type}</span>
                  <span className={"font-medium " + (t.amountCents >= 0 ? "text-green-600" : "text-red-600")}>{fmt(t.amountCents)}</span>
                  <span className="text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              )) : <div className="text-gray-400 text-sm">No transactions</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WithdrawalsTab() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getAllWithdrawals.useQuery({ status, page, limit: 20 });
  const approve = trpc.admin.approveWithdrawal.useMutation({ onSuccess: () => utils.admin.getAllWithdrawals.invalidate() });
  const reject = trpc.admin.rejectWithdrawal.useMutation({ onSuccess: () => utils.admin.getAllWithdrawals.invalidate() });
  const markPaid = trpc.admin.markWithdrawalPaid.useMutation({ onSuccess: () => utils.admin.getAllWithdrawals.invalidate() });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Withdrawals</h1>
      <p className="text-gray-500 mb-6">Approve or reject pending withdrawal requests</p>
      <div className="flex gap-2 mb-4">
        {["pending","approved","rejected","paid","all"].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={"px-3 py-1 rounded text-sm capitalize " + (status===s ? "bg-orange-500 text-white" : "border text-gray-600 hover:bg-gray-50")}>
            {s}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border">
        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : !data?.withdrawals?.length ? (
          <div className="text-gray-400 text-center py-12">No {status} withdrawals</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {data.withdrawals.map(w => (
                <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">#{w.id}</td>
                  <td className="px-4 py-3">User {w.userId}</td>
                  <td className="px-4 py-3 font-medium">{fmt(w.amountCents)}</td>
                  <td className="px-4 py-3">{w.method}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{w.accountDetails}</td>
                  <td className="px-4 py-3">
                    <Badge label={w.status}
                      color={w.status==="paid"?"green":w.status==="approved"?"blue":w.status==="rejected"?"red":"yellow"} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(w.requestedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {w.status === "pending" && <>
                        <button onClick={() => approve.mutate({ withdrawalId: w.id })}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Approve</button>
                        <button onClick={() => reject.mutate({ withdrawalId: w.id })}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                      </>}
                      {w.status === "approved" && (
                        <button onClick={() => markPaid.mutate({ withdrawalId: w.id })}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.total > 20 && (
          <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-500">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={page*20>=data.total} onClick={() => setPage(p=>p+1)}
                className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync("client/src/pages/AdminDashboard.tsx", content, "utf8");
console.log("Done! AdminDashboard.tsx written successfully.");