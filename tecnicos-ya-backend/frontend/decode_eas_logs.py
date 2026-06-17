from pathlib import Path
import zlib
import gzip
import bz2
import zstandard
import brotli
import lz4.frame as lz4frame

for fn in ["log1.txt", "log2.txt"]:
    path = Path(fn)
    print("---", fn)
    if not path.exists():
        print("missing")
        continue
    data = path.read_bytes()
    print("len", len(data))
    print("head", data[:16].hex())
    print("tail", data[-16:].hex())
    print("ascii head", "".join(chr(b) if 32 <= b < 127 else "." for b in data[:120]))
    sigs = [
        (bytes.fromhex("1f8b"), "gzip"),
        (bytes.fromhex("789c"), "zlib"),
        (bytes.fromhex("7801"), "zlib"),
        (b"BZh", "bz2"),
        (bytes.fromhex("504b0304"), "zip"),
        (bytes.fromhex("28b52ffd"), "zstd"),
        (bytes.fromhex("ceb2cf81"), "brotli"),
        (bytes.fromhex("04224d18"), "lz4"),
    ]
    print("signatures:", [(name, data.find(sig)) for sig, name in sigs])
    funcs = [
        ("raw-deflate", lambda d: zlib.decompress(d, -zlib.MAX_WBITS)),
        ("zlib", lambda d: zlib.decompress(d)),
        ("gzip", lambda d: gzip.decompress(d)),
        ("bz2", lambda d: bz2.decompress(d)),
        ("brotli", lambda d: brotli.decompress(d)),
        ("zstd", lambda d: zstandard.ZstdDecompressor().decompress(d)),
        ("lz4", lambda d: lz4frame.decompress(d)),
    ]
    for name, func in funcs:
        try:
            out = func(data)
            print("success", name, "len", len(out))
            print(out[:300])
            break
        except Exception as e:
            print("fail", name, type(e).__name__, e)
