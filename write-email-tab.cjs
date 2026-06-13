const fs = require("fs");

let content = fs.readFileSync("client/src/pages/AdminDashboard.tsx", "utf8");

// Add Email to sidebar tabs
content = content.replace(
  '["overview","users","withdrawals"].map(t => (',
  '["overview","users","withdrawals","email"].map(t => ('
);

// Add Email tab render
content = content.replace(
  '{tab === "withdrawals" && <WithdrawalsTab />}',
  '{tab === "withdrawals" && <WithdrawalsTab />}\n        {tab === "email" && <EmailTab />}'
);

// Add EmailTab component before the last line
const emailTab = `
function EmailTab() {
  const [audience, setAudience] = useState("all");
  const [userId, setUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(null);

  const sendToAll = trpc.admin.sendMailToAll.useMutation({
    onSuccess: (d) => { setSent("Sent to " + d.sent + " users!"); setSubject(""); setBody(""); }
  });
  const sendToUser = trpc.admin.sendMailToUser.useMutation({
    onSuccess: () => { setSent("Email sent!"); setSubject(""); setBody(""); setUserId(""); }
  });

  function handleSend() {
    if (!subject.trim() || !body.trim()) return alert("Subject and body required.");
    if (audience === "all") {
      if (!confirm("Send this email to ALL users?")) return;
      sendToAll.mutate({ subject, body });
    } else {
      if (!userId.trim()) return alert("Enter a user ID.");
      sendToUser.mutate({ userId: parseInt(userId), subject, body });
    }
    setSent(null);
  }

  const loading = sendToAll.isPending || sendToUser.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Email</h1>
      <p className="text-gray-500 mb-6">Send emails to users</p>
      <div className="bg-white rounded-xl border p-6 max-w-2xl space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Audience</label>
          <select value={audience} onChange={e => setAudience(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full">
            <option value="all">All Users</option>
            <option value="one">Specific User (by ID)</option>
          </select>
        </div>
        {audience === "one" && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">User ID</label>
            <input value={userId} onChange={e => setUserId(e.target.value)}
              placeholder="e.g. 3"
              className="border rounded px-3 py-2 text-sm w-full" />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="border rounded px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={8}
            className="border rounded px-3 py-2 text-sm w-full resize-y" />
        </div>
        {sent && <div className="text-green-600 text-sm font-medium">{sent}</div>}
        {(sendToAll.isError || sendToUser.isError) && (
          <div className="text-red-500 text-sm">Failed to send. Try again.</div>
        )}
        <button onClick={handleSend} disabled={loading}
          className="px-6 py-2 bg-orange-500 text-white rounded font-medium hover:bg-orange-600 disabled:opacity-50">
          {loading ? "Sending..." : audience === "all" ? "Send to All Users" : "Send to User"}
        </button>
      </div>
    </div>
  );
}
`;

content = content + emailTab;

fs.writeFileSync("client/src/pages/AdminDashboard.tsx", content, "utf8");
console.log("Done! Email tab added.");