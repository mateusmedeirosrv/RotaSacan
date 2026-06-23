// Gera os 3 sons de feedback da tela de bipagem (confirmado/duplicado/erro)
// como tons sintéticos simples, sem dependências externas (sem ffmpeg).
// Placeholder funcional até a equipe trazer sons definitivos.
// Uso: node scripts/gerar-sons-placeholder.mjs

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 44100;

function tom(frequenciaHz, duracaoMs, amplitude = 0.5) {
  const total = Math.round((SAMPLE_RATE * duracaoMs) / 1000);
  const fade = Math.min(Math.round(SAMPLE_RATE * 0.005), Math.floor(total / 4));
  const amostras = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    let envelope = 1;
    if (i < fade) envelope = i / fade;
    else if (i > total - fade) envelope = (total - i) / fade;
    amostras[i] = Math.sin((2 * Math.PI * frequenciaHz * i) / SAMPLE_RATE) * amplitude * envelope;
  }
  return amostras;
}

function silencio(duracaoMs) {
  return new Float32Array(Math.round((SAMPLE_RATE * duracaoMs) / 1000));
}

function concatenar(...partes) {
  const total = partes.reduce((acc, p) => acc + p.length, 0);
  const resultado = new Float32Array(total);
  let offset = 0;
  for (const parte of partes) {
    resultado.set(parte, offset);
    offset += parte.length;
  }
  return resultado;
}

function escreverWav(amostras, caminho) {
  const bytesPorAmostra = 2;
  const dataSize = amostras.length * bytesPorAmostra;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPorAmostra, 28);
  buffer.writeUInt16LE(bytesPorAmostra, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < amostras.length; i++) {
    const valor = Math.max(-1, Math.min(1, amostras[i]));
    buffer.writeInt16LE(Math.round(valor * 32767), 44 + i * bytesPorAmostra);
  }

  writeFileSync(caminho, buffer);
  console.log("✓", caminho);
}

const destino = join(__dirname, "..", "public", "sounds");

escreverWav(tom(1800, 150), join(destino, "confirmado.wav"));
escreverWav(concatenar(tom(900, 100), silencio(80), tom(900, 100)), join(destino, "duplicado.wav"));
escreverWav(tom(300, 500), join(destino, "erro.wav"));
