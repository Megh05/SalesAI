import { LinkedInCSVUpload } from "@/components/linkedin-csv-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Download, Chrome, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LinkedInImport() {
  const { activeOrgId } = useAuth();

  const { data: stats } = useQuery<{
    totalNodes: number;
    totalEdges: number;
    companies: number;
    people: number;
  }>({
    queryKey: ["/api/graph/stats", { organizationId: activeOrgId }],
    enabled: !!activeOrgId,
  });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">LinkedIn Network Import</h1>
        <p className="text-muted-foreground">
          Import your LinkedIn connections to build your 3D network map
        </p>
      </div>

      {stats && (
        <Card className="mb-6" data-testid="card-stats">
          <CardHeader>
            <CardTitle>Your Network Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{stats.totalNodes}</p>
                <p className="text-sm text-muted-foreground">Total Nodes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.people}</p>
                <p className="text-sm text-muted-foreground">People</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.companies}</p>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEdges}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv" data-testid="tab-csv">
            <Upload className="h-4 w-4 mr-2" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="extension" data-testid="tab-extension">
            <Chrome className="h-4 w-4 mr-2" />
            Chrome Extension
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>How to Export LinkedIn Connections</CardTitle>
                <CardDescription>
                  Follow these steps to download your connections from LinkedIn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  <li>Go to LinkedIn Settings & Privacy</li>
                  <li>Click on "Data Privacy" in the left sidebar</li>
                  <li>Click "Get a copy of your data"</li>
                  <li>Select "Connections" only</li>
                  <li>Click "Request archive"</li>
                  <li>Wait for the email (usually arrives within 10 minutes)</li>
                  <li>Download and extract the ZIP file</li>
                  <li>Upload the Connections.csv file below</li>
                </ol>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://www.linkedin.com/mypreferences/d/download-my-data', '_blank')}
                  data-testid="button-linkedin-export"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Go to LinkedIn Export Page
                </Button>
              </CardContent>
            </Card>

            <LinkedInCSVUpload />
          </div>
        </TabsContent>

        <TabsContent value="extension" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chrome Extension Setup</CardTitle>
              <CardDescription>
                Install our Chrome extension to import LinkedIn data directly from your browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <p className="text-sm font-medium mb-2">Legal & Ethical Data Collection</p>
                <p className="text-sm text-muted-foreground">
                  Our extension only collects data from visible page elements with your explicit consent.
                  It does not access private or hidden data and respects LinkedIn's Terms of Service.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Installation Steps:</h3>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>Download the extension folder from your project</li>
                  <li>Open Chrome and navigate to <code className="bg-muted px-1 py-0.5 rounded">chrome://extensions/</code></li>
                  <li>Enable "Developer mode" in the top right</li>
                  <li>Click "Load unpacked"</li>
                  <li>Select the <code className="bg-muted px-1 py-0.5 rounded">chrome-extension</code> folder</li>
                  <li>Grant consent for data collection when prompted</li>
                  <li>Configure your SalesPilot API URL (this application's URL)</li>
                  <li>Enter your session token from browser cookies</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Usage:</h3>
                <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                  <li>Navigate to a LinkedIn company page or your connections</li>
                  <li>Click the extension icon</li>
                  <li>Choose what to scrape (company, connections, or people list)</li>
                  <li>Click "Send Data to SalesPilot"</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <p className="text-sm font-medium mb-2">Extension Location</p>
                <p className="text-sm text-muted-foreground">
                  The extension files are located in the <code className="bg-muted px-1 py-0.5 rounded">chrome-extension</code> folder
                  of your project. See <code className="bg-muted px-1 py-0.5 rounded">chrome-extension/README.md</code> for detailed instructions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
