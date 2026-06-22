import { randomInt } from "crypto";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function gerarSenhaTemporaria(tamanho = 12) {
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += ALFABETO[randomInt(0, ALFABETO.length)];
  }
  return senha;
}
