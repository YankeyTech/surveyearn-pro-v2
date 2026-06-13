import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function OffersPage() {
  const { data: user } = trpc.auth.me.useQuery();

  useEffect(() => {
    // Load CPALead offerwall script
    const existing = document.getElementById("cpalead-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "cpalead-script";
      script.type = "text/javascript";
      script.src = "https://www.qckclk.com/offerwall-v2.js?bid=Ea6ho5D";
      document.body.appendChild(script);
    }
  }, []);

  const offerwallUrl = user
    ? `https://www.qckclk.com/wall/Ea6ho5D?subid=${user.id}`
    : "https://www.qckclk.com/wall/Ea6ho5D";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        <p className="text-gray-500 mt-1">Complete offers below to earn rewards credited directly to your wallet.</p>
      </div>

      {!user && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          Please <a href="/login" className="font-medium underline">sign in</a> to earn rewards from offers.
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <iframe
          sandbox="allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          src={offerwallUrl}
          style={{ width: "100%", height: "750px", border: "none" }}
          frameBorder="0"
        />
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Rewards are credited automatically within a few minutes of offer completion.
      </div>
    </div>
  );
}
