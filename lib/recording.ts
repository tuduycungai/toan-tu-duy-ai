export async function recordingWav(blob: Blob): Promise<string> {
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
    const seconds = Math.min(audio.duration, 15);
    if (seconds < 0.4) throw Error('Đoạn ghi âm quá ngắn. Em thử đọc lại từ hoặc câu.');
    const length = Math.floor(seconds * 16000),
      buffer = new ArrayBuffer(44 + length * 2),
      view = new DataView(buffer);
    const str = (offset: number, s: string) =>
      [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    str(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    str(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, length * 2, true);
    const channels = Array.from({ length: audio.numberOfChannels }, (_, i) =>
      audio.getChannelData(i),
    );
    // Average the source samples in each output interval before reducing the sample rate.
    for (let i = 0; i < length; i++) {
      const a = Math.floor((i * audio.sampleRate) / 16000),
        b = Math.max(a + 1, Math.floor(((i + 1) * audio.sampleRate) / 16000));
      let sum = 0,
        count = 0;
      for (let j = a; j < b; j++)
        for (const c of channels) {
          sum += c[Math.min(j, c.length - 1)];
          count++;
        }
      const v = Math.max(-1, Math.min(1, sum / count));
      view.setInt16(44 + i * 2, Math.round(v * (v < 0 ? 32768 : 32767)), true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  } finally {
    await ctx.close();
  }
}
