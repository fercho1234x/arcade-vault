import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { GamePlayer } from "@/components/game-player";
import { getGame } from "@/lib/games";

export async function generateMetadata({
  params,
}: PageProps<"/jugar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  if (!game) return { title: "Juego no encontrado · Arcade Vault" };
  return {
    title: `Jugando a ${game.title} · Arcade Vault`,
    description: game.short,
  };
}

export default async function PlayPage({ params }: PageProps<"/jugar/[id]">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
