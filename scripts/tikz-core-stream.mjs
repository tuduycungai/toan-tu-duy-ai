/** Stream a trusted, fixed-size TeX core into the target WASM buffer without a dump copy. */
export async function streamCoreToMemory(memory, response, makeInflater) {
  if (!response.ok || !response.body) throw Error('Không tải được dữ liệu TeX theo luồng.');
  const bytes = new Uint8Array(memory.buffer),
    reader = response.body.getReader(),
    inflater = makeInflater();
  let offset = 0;
  inflater.onData = (chunk) => {
    if (offset + chunk.byteLength > bytes.length)
      throw Error('Dữ liệu TeX vượt kích thước bộ nhớ cố định.');
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  };
  inflater.onEnd = (status) => {
    inflater.err = status;
    inflater.msg = inflater.strm.msg;
    inflater.chunks = [];
  };
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      inflater.push(result.value, false);
      if (inflater.err) throw Error('Dữ liệu TeX nén không hợp lệ.');
    }
    if (!inflater.ended) inflater.push(new Uint8Array(0), true);
    if (inflater.err || offset !== bytes.length) throw Error('Dữ liệu TeX chưa tải đủ.');
    return memory;
  } catch (error) {
    try {
      await reader.cancel();
    } catch {}
    throw error;
  } finally {
    reader.releaseLock();
  }
}
