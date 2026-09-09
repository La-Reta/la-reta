import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

import { isClerkConfigured } from "@/components/auth-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Surface } from "@/components/ui/surface";
import { Motion, Palette, Radius, Spacing } from "@/constants/theme";
import { useMatchComments } from "@/hooks/use-match-comments";
import { formatMatchDate } from "@/lib/dates";
import {
  deleteMatchReview,
  editMatchReview,
  postMatchReview,
  toggleMatchReaction,
} from "@/lib/match-comments";
import type { MatchReview } from "@/lib/types";

const MAX_BODY = 500;
const STARS = [1, 2, 3, 4, 5] as const;
const AVATAR = 34;

/** Los mismos seis de la web: una reta se comenta con estos. */
const REACTIONS = ["⚽", "🔥", "👏", "😂", "💪", "🐐"] as const;

/**
 * "La reta según ustedes": las reseñas de un partido.
 *
 * Mismas reglas que las de un jugador —sesión para escribir, solo la propia se
 * edita o se borra, tope de texto— pero otra forma, porque la pregunta es otra.
 * En una ficha importa la media de alguien a lo largo de meses; aquí importa
 * **cómo se sintió una tarde**, y eso lo cuenta el reparto de notas mejor que
 * el promedio: un 3.0 de "todos pusieron 3" y un 3.0 de "mitad cincos, mitad
 * unos" son dos retas distintas y en un número suelto se leen igual.
 *
 * Las reacciones piden sesión igual que el texto. En la web una reacción
 * anónima se apoya en un id del navegador, que es lo mejor que hay ahí; aquí
 * hay cuenta, y atarla a ella es a la vez más simple y más difícil de inflar.
 */
export function MatchVoices({ matchId }: { matchId: string }) {
  const { user } = useUser();
  const userId = isClerkConfigured ? (user?.id ?? "") : "";
  const { data, error, loading, refetch } = useMatchComments(matchId, userId);

  const reviews = data?.comments ?? [];
  const average = data?.rating.average ?? null;

  if (loading && data === null) {
    return <ActivityIndicator color={Palette.accent} />;
  }

  if (error !== null) {
    return (
      <Notice
        actionLabel="Reintentar"
        detail={error}
        onAction={refetch}
        title="No pudimos leer las reseñas"
      />
    );
  }

  return (
    <View style={{ gap: Spacing.three }}>
      {average === null ? null : (
        <RatingSpread average={average} reviews={reviews} />
      )}

      {userId === "" ? (
        <Text tone="faint" variant="caption">
          Inicia sesión para contar qué te pareció la reta.
        </Text>
      ) : (
        <Composer matchId={matchId} onDone={refetch} />
      )}

      {reviews.length === 0 ? (
        <Text tone="faint" variant="caption">
          Nadie ha dicho nada de esta reta todavía.
        </Text>
      ) : (
        reviews.map((review) => (
          <ReviewRow
            canReact={userId !== ""}
            key={review.id}
            matchId={matchId}
            onDone={refetch}
            review={review}
          />
        ))
      )}
    </View>
  );
}

/**
 * Nota media y reparto de las cinco notas.
 *
 * Las barras son el motivo de que esto no sea la cabecera de una ficha: con
 * seis reseñas de una tarde, ver que tres pusieron cinco y una puso uno cuenta
 * la discusión que hubo. La media sola la esconde.
 */
function RatingSpread({
  average,
  reviews,
}: {
  average: number;
  reviews: MatchReview[];
}) {
  const counts = STARS.map(
    (star) => reviews.filter((r) => r.rating === star).length
  );
  const top = Math.max(1, ...counts);
  const votes = counts.reduce((total, n) => total + n, 0);

  return (
    <Surface
      style={{ flexDirection: "row", gap: Spacing.four, padding: Spacing.four }}
    >
      <View style={{ alignItems: "center", gap: Spacing.half }}>
        <Text selectable variant="display">
          {average.toFixed(1)}
        </Text>
        <StarsRow value={Math.round(average)} />
        <Text tone="faint" variant="eyebrow">
          {votes} {votes === 1 ? "nota" : "notas"}
        </Text>
      </View>

      <View style={{ flex: 1, gap: Spacing.one, justifyContent: "center" }}>
        {[...STARS].reverse().map((star) => {
          const n = counts[star - 1] ?? 0;
          return (
            <View
              key={star}
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: Spacing.two,
              }}
            >
              <Text tone="faint" variant="eyebrow">
                {star}
              </Text>
              <View
                style={{
                  backgroundColor: Palette.surfaceSunken,
                  borderRadius: Radius.pill,
                  flex: 1,
                  height: 6,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    backgroundColor: Palette.star,
                    borderRadius: Radius.pill,
                    height: "100%",
                    width: `${(n / top) * 100}%`,
                  }}
                />
              </View>
              <Text style={{ width: 16 }} tone="faint" variant="eyebrow">
                {n}
              </Text>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

/** Cinco estrellas de solo lectura. */
function StarsRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {STARS.map((star) => (
        <Icon
          color={star <= value ? Palette.star : Palette.starLine}
          key={star}
          name={star <= value ? "star-fill" : "star"}
          size={size}
        />
      ))}
    </View>
  );
}

/** Cinco estrellas pulsables. Tocar la que ya estaba quita la nota. */
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: Spacing.one }}>
      {STARS.map((star) => (
        <Pressable
          accessibilityLabel={`${star} de 5`}
          accessibilityRole="button"
          accessibilityState={{ selected: value >= star }}
          hitSlop={6}
          key={star}
          onPress={() => onChange(value === star ? 0 : star)}
        >
          <Icon
            color={star <= value ? Palette.star : Palette.starLine}
            name={star <= value ? "star-fill" : "star"}
            size={26}
          />
        </Pressable>
      ))}
    </View>
  );
}

function Composer({
  matchId,
  onDone,
}: {
  matchId: string;
  onDone: () => void;
}) {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setFailed(null);
    try {
      await postMatchReview(matchId, { body, rating });
      setBody("");
      setRating(0);
      onDone();
    } catch (cause) {
      setFailed(cause instanceof Error ? cause.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <StarPicker onChange={setRating} value={rating} />
        <Text tone="faint" variant="caption">
          Opcional
        </Text>
      </View>

      <TextInput
        maxLength={MAX_BODY}
        multiline
        onChangeText={setBody}
        placeholder="¿Cómo estuvo la reta? El nivel, el ambiente, la cancha…"
        placeholderTextColor={Palette.inkFaint}
        style={{
          borderColor: Palette.line,
          borderRadius: Radius.md,
          borderWidth: 1,
          color: Palette.ink,
          fontSize: 16,
          lineHeight: 22,
          minHeight: 84,
          padding: Spacing.three,
          textAlignVertical: "top",
        }}
        value={body}
      />

      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text tone="faint" variant="caption">
          {MAX_BODY - body.length}
        </Text>
        <Button
          disabled={sending || body.trim() === ""}
          label="Publicar"
          onPress={send}
        />
      </View>

      {failed === null ? null : (
        <Text tone="danger" variant="caption">
          {failed}
        </Text>
      )}
    </Surface>
  );
}

function ReviewRow({
  matchId,
  review,
  canReact,
  onDone,
}: {
  matchId: string;
  review: MatchReview;
  canReact: boolean;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: Spacing.three,
        }}
      >
        <Avatar review={review} />

        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text numberOfLines={1} variant="bodyStrong">
            {review.author ?? "Anónimo"}
          </Text>
          <Text tone="faint" variant="caption">
            {formatMatchDate(review.createdAt)}
          </Text>
        </View>

        {review.rating === null ? null : <StarsRow value={review.rating} />}
      </View>

      {editing ? (
        <Editor
          matchId={matchId}
          onDone={() => {
            setEditing(false);
            onDone();
          }}
          review={review}
        />
      ) : (
        <Text selectable variant="body">
          {review.body}
        </Text>
      )}

      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: Spacing.two,
          justifyContent: "space-between",
        }}
      >
        <ReactionRow
          canReact={canReact}
          commentId={review.id}
          matchId={matchId}
          onDone={onDone}
          review={review}
        />

        {review.mine && !editing ? (
          <View style={{ flexDirection: "row", gap: Spacing.two }}>
            <Pressable
              accessibilityLabel="Editar mi reseña"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setEditing(true)}
            >
              <Icon color={Palette.inkFaint} name="pencil" size={18} />
            </Pressable>
            <Pressable
              accessibilityLabel="Borrar mi reseña"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setConfirming(true)}
            >
              <Icon color={Palette.inkFaint} name="trash" size={18} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {confirming ? (
        <ConfirmDialog
          confirmLabel="Borrar"
          destructive
          detail="Se quita de la lista y no se puede deshacer."
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            deleteMatchReview(matchId, review.id)
              .then(onDone)
              .catch(() => {
                // La reseña sigue ahí; el siguiente refresco la vuelve a traer.
              });
          }}
          title="¿Borrar tu reseña?"
        />
      ) : null}
    </Surface>
  );
}

function Avatar({ review }: { review: MatchReview }) {
  const initials = (review.author ?? "?").slice(0, 2).toUpperCase();

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: Palette.accentSoft,
        borderRadius: AVATAR / 2,
        height: AVATAR,
        justifyContent: "center",
        overflow: "hidden",
        width: AVATAR,
      }}
    >
      {review.authorImageUrl === null ? (
        <Text tone="accent" variant="eyebrow">
          {initials}
        </Text>
      ) : (
        <Image
          accessibilityIgnoresInvertColors
          alt={review.author ?? "Autor"}
          contentFit="cover"
          source={{ uri: review.authorImageUrl }}
          style={{ height: "100%", width: "100%" }}
          transition={Motion.quick}
        />
      )}
    </View>
  );
}

function Editor({
  matchId,
  review,
  onDone,
}: {
  matchId: string;
  review: MatchReview;
  onDone: () => void;
}) {
  const [body, setBody] = useState(review.body);
  const [rating, setRating] = useState(review.rating ?? 0);
  const [saving, setSaving] = useState(false);

  return (
    <View style={{ gap: Spacing.two }}>
      <StarPicker onChange={setRating} value={rating} />
      <TextInput
        maxLength={MAX_BODY}
        multiline
        onChangeText={setBody}
        style={{
          borderColor: Palette.line,
          borderRadius: Radius.md,
          borderWidth: 1,
          color: Palette.ink,
          fontSize: 16,
          lineHeight: 22,
          minHeight: 72,
          padding: Spacing.three,
          textAlignVertical: "top",
        }}
        value={body}
      />
      <View
        style={{
          flexDirection: "row",
          gap: Spacing.two,
          justifyContent: "flex-end",
        }}
      >
        <Button label="Cancelar" onPress={onDone} variant="ghost" />
        <Button
          disabled={saving || body.trim() === ""}
          label="Guardar"
          onPress={async () => {
            setSaving(true);
            try {
              await editMatchReview(matchId, review.id, { body, rating });
              onDone();
            } finally {
              setSaving(false);
            }
          }}
        />
      </View>
    </View>
  );
}

/**
 * Las reacciones se pintan al instante y el servidor confirma después: el viaje
 * a Neon tarda cerca de un segundo, y un emoji que no responde hasta entonces
 * se siente roto. Si el servidor dice que no, se vuelve a lo que él diga.
 */
function ReactionRow({
  matchId,
  commentId,
  review,
  canReact,
  onDone,
}: {
  matchId: string;
  commentId: number;
  review: MatchReview;
  canReact: boolean;
  onDone: () => void;
}) {
  const [counts, setCounts] = useState(review.reactions);
  const [mine, setMine] = useState(new Set(review.myReactions));

  const toggle = async (emoji: string) => {
    const on = mine.has(emoji);
    const nextMine = new Set(mine);
    if (on) {
      nextMine.delete(emoji);
    } else {
      nextMine.add(emoji);
    }
    setMine(nextMine);
    setCounts((current) => ({
      ...current,
      [emoji]: Math.max(0, (current[emoji] ?? 0) + (on ? -1 : 1)),
    }));

    try {
      await toggleMatchReaction(matchId, commentId, emoji, "");
      onDone();
    } catch {
      // El servidor manda: se deshace lo que se pintó.
      setMine(new Set(review.myReactions));
      setCounts(review.reactions);
    }
  };

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.one }}>
      {REACTIONS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const on = mine.has(emoji);
        // Sin sesión solo se enseñan las que ya tienen cuenta: una fila de
        // emojis en cero que además no se pueden tocar es ruido.
        if (!canReact && count === 0) {
          return null;
        }
        return (
          <Pressable
            accessibilityLabel={`Reaccionar ${emoji}`}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            disabled={!canReact}
            key={emoji}
            onPress={() => toggle(emoji)}
            style={{
              alignItems: "center",
              backgroundColor: on ? Palette.accentSoft : Palette.surfaceSunken,
              borderColor: on ? Palette.accentLine : "transparent",
              borderRadius: Radius.pill,
              borderWidth: 1,
              flexDirection: "row",
              gap: Spacing.one,
              opacity: count === 0 ? 0.55 : 1,
              paddingHorizontal: Spacing.two,
              paddingVertical: Spacing.half,
            }}
          >
            <Text variant="caption">{emoji}</Text>
            {count > 0 ? (
              <Text tone={on ? "accent" : "muted"} variant="caption">
                {count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
