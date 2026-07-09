import {
  CircleDotIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const REPOSITORY_URL = "https://github.com/mrluisfer/la-reta";
const REPOSITORY_API_URL = "https://api.github.com/repos/mrluisfer/la-reta";

type GitHubRepository = {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  updated_at: string;
};

async function getRepositoryInfo(): Promise<GitHubRepository | null> {
  try {
    const response = await fetch(REPOSITORY_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) return null;

    return (await response.json()) as GitHubRepository;
  } catch {
    return null;
  }
}

// ponytail: counts only the first page (100 branches). Add pagination if the repo ever exceeds that.
async function getBranchCount(): Promise<number | null> {
  try {
    const response = await fetch(
      `${REPOSITORY_API_URL}/branches?per_page=100`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 60 * 60 },
      },
    );

    if (!response.ok) return null;

    return ((await response.json()) as unknown[]).length;
  } catch {
    return null;
  }
}

export async function RepositoryButton() {
  const [repository, branchCount] = await Promise.all([
    getRepositoryInfo(),
    getBranchCount(),
  ]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={"secondary"}
            aria-label="Ver repositorio en GitHub"
            render={
              <Link href={REPOSITORY_URL} target="_blank" rel="noreferrer" />
            }
          />
        }
      >
        <GitBranchIcon />
      </TooltipTrigger>
      <TooltipContent className="block w-72 max-w-[calc(100vw-2rem)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">mrluisfer/la-reta</p>
            <p className="text-background/70 mt-0.5 text-[11px]">
              Repositorio público de la app
            </p>
          </div>
          <ExternalLinkIcon className="size-3.5 shrink-0 opacity-70" />
        </div>

        {repository ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <RepositoryMetric
                icon={StarIcon}
                label="Stars"
                value={repository.stargazers_count}
              />
              <RepositoryMetric
                icon={GitBranchIcon}
                label="Branches"
                value={branchCount ?? 0}
              />
              <RepositoryMetric
                icon={CircleDotIcon}
                label="Issues"
                value={repository.open_issues_count}
              />
            </div>
            <div className="border-background/15 mt-3 grid gap-1.5 border-t pt-3 text-[11px]">
              <RepositoryDetail
                label="Lenguaje"
                value={repository.language ?? "No detectado"}
              />
              <RepositoryDetail
                label="Rama"
                value={repository.default_branch}
              />
              <RepositoryDetail
                label="Actualizado"
                value={formatRepositoryDate(repository.updated_at)}
              />
            </div>
          </>
        ) : (
          <p className="text-background/70 mt-3 text-[11px] leading-relaxed">
            No se pudo cargar la información pública de GitHub ahora mismo, pero
            puedes abrir el repositorio.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function RepositoryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-background/10 rounded-md p-2">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 opacity-75" />
        <span className="text-background/70 text-[10px]">{label}</span>
      </div>
      <p className="mt-1 font-mono text-sm font-bold tabular-nums">
        {value.toLocaleString("es-MX")}
      </p>
    </div>
  );
}

function RepositoryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="text-background/60">{label}</span>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  );
}

function formatRepositoryDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
