import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Surveys() {
  const { data, isLoading, error } = trpc.survey.iframeUrl.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-800">Available Surveys</h1>
        <p className="text-sm text-gray-400 ml-auto">Powered by CPX Research</p>
      </header>

      <main className="flex-1 p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading surveys…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">
            <p>Failed to load surveys. Please try again later.</p>
          </div>
        )}

        {data && (
          <iframe
            src={data.url}
            width="100%"
            height="2000px"
            frameBorder="0"
            title="CPX Research Survey Wall"
            className="rounded-lg"
            allow="clipboard-write"
          />
        )}
      </main>
    </div>
  );
}
