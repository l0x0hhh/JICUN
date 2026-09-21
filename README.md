# 暨存 · 产品页（JICUN Landing）

> 暨存 App 的产品介绍页：讲清它解决什么问题，并把下载入口放在最显眼的位置。

纯静态单页站点（Vite + React + TypeScript），**部署后不需要任何后端**。页面中英双语，默认跟随浏览器语言，也可以用 `?lang=zh` / `?lang=en` 直接指定。

- 技术栈：Vite · React 19 · TypeScript · motion（滚动视差）· lucide-react（图标）
- 样式：全部在 `src/styles.css`，无 CSS 框架、无预处理器
- 字体：**全部自托管**，不请求 Google Fonts（国内访问慢或被墙时会拖住首屏）
- 页面上的下载按钮指向**本站自己托管的 APK**（`public/downloads/jicun.apk`）：同源直下、无中转页，也不跳 GitHub / Gitee
- **安装包会自动更新**：App 发版时会直接推到本仓库（主路径，见 zongce 仓库的 `LANDING_TOKEN`）；另有 `.github/workflows/sync-apk.yml` 每天兜底拉一次最新包

> **独立项目声明**：暨存是个人独立项目，与任何学校或教育机构均无隶属关系。

## 本地开发

需要 Node.js 20 及以上（本项目在 Node 22 上开发）。

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器（Vite，默认 5173 端口） |
| `npm run build` | 类型检查 + 生产构建，产物在 `dist/` |
| `npm run preview` | 本地预览构建产物 |

`npm run build` 实际执行 `tsc -b && vite build`。只想快速确认能不能打包、跳过类型检查时，可以直接跑 `npx vite build`。

## 目录结构

```
index.html            # 入口，含 favicon / title / description
public/
  logo.png            # 品牌图形（页面与图标共用）
  favicon.ico|16|32   # 标签页图标（裁紧主体的版本）
  apple-touch-icon.png
  fonts/              # 自托管字体子集
src/
  main.tsx            # 挂载入口
  App.tsx             # 页面结构、滚动视差与动效；顶部集中了所有外链常量
  i18n.ts             # 中英文案字典（zh / en 两份必须同步）
  styles.css          # 全部样式
scripts/
  subset-fonts.py     # 重新生成字体子集（见下）
vite.config.ts
```

## 常见修改位置

- **改文案** → `src/i18n.ts` 的 `zh` 与 `en`。两份字典由 TypeScript 强制同构（`en` 的缺字段会直接编译报错）。切换语言时会同步 `<html lang>` 和标签页标题，选择记在 `localStorage['jicun-lang']`。
- **改下载地址 / 外链** → `src/App.tsx` 顶部的 `DOWNLOAD_URL`、`REPO_URL`、`README_URL`、`LICENSE_URL`。**`DOWNLOAD_URL` 指向站内文件 `/downloads/jicun.apk`，发新版时不需要改**——安装包会自动同步（见下），正常情况不用手动碰它。
- **APK 为什么自托管、不链到 Release 页**：安卓浏览器判断"是不是安装包"只看响应头 `Content-Type`。第三方图床/CDN（例如 Gitee 的附件）会把 `.apk` 标成 `application/zip`，浏览器就存成 `xxx.zip`，用户还得手动改后缀；手机端还可能多一个中转页。因此在 `netlify.toml` 里为 `/downloads/*` 强制声明 `Content-Type: application/vnd.android.package-archive` 与 `Content-Disposition: attachment`。
- **安装包的自动同步**：两条路，互为兜底。① 主路径——App 仓库发版时，其 `release.yml` 会把 APK 直接推入本仓库的 `public/downloads/jicun.apk`（需要 App 仓库配 `LANDING_TOKEN`，没配则跳过）；② 兜底——本仓库的 `.github/workflows/sync-apk.yml` 每天（北京时间 09:17）从 App 最新 Release 拉一次，也可在 Actions 里手动触发。App 仓库是公开的，所以兜底这条**不需要任何密钥**。
- **改结构或样式** → `src/App.tsx` + `src/styles.css`。

## 字体（改文案后必看）

页面用的是**按当前可见字符子集化**的 Noto Sans SC（变量字体，覆盖 400–800）和 Space Mono 400 / 700，躺在 `public/fonts/`。子集是静态快照：**文案里出现新字之后必须重新生成**，否则那个字会回退到系统字体，同一屏里出现两种字形。

```bash
npm run dev                                  # 脚本从渲染后的 DOM 里取可见字符，需要先起服务
python scripts/subset-fonts.py               # 默认连 http://127.0.0.1:5173
python scripts/subset-fonts.py 5174          # 也可以指定端口
```

脚本会向 Google Fonts 申请子集并覆盖 `public/fonts/`，跑完重新构建即可。它会顺带打印取到的唯一字符数，方便核对。

## 设计约定

这些是已经定下来的方向，改动前先确认：

- **标题明显重于正文**：H1 字重 `800`、`clamp()` 上限 112px；版心 1440px。
- **不写小字标签（kicker）**：曾经加过一轮小号标签，已全部去掉，不要再加回来。
- **滚动视差**交给 motion 的 `useScroll` / `useTransform` / `useSpring`，不手写 `requestAnimationFrame`；用户开启「减弱动态效果」时自动关闭视差。注意 **motion 的内联 `transform` 会覆盖 CSS 的 `transform`**，`rotate` 要一并交给 motion。
- **字号下限**：页面级文字 ≥ 12.5px，手机演示图内部 ≥ 8px。
- **框线画在容器上，不挂在会位移的卡片 `border` 上**——卡片 `hover` 会 `translateY`，边框会跟着卡片走，线就从边框里"戳"出来了。
- **`overflow: clip` 慎用**：会裁掉探出边界的元素（`right: -Npx`、`rotate()` 的包围盒），圆角被削平成一条直线。要裁装饰元素时单独包一层容器。

## 部署

**目前尚未部署。** 产物是纯静态文件（`dist/`），可以放到任意静态托管：对象存储 + CDN、Vercel / Netlify、GitHub Pages 等。

如果部署在**子路径**下（例如 GitHub Pages 的 `https://<user>.github.io/<repo>/`），必须在 `vite.config.ts` 里设置 `base`，否则 `/logo.png`、`/fonts/*` 这类绝对路径会 404。

## 与 App 仓库的关系

| 仓库 | 内容 |
| --- | --- |
| [`l0x0hhh/zongce`](https://github.com/l0x0hhh/zongce) | 暨存 Android App（Kotlin + Jetpack Compose + Room） |
| 本仓库 | App 的产品页；APK 也托管在这里（`public/downloads/jicun.apk`） |

两个仓库相互独立：本仓库不依赖 App 代码，也不需要 App 先构建。

## 许可证

[MIT](LICENSE)
