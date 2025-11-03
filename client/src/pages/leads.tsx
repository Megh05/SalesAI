import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

//todo: remove mock functionality
const leads = [
  {
    id: 1,
    name: "Sarah Johnson",
    company: "TechCorp",
    email: "sarah@techcorp.com",
    phone: "+1 (555) 123-4567",
    status: "in_discussion" as const,
    value: "$45,000",
    lastContact: "2 hours ago",
    avatar: "SJ",
  },
  {
    id: 2,
    name: "Michael Chen",
    company: "DataFlow Inc",
    email: "m.chen@dataflow.io",
    phone: "+1 (555) 234-5678",
    status: "negotiation" as const,
    value: "$78,000",
    lastContact: "1 day ago",
    avatar: "MC",
  },
  {
    id: 3,
    name: "Emma Wilson",
    company: "CloudSys",
    email: "emma.w@cloudsys.com",
    phone: "+1 (555) 345-6789",
    status: "prospect" as const,
    value: "$32,000",
    lastContact: "3 days ago",
    avatar: "EW",
  },
  {
    id: 4,
    name: "James Rodriguez",
    company: "AI Solutions",
    email: "james@aisolutions.ai",
    phone: "+1 (555) 456-7890",
    status: "contacted" as const,
    value: "$56,000",
    lastContact: "5 days ago",
    avatar: "JR",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    company: "SaaS Co",
    email: "l.anderson@saasco.com",
    phone: "+1 (555) 567-8901",
    status: "in_discussion" as const,
    value: "$91,000",
    lastContact: "1 week ago",
    avatar: "LA",
  },
];

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales pipeline</p>
        </div>
        <Button data-testid="button-add-lead">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-leads"
          />
        </div>
        <Button variant="outline" data-testid="button-filter-leads">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="group" data-testid={`lead-row-${lead.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{lead.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{lead.name}</span>
                  </div>
                </TableCell>
                <TableCell>{lead.company}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="font-medium">{lead.value}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{lead.lastContact}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-view-lead-${lead.id}`}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
