#!/usr/bin/env python3
"""重新生成 public/fonts/ 里的字体子集（页面文案改动后必须跑一次）。

原理：用无头 Chrome 抓取 dev server 渲染后的 DOM，取出页面上真实出现的字符，
再向 Google Fonts 申请只含这些字符的 woff2 子集并落盘。这样页面上的字体
完全自托管，既不用请求 Google Fonts，体积也压到几十 KB。

用法：
    npm run dev                       # 必须先起 dev server，脚本从渲染结果里取字
    python scripts/subset-fonts.py    # 默认连 http://127.0.0.1:5173
    python scripts/subset-fonts.py 5174

环境变量：
    FONT_SUBSET_URL   直接指定完整地址（优先于端口参数）
    CHROME_PATH       指定 Chrome 可执行文件

注意：子集是静态快照。只改了 HTML 里写死的字（比如 index.html 的 title / description）
也要重跑，否则那些字会回退到系统字体。
"""

import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
CHROME = os.environ.get("CHROME_PATH") or r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# 页面用到的 ASCII、中文标点和常见符号兜底，避免某些字只在图片/伪元素里出现而漏掉。
ASCII = "".join(chr(c) for c in range(0x20, 0x7F))
CJK_PUNCT = "，。、；：？！“”‘’（）《》〈〉【】—…·「」"
EXTRA = "0123456789"


def page_url() -> str:
    if os.environ.get("FONT_SUBSET_URL"):
        return os.environ["FONT_SUBSET_URL"]
    port = sys.argv[1] if len(sys.argv) > 1 else "5173"
    return f"http://127.0.0.1:{port}"


def visible_text(url: str) -> str:
    # 直连，绕开系统代理：装了代理的机器上，代理可能对 127.0.0.1 也返回一个假响应
    # （见过回 200 也见过回 502），那样这里的存活检查就失去意义了。
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(url, timeout=5) as r:
            r.read(1)
    except urllib.error.URLError as e:
        sys.exit(f"连不上 {url}（{e}）。请先 `npm run dev`，或用参数指定端口。")

    dom = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--no-proxy-server",
         "--virtual-time-budget=5000", "--dump-dom", url],
        capture_output=True, text=True, encoding="utf-8", errors="ignore",
    ).stdout
    if not dom.strip():
        sys.exit(f"Chrome 没有返回内容，检查 CHROME_PATH 是否正确：{CHROME}")

    dom = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", dom)
    dom = re.sub(r"<[^>]+>", " ", dom)
    return re.sub(r"&[a-z]+;", " ", dom)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read().decode("utf-8")


def grab(css: str, prefix: str) -> list[str]:
    saved: list[str] = []
    seen: dict[str, str] = {}
    for block in re.findall(r"@font-face\s*\{[\s\S]*?\}", css):
        url = re.search(r"url\((https://[^)]+)\)", block)
        weight = re.search(r"font-weight:\s*([\d\s]+);", block)
        if not url:
            continue
        w = weight.group(1).strip().replace(" ", "-") if weight else "400"
        url = url.group(1)
        if url in seen:  # 变量字体同一个文件服务多个字重，只存一份
            saved.append(f"{seen[url]}  (weight {w} 复用同一文件)")
            continue
        out = FONTS / f"{prefix}-{w}.woff2"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as r:
            out.write_bytes(r.read())
        seen[url] = out.name
        saved.append(f"{out.name}  {out.stat().st_size / 1024:.1f}KB")
    return saved


def main() -> None:
    FONTS.mkdir(parents=True, exist_ok=True)
    url = page_url()
    text = visible_text(url)

    chars = {c for c in (set(text) | set(ASCII) | set(CJK_PUNCT) | set(EXTRA)) if not c.isspace()}
    ordered = "".join(sorted(chars))
    print(f"来源: {url}")
    print(f"页面可见唯一字符数: {len(ordered)}")
    print(f"其中非 ASCII: {''.join(sorted(c for c in chars if ord(c) > 0x2000))}")

    text_param = urllib.parse.quote(ordered, safe="")
    noto = fetch(
        "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800"
        f"&display=swap&text={text_param}"
    )
    for line in grab(noto, "noto-sans-sc"):
        print(" ", line)

    mono_text = urllib.parse.quote("".join(sorted(set(ASCII) | set("·—"))), safe="")
    mono = fetch(
        f"https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap&text={mono_text}"
    )
    for line in grab(mono, "space-mono"):
        print(" ", line)

    print(f"完成，目录: {FONTS}")
    print("styles.css 里 Noto Sans SC 声明为 font-weight: 400 800（单文件变量字体），换了文件名记得同步。")


if __name__ == "__main__":
    main()
