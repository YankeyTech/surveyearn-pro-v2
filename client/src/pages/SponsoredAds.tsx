import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

function AdBanner({ slot }: { slot: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-2139043025594985"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

export default function SponsoredAds() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-10 text-white">
        <h1 className="text-3xl font-bold mb-1">Sponsored Ads</h1>
        <p className="text-orange-100">Engage with our partners and earn rewards</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* How it works */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-3xl mb-2">👀</div>
              <div className="font-medium text-sm">View Ads</div>
              <div className="text-xs text-muted-foreground mt-1">Browse sponsored content from our partners</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-3xl mb-2">🖱️</div>
              <div className="font-medium text-sm">Engage</div>
              <div className="text-xs text-muted-foreground mt-1">Click on offers that interest you</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-medium text-sm">Earn Rewards</div>
              <div className="text-xs text-muted-foreground mt-1">Get credited for completed actions</div>
            </div>
          </div>
        </div>

        {/* Google AdSense Banner 1 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Sponsored</div>
          <AdBanner slot="7524666176" />
        </div>

        {/* CPAlead section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Partner Offers</h2>
          <p className="text-sm text-muted-foreground mb-4">Complete offers from our partners and earn cash rewards</p>
          {/* CPAlead widget goes here once approved */}
          <div className="bg-muted rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">🔜</div>
            <div className="font-medium">Partner offers coming soon</div>
            <div className="text-sm text-muted-foreground mt-1">We are finalizing partnerships — check back soon!</div>
          </div>
        </div>

        {/* Google AdSense Banner 2 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Sponsored</div>
          <AdBanner slot="3593160021" />
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tips to earn more</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Check back daily for new sponsored offers</li>
            <li>• Complete full actions (sign ups, purchases) for higher rewards</li>
            <li>• Combine with surveys and daily check-ins to maximize earnings</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
