import { useState } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

//todo: remove mock functionality
const companies = [
  {
    id: 1,
    name: "TechCorp",
    industry: "Technology",
    size: "50-100",
    leads: 3,
    revenue: "$125,000",
    location: "San Francisco, CA",
  },
  {
    id: 2,
    name: "DataFlow Inc",
    industry: "SaaS",
    size: "100-500",
    leads: 5,
    revenue: "$280,000",
    location: "New York, NY",
  },
  {
    id: 3,
    name: "CloudSys",
    industry: "Cloud Services",
    size: "10-50",
    leads: 2,
    revenue: "$65,000",
    location: "Austin, TX",
  },
  {
    id: 4,
    name: "AI Solutions",
    industry: "Artificial Intelligence",
    size: "50-100",
    leads: 4,
    revenue: "$190,000",
    location: "Seattle, WA",
  },
  {
    id: 5,
    name: "SaaS Co",
    industry: "Software",
    size: "100-500",
    leads: 6,
    revenue: "$340,000",
    location: "Boston, MA",
  },
  {
    id: 6,
    name: "Enterprise Systems",
    industry: "Enterprise",
    size: "500+",
    leads: 8,
    revenue: "$520,000",
    location: "Chicago, IL",
  },
];

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Companies</h1>
          <p className="text-muted-foreground">Manage your client organizations</p>
        </div>
        <Button data-testid="button-add-company">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="hover-elevate cursor-pointer" data-testid={`company-card-${company.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1 truncate">{company.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{company.location}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{company.industry}</Badge>
                    <Badge variant="outline">{company.size} employees</Badge>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Leads</span>
                      <span className="font-medium">{company.leads}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-medium">{company.revenue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
