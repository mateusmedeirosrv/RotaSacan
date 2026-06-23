// Gera os ícones de instalação do PWA (192x192 e 512x512) como um PNG
// sólido simples, sem dependências externas (sem ffmpeg/canvas).
// Placeholder funcional até a equipe trazer a logo definitiva.
// Uso: node scripts/gerar-icones-placeholder.mjs

import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CRC_TABLE = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabela[n] = c;
  }
  return tabela;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dados) {
  const tipoBuf = Buffer.from(tipo, "ascii");
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tipoBuf, dados])), 0);
  return Buffer.concat([tamanho, tipoBuf, dados, crc]);
}

function gerarPng(tamanho, caminho, [r, g, b]) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const linha = Buffer.alloc(1 + tamanho * 3); // byte 0 = filtro "none"
  for (let x = 0; x < tamanho; x++) {
    linha[1 + x * 3] = r;
    linha[1 + x * 3 + 1] = g;
    linha[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.concat(Array.from({ length: tamanho }, () => linha));
  const idat = deflateSync(raw);

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  writeFileSync(caminho, png);
  console.log("✓", caminho);
}

const destino = join(__dirname, "..", "public");
const PRETO = [17, 17, 17];

gerarPng(192, join(destino, "icon-192.png"), PRETO);
gerarPng(512, join(destino, "icon-512.png"), PRETO);
