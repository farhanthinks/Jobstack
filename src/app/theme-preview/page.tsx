import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  CircleCheck,
  Clock,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const colorTokens = [
  { name: "Background", cls: "bg-background border" },
  { name: "Foreground", cls: "bg-foreground" },
  { name: "Primary", cls: "bg-primary" },
  { name: "Secondary", cls: "bg-secondary" },
  { name: "Muted", cls: "bg-muted" },
  { name: "Accent", cls: "bg-accent" },
  { name: "Destructive", cls: "bg-destructive" },
  { name: "Card", cls: "bg-card border" },
  { name: "Border", cls: "bg-border" },
];

const chartTokens = [
  { name: "chart-1", cls: "bg-chart-1" },
  { name: "chart-2", cls: "bg-chart-2" },
  { name: "chart-3", cls: "bg-chart-3" },
  { name: "chart-4", cls: "bg-chart-4" },
  { name: "chart-5", cls: "bg-chart-5" },
];

const pipeline = [
  { stage: "Saved", count: 24 },
  { stage: "Applied", count: 41 },
  { stage: "Screening", count: 12 },
  { stage: "Interview", count: 6 },
  { stage: "Offer", count: 2 },
];

export default function ThemePreviewPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Jobstack</p>
            <p className="text-xs text-muted-foreground">Design token preview</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Theme &amp; component preview
          </h1>
          <p className="text-sm text-muted-foreground">
            Electric Blue primary on a Slate/White light base and a Zinc/Black
            dark base — Geist type, 10–12px radius, subtle motion. Toggle
            themes above to confirm both modes.
          </p>
        </div>
      </section>

      {/* Color tokens */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Colors</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {colorTokens.map((c) => (
            <div key={c.name} className="space-y-1.5">
              <div className={`h-14 rounded-lg ${c.cls}`} />
              <p className="text-xs text-muted-foreground">{c.name}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {chartTokens.map((c) => (
            <div key={c.name} className="space-y-1.5">
              <div className={`h-8 rounded-md ${c.cls}`} />
              <p className="text-xs text-muted-foreground">{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Typography */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Typography — Geist</h2>
        <div className="space-y-1.5">
          <p className="text-3xl font-semibold tracking-tight">
            Aa Job Match Score: 87
          </p>
          <p className="text-base text-foreground">
            The quick brown fox jumps over the lazy dog — body text in Geist Sans.
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            const matchScore = computeMatch(jobDescription, resume);
          </p>
        </div>
      </section>

      <Separator />

      {/* Buttons & radius */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Buttons &amp; radius (10–12px)
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button>Add Job</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Withdraw</Button>
          <Button variant="link">Link</Button>
          <Button size="icon" variant="outline" aria-label="Sparkles">
            <Sparkles className="size-4" />
          </Button>
        </div>
      </section>

      <Separator />

      {/* Form elements */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Form controls</h2>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Acme Inc." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platform">Platform</Label>
            <Select defaultValue="linkedin">
              <SelectTrigger id="platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="naukri">Naukri</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="company-site">Company Site</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="auto-followup">Auto-suggest follow-ups</Label>
              <p className="text-xs text-muted-foreground">
                Prompt a task when a job moves to Interview.
              </p>
            </div>
            <Switch id="auto-followup" defaultChecked />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Status badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Saved</Badge>
            <Badge>Applied</Badge>
            <Badge variant="outline">Screening</Badge>
            <Badge className="bg-chart-3 text-white">Interview</Badge>
            <Badge className="bg-emerald-600 text-white">Offer</Badge>
            <Badge variant="destructive">Rejected</Badge>
          </div>

          <Tabs defaultValue="overview" className="pt-2">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm text-muted-foreground">
              Dense but breathable panel content lives here.
            </TabsContent>
            <TabsContent value="ai" className="text-sm text-muted-foreground">
              AI surfaces get their own dedicated workspace, not a modal.
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Separator />

      {/* Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Applications sent</CardDescription>
            <CardTitle className="text-2xl">128</CardTitle>
            <CardAction>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="size-3" />
                +12%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Last 30 days
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Response rate</CardDescription>
            <CardTitle className="text-2xl">34%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Across all platforms
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Next interview</CardDescription>
            <CardTitle className="text-2xl">Fri, 2pm</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Technical round · Acme Inc.
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="gap-1 px-0">
              View details <ArrowUpRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Pipeline funnel as a table (minimal, no chart lib needed for preview) */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Pipeline funnel
        </h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipeline.map((row) => (
                  <TableRow key={row.stage}>
                    <TableCell className="font-medium">{row.stage}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.count}
                    </TableCell>
                    <TableCell>
                      <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-200"
                          style={{ width: `${(row.count / 41) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* AI surface teaser */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          AI workspace accent
        </h2>
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <CardTitle className="text-base">Job Match Score</CardTitle>
            </div>
            <CardDescription>
              Dedicated intelligence workspace styling — not a bolted-on modal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full border-4 border-primary text-lg font-semibold">
              87
            </div>
            <p className="text-sm text-muted-foreground">
              Strong match. Missing keywords: <span className="font-mono">GraphQL</span>,{" "}
              <span className="font-mono">Terraform</span>.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">
              <FileText className="size-3.5" />
              Tailor resume
            </Button>
            <Button size="sm" variant="outline">
              <Calendar className="size-3.5" />
              Add follow-up
            </Button>
          </CardFooter>
        </Card>
      </section>

      <footer className="flex items-center gap-1.5 pb-6 text-xs text-muted-foreground">
        <CircleCheck className="size-3.5" />
        Confirm this looks right, then Phase 2 (job management) starts.
      </footer>
    </div>
  );
}
