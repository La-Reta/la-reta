import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdmin } from "@/lib/admin";
import { formatShortDate } from "@/lib/dates";
import { RetaWord } from "@/lib/db";
import { ClockIcon, GlobeIcon, SmartphoneIcon } from "lucide-react";
import { WordAdminActions } from "./word-admin-actions";

export const WordItem = async ({ word }: { readonly word: RetaWord }) => {
  const admin = await isAdmin();

  return (
    <Card key={word.id}>
      <CardHeader>
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          La Reta{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {word.word}
          </span>
        </CardTitle>
        {admin ? (
          <CardAction className="flex flex-wrap gap-2">
            <WordAdminActions
              id={word.id}
              word={word.word}
              author={word.author}
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <Badge variant="ghost">{word.author ?? "Anónimo"}</Badge>
        <Badge variant="ghost">{formatShortDate(word.createdAt)}</Badge>
        {word.language || word.timezone || word.screen ? (
          <p className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {word.language ? (
              <WordIconItem>
                <GlobeIcon /> {word.language}
              </WordIconItem>
            ) : null}
            {word.timezone ? (
              <WordIconItem>
                <ClockIcon /> {word.timezone}
              </WordIconItem>
            ) : null}
            {word.screen ? (
              <WordIconItem>
                <SmartphoneIcon /> {word.screen}
              </WordIconItem>
            ) : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

const WordIconItem = ({ children }: { readonly children: React.ReactNode }) => {
  return <Badge variant="secondary">{children}</Badge>;
};
