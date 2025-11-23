import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Building2, Network, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface GraphNode {
  id: string;
  type: "person" | "company";
  name: string;
  linkedinUrl?: string;
  metadata?: string;
}

export default function LinkedInCompanies() {
  const [searchQuery, setSearchQuery] = useState("");
  const { activeOrgId } = useAuth();

  const { data: companies = [], isLoading } = useQuery<GraphNode[]>({
    queryKey: ["/api/graph/nodes", { type: "company", organizationId: activeOrgId }],
    enabled: !!activeOrgId,
  });

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parseMetadata = (metadataStr?: string) => {
    try {
      return metadataStr ? JSON.parse(metadataStr) : {};
    } catch {
      return {};
    }
  };

  if (!activeOrgId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">Please select an organization to view LinkedIn companies</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">LinkedIn Companies</h1>
          <p className="text-muted-foreground">
            Companies imported from your LinkedIn network
          </p>
        </div>
        <Link href="/linkedin-import">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Import More Data
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-companies"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-companies" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No LinkedIn companies yet</h3>
          <p className="text-muted-foreground mb-4">
            Import your LinkedIn connections to see your network
          </p>
          <Link href="/linkedin-import">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Import LinkedIn Data
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const metadata = parseMetadata(company.metadata);
            
            return (
              <Card key={company.id} className="hover-elevate" data-testid={`company-card-${company.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1 truncate">{company.name}</h3>
                        {metadata.location && (
                          <p className="text-sm text-muted-foreground truncate">{metadata.location}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {metadata.industry && <Badge variant="secondary">{metadata.industry}</Badge>}
                        {metadata.size && <Badge variant="outline">{metadata.size}</Badge>}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Link href={`/linkedin-map/${company.id}`}>
                          <Button
                            size="sm"
                            variant="default"
                            data-testid={`button-view-map-${company.id}`}
                          >
                            <Network className="h-3 w-3 mr-1" />
                            View Network
                          </Button>
                        </Link>
                        {company.linkedinUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(company.linkedinUrl, '_blank')}
                            data-testid={`button-linkedin-${company.id}`}
                          >
                            LinkedIn →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Click "View Network" to see the 3D visualization of connections for each company
        </p>
      </div>
    </div>
  );
}
