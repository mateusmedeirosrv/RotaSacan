"use client";

const TAMANHO_POOL = 3;
const pools = new Map<string, { elementos: HTMLAudioElement[]; proximo: number }>();

export function tocarSom(url: string) {
  let pool = pools.get(url);
  if (!pool) {
    pool = {
      elementos: Array.from({ length: TAMANHO_POOL }, () => new Audio(url)),
      proximo: 0,
    };
    pools.set(url, pool);
  }

  const audio = pool.elementos[pool.proximo];
  pool.proximo = (pool.proximo + 1) % pool.elementos.length;

  audio.currentTime = 0;
  audio.play().catch(() => {});
}
