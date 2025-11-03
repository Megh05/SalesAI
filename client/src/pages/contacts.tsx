import { useState } from "react";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

//todo: remove mock functionality
const contacts = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "VP of Sales",
    company: "TechCorp",
    email: "sarah@techcorp.com",
    phone: "+1 (555) 123-4567",
    avatar: "SJ",
    tags: ["Decision Maker", "Hot Lead"],
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "CTO",
    company: "DataFlow Inc",
    email: "m.chen@dataflow.io",
    phone: "+1 (555) 234-5678",
    avatar: "MC",
    tags: ["Technical Contact"],
  },
  {
    id: 3,
    name: "Emma Wilson",
    role: "Product Manager",
    company: "CloudSys",
    email: "emma.w@cloudsys.com",
    phone: "+1 (555) 345-6789",
    avatar: "EW",
    tags: ["Influencer"],
  },
  {
    id: 4,
    name: "James Rodriguez",
    role: "CEO",
    company: "AI Solutions",
    email: "james@aisolutions.ai",
    phone: "+1 (555) 456-7890",
    avatar: "JR",
    tags: ["Decision Maker", "C-Level"],
  },
  {
    id: 5,
    name: "Lisa Anderson",
    role: "Head of Operations",
    company: "SaaS Co",
    email: "l.anderson@saasco.com",
    phone: "+1 (555) 567-8901",
    avatar: "LA",
    tags: ["Stakeholder"],
  },
  {
    id: 6,
    name: "David Kim",
    role: "Engineering Manager",
    company: "TechCorp",
    email: "david.k@techcorp.com",
    phone: "+1 (555) 678-9012",
    avatar: "DK",
    tags: ["Technical Contact"],
  },
];

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage your business relationships</p>
        </div>
        <Button data-testid="button-add-contact">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover-elevate cursor-pointer" data-testid={`contact-card-${contact.id}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{contact.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 truncate">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{contact.role}</p>
                    <p className="text-sm text-muted-foreground truncate">{contact.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
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
