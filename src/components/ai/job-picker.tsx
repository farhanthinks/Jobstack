"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function JobPicker({
  jobs,
  selectedJobId,
}: {
  jobs: { id: string; company_name: string; position: string }[];
  selectedJobId?: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selectedJobId}
      onValueChange={(value) => router.push(`/ai-assistant?job=${value}`)}
    >
      <SelectTrigger className="w-full sm:w-80">
        <SelectValue placeholder="Select a job to work on" />
      </SelectTrigger>
      <SelectContent>
        {jobs.map((job) => (
          <SelectItem key={job.id} value={job.id}>
            {job.position} · {job.company_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
