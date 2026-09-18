# 单词冲刺 · WordRush

<p align="center">
  <img src="assets/logo.svg" alt="单词冲刺 WordRush" width="420">
</p>

一个**纯前端、零后端、零依赖**的单词冲刺 WordRush。面向英语四六级学习，同时支持任意自定义内容。

打开网页就能练 —— 不用安装、不用注册、不用服务器，所有数据都存在你自己的浏览器里。

```
内置词书：四级大纲词汇 4540 词 + 六级大纲词汇 2220 词（官方大纲全量，99.7% 带音标）
        ＋四级精选 466 词 + 六级精选 264 词 + 常用短句 61 句 + 段落文章 10 段
网络内容源：VOA / BBC Learning English 风格选段 12 篇（一键加载）
打字模式：看英文打英文（自动发音＋音标）/ 看中文打英文 / 听发音打英文
判错模式：严格模式 / 宽松模式 / 整句模式
长词库支持：按顺序连续练习，自动记住「练到第几条」
```

---

## 功能一览

### 1. 三种练习模式（可随时切换）

| 模式 | 屏幕上显示什么 | 练什么 |
|---|---|---|
| **看英文打英文** | 完整英文原文 + 中文释义提示，**进入题目时自动朗读一遍** | 打字速度、肌肉记忆、发音记忆 |
| **看中文打英文** | 只显示中文意思，英文被遮盖为 `•••`（**不朗读**，见下方说明） | 主动回忆、拼写 |
| **听发音打英文** | 只播放发音，不显示原文 | 听力、拼写 |

> 「看中文打英文」和「听发音打英文」会遮盖原文，但会保留**字数和空格位置**作为提示 —— 否则纯靠记忆盲打会过于困难，失去练习意义。

### 2. 三种打错处理模式（可随时切换）

| 模式 | 行为 | 适合 |
|---|---|---|
| **严格模式** | 打错就卡住，错误字符无法输入，必须打对才能继续 | 初学，养成正确肌肉记忆 |
| **宽松模式** | 照单全收，错的字母标红，最后统计正确率 | 练速度，不怕出错 |
| **整句模式** | 整句打完再按 <kbd>Enter</kbd> 统一判卷，列出所有不同之处 | 模拟真实考试场景 |

### 3. 内容源

| 分类 | 内容 | 数量 | 说明 |
|---|---|---|---|
| 词库 | **四级大纲词汇** | **4540 词** | 官方四级大纲全量，99.8% 带音标 |
| 词库 | **六级大纲词汇** | **2220 词** | 官方六级大纲全量，99.7% 带音标 |
| 词库 | 四级核心词（精选） | 466 词 | 手写精选，适合快速过一遍 |
| 词库 | 六级核心词（精选） | 264 词 | 手写精选 |
| 短句 | 常用短句 | 61 句 | 日常与考试句型，练标点 |
| 文章 | 段落文章 | 10 段 | 练连续输入 |
| 网络内容源 | VOA 慢速英语风格 | 4 篇 | 内置选段，一键加载 |
| 网络内容源 | BBC Learning English 风格 | 4 篇 | 内置选段 |
| 网络内容源 | 每日精选短文 | 4 篇 | 科技与生活主题 |
| **自定义** | 粘贴任意英文文本，自动拆成词 / 句 / 段 | 不限 | 可配中文释义 |

两本大纲词库由 [`tools/build-wordbook.mjs`](tools/build-wordbook.mjs) 从公开词表生成，
带音标、按字母序排列；想换数据源或更新词库，改脚本重跑即可。

### 3.1 长词库怎么用（顺序练习 + 进度记忆）

4540 个词如果每轮都随机抽 20 个，等于永远练不到后面 —— 所以做了「顺序模式」：

1. 打开 **设置 → 练习 → 关掉「打乱顺序」**
2. 练习区右上角会显示 **「第 1–20 / 4540 条」**
3. 每开始一轮自动接着上次的位置；练到末尾自动绕回开头
4. 想从头再来：**设置 → 数据 → 重置练习进度**

进度记在本机，导出备份时会一并带走。

### 3.2 音标显示

「看英文打英文」模式下会在提示区显示音标（如 `/əˈbændən/`），可在
**设置 → 练习 → 显示音标** 里关掉。

> ⚠️ 音标**只在「看英文打英文」模式显示**。因为音标基本等同于把拼写念出来，
> 在「看中文打英文」和「听音打英文」里显示会直接泄露答案。

### 4. 界面与体验

- **三套主题**：浅色 / 深色 / 学习风（卡片 + 大圆角 + 柔和配色，类似 Duolingo）
- **中英双语界面**：右上角一键切换
- **四档字号**：小 / 中 / 大 / 特大
- **完全响应式**：电脑、平板、手机都能用
- **实时反馈**：逐字符着色、光标跟随、打错抖动、连击高亮气泡

### 5. 数据记录

- 成绩记录：每次练习的 WPM、正确率、字符数、用时、最高连击、得分
- 走势图：最近 20 轮的 WPM 变化（Canvas 手绘，无图表库依赖）
- 打卡与每日目标：连续练习天数、今日进度
- **导出 / 导入 JSON 备份**：换电脑、换浏览器都能搬过去

### 6. 趣味与激励 —— **每一项都能单独关掉**

| 功能 | 说明 |
|---|---|
| 连击 Combo | 连续打对字符数，达到 20 / 50 有高亮特效 |
| 得分 Score | 正确字符 × 连击倍率 − 错误扣分 |
| 进度条 | 本轮完成百分比 |
| 打字音效 | 用 Web Audio 现场合成，**不含任何音频文件** |
| 每日目标 | 自定义每日练习分钟数（5 ~ 60 分钟） |
| 成就徽章 | 18 个徽章，从「启程」到「月度铁人」「夜猫子」 |
| 连续打卡 | 记录连续练习天数 |

> 不喜欢任何一项？打开「设置」把它们逐个关掉即可，界面会立刻变得干净。

---

## 免费词库与 API 的评估结论

选型时逐项实测过一批公开资源。**结论先说：只有词库和发音接口能真正落地，
Tatoeba 与 Hugging Face 数据集在纯前端架构下用不了。** 以下是实测数据与判断依据。

### 已接入 ✅

| 资源 | 用途 | 实测结果 | 落地方式 |
|---|---|---|---|
| **mahavivo/english-wordlists** | 四级/六级大纲词库 | jsDelivr 可直连，500ms，允许跨域 | 已生成为内置词书（4540 + 2220 词，含音标） |
| **有道词典 dictvoice** | 单词发音 | **111ms**，音质接近真人 | 自动发音链路首选 |
| **Free Dictionary API** | 真人录音 | 响应 **约 20 秒**；CORS 允许 | 已接入，但**只作为手动选项**（见下文说明） |
| **浏览器 SpeechSynthesis** | 兜底发音 | 无网络依赖，永远可用 | 链路最后一环 |



### 词库来源与授权（请留意）

新增的两本大纲词书由 [`tools/build-wordbook.mjs`](tools/build-wordbook.mjs) 生成，数据来自：

- 仓库：`mahavivo/english-wordlists`
- 文件：`CET4_edited.txt`、`CET6_edited.txt`
- 通道：jsDelivr CDN（GitHub 在国内常不可直连）

> ⚠️ **该仓库未声明开源协议。** 词条本身来自公开的四六级考试大纲词汇表，
> 中文释义由该仓库整理。本项目在文件头部和数据来源提示里都做了标注。
> **如果你要把本站公开分发，请自行评估是否需要取得许可**，或改用自己整理 /
> 已获授权的词库 —— 只需替换 `tools/build-wordbook.mjs` 里的数据源再重跑一次。
>
> 不想要这些数据？直接删掉 `assets/js/data/wordbook-cet4.js`、
> `wordbook-cet6.js`，并在 `index.html` 中移除对应两行 `<script>` 即可，
> 网站会自动退回只使用手写精选内容。

---

## 快速开始

### 方式 A：直接双击打开（最简单）

下载本项目，**双击 `index.html`** 即可。

> 项目使用传统 `<script>` 而非 ES Module，正是为了让 `file://` 协议也能直接运行。
> 无需 Node.js、无需本地服务器。

### 方式 B：本地服务器打开（推荐日常使用）

某些浏览器在 `file://` 下会禁用 localStorage（导致数据无法保存）。用一条命令起个本地服务器即可解决：

```bash
# 任选一种，在项目根目录执行

# Python 3（装了 Python 就有）
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

然后浏览器打开 <http://localhost:8000>。

### 方式 C：部署到线上（手机也能用）

见下一节。

---

## 部署到 GitHub Pages（推荐）

全过程免费，国内访问速度尚可，且不需要任何构建步骤 —— **本项目没有 `npm install`，没有打包，推上去就是成品**。

### 第 1 步：在 GitHub 建仓库

1. 登录 <https://github.com>，点右上角 **`+` → New repository**
2. Repository name 填 `wordrush`（或你喜欢的名字）
3. 选择 **Public**（公开；GitHub Pages 免费版要求公开仓库）
4. **不要**勾选 "Add a README file"
5. 点 **Create repository**

### 第 2 步：上传代码

#### 会用命令行（推荐）

```bash
# 进入项目目录
cd wordrush

# 初始化仓库
git init
git add .
git commit -m "first commit: 单词冲刺 WordRush"

# 把下面的 你的用户名 换成你自己的 GitHub 用户名
git branch -M main
git remote add origin https://github.com/你的用户名/wordrush.git
git push -u origin main
```

#### 不会命令行（网页拖拽上传）

1. 在新仓库页面点 **uploading an existing file**
2. 把项目里的**所有文件和文件夹**拖进去
   ⚠️ 注意：`index.html` 必须在**仓库根目录**，不能套一层文件夹
3. 下方 Commit changes 点一下

### 第 3 步：开启 Pages

1. 进入仓库 → **Settings**（设置）
2. 左侧菜单找到 **Pages**
3. **Source** 选 `Deploy from a branch`
4. **Branch** 选 `main`，文件夹选 `/ (root)`，点 **Save**
5. 等 1 ~ 2 分钟，刷新页面，顶部会出现网址：

```
https://你的用户名.github.io/wordrush/
```

这就是你的专属练习网站，手机、平板、别人的电脑都能打开。

> **更新内容**：以后改了代码，重新 `git add . && git commit -m "update" && git push` 即可，Pages 会自动重新发布（约 1 分钟）。

> **关于 `.nojekyll`**：本项目已包含这个空文件。它的作用是告诉 GitHub Pages 跳过 Jekyll 处理，避免以 `_` 开头的文件被忽略。删了大概率也没事，但留着更稳妥。

---

## 部署到 Vercel / Netlify / Cloudflare Pages

三者都是「连上 GitHub 仓库 → 自动部署」，比 GitHub Pages 更快，且支持自定义域名。配置几乎一样：

| 平台 | 操作入口 | 关键配置 |
|---|---|---|
| **Vercel** | <https://vercel.com/new> → Import Git Repository | Framework Preset 选 **Other**，Build Command 留空，Output Directory 留空 |
| **Netlify** | <https://app.netlify.com> → Add new site → Import an existing project | Build command 留空，Publish directory 填 `.` |
| **Cloudflare Pages** | <https://dash.cloudflare.com> → Workers & Pages → Create → Pages → Connect to Git | Build output directory 填 `/` |

**共同要点：因为本项目是纯静态网站，没有构建过程，所以所有「构建命令」都留空。** 填了反而会报错。

不想连 GitHub 也可以直接把整个文件夹拖进 Netlify 的部署框，秒出链接。


## 发音接口与降级策略

发音按下面的顺序**自动尝试，任何一个成功就停**：

```
① 有道词典发音接口   https://dict.youdao.com/dictvoice?audio=<单词>&type=2
                     （type=1 英音，type=2 美音；音质接近真人录音；实测 111ms）
        ↓ 失败
② 百度翻译 TTS 接口  https://tts.baidu.com/text2audio?...
        ↓ 失败
③ 浏览器自带语音     SpeechSynthesis API（音质一般，但永远能出声）
```

可选的发音源有 4 个，外加一个「自动」，**在设置 → 发音 → 发音来源里可以固定使用某一个**：

| 选项 | 说明 |
|---|---|
| 自动（推荐） | 按上面的 ①②③ 依次尝试 |
| 有道词典发音 | 只试有道，失败仍会兜底到浏览器语音 |
| 百度翻译发音 | 只试百度，同上 |
| **Free Dictionary 真人录音** | 真人录音，音质最好；但实测约 20 秒才响应，**不在自动链路里**，只能手动选 |
| 浏览器自带语音 | 强制用合成音，不联网 |


## 数据存储与备份

### 存在哪里

全部存在浏览器的 `localStorage` 里，键名前缀为 `etp:`：

| 键名 | 内容 |
|---|---|
| `etp:settings` | 所有设置项 |
| `etp:records` | 成绩记录（最多保留 500 条） |
| `etp:daily` | 每日累计（用于打卡与每日目标） |
| `etp:badges` | 已解锁的徽章与解锁时间 |
| `etp:customTexts` | 自定义文本（最多保留 20 份） |

**不会有任何数据上传到服务器** —— 这个项目根本没有服务器。


## 二次开发与修改

想改内容、改配色、改功能？**请看 [GUIDE.md](GUIDE.md)**，那是一份写给零基础用户的图文指南，包含：

- 怎么加自己的单词、短句、文章
- 怎么改界面文字和配色
- 怎么关掉不想用的功能
- 怎么部署、怎么备份
- 出错时怎么自己排查

### 常见修改点速查

| 我想改… | 改哪个文件 |
|---|---|
| 站点图标 / 标志配色 | `assets/favicon.svg`（方形图标）、`assets/logo.svg`（完整标志）。改里面 4 个 `stop-color` 即可 |
| 顶栏标志的大小 | `assets/css/style.css` 里的 `.logo-mark` |
| 站点名称 / 副标题 | `assets/js/i18n.js` 的 `app.name`、`app.slogan`、`app.docTitle` |
| 加单词 / 短句 / 文章（手写） | `assets/js/data/cet4.js`、`cet6.js`、`phrases.js`、`passages.js` |
| 更新或替换全量词库 | `tools/build-wordbook.mjs`，然后跑 `node tools/build-wordbook.mjs` |
| 界面上的文字（中文 / 英文） | `assets/js/i18n.js` |
| 配色、圆角、字体大小 | `assets/css/style.css` 顶部的变量区 |
| 默认主题 / 默认模式 / 默认开关 | `assets/js/config.js` 的 `DEFAULT_SETTINGS` |
| 默认内容源（现为四级大纲词汇） | 同上，`sourceId` |
| 默认每组题目数量 | 同上，`itemCount` |
| 发音源的优先级与超时 | `assets/js/speech.js` 顶部的 `PROVIDERS` 与 `speak()` 里的 `order` |
| 成就徽章的解锁条件 | `assets/js/achievements.js` 的 `LIST` |
| 打字音效的音色 | `assets/js/sounds.js` 的 `tone()` |
| 打错判定的行为 | `assets/js/engine.js` 的 `handleInput()` |

---

## 常见问题

<details>
<summary><b>打开后是白屏、什么都看不到</b></summary>

按 <kbd>F12</kbd> 打开开发者工具，切到 **Console（控制台）** 标签，看有没有红色报错。

- 如果报错提到 `Cannot read properties of null`，通常是某个 JS 文件被删了或改名了，检查 `assets/js/` 目录是否完整。
- 如果什么都没报，检查是不是把 `index.html` 放进了子文件夹但路径没改。

本项目在初始化失败时会在页面上直接显示错误详情，方便截图反馈。
</details>

<details>
<summary><b>换主题后颜色没变</b></summary>

主题是通过 `<html data-theme="...">` 属性 + CSS 变量实现的。如果你改过 `style.css`，检查是否误删了 `html[data-theme="dark"] { ... }` 这样的整块定义。

在控制台执行 `document.documentElement.getAttribute('data-theme')` 可以看到当前主题名。
</details>

<details>
<summary><b>发音没有声音</b></summary>

依次检查：

1. **浏览器自动播放策略**：多数浏览器要求「用户先与页面交互过」才允许播放声音。点一下页面任意位置再试。
2. **切换发音源**：设置 → 发音来源 → 改成「浏览器自带语音」，如果这个有声音说明是在线接口被网络挡住了。
3. **系统音量 / 静音**：听起来很蠢，但确实常见。
4. **浏览器不支持语音合成**：设置里点名「浏览器自带语音」如果完全没反应，换 Chrome 或 Edge。
</details>

<details>
<summary><b>数据会不会丢？</b></summary>

浏览器的 localStorage 在这几种情况下会被清空：

- 手动清除浏览器数据（含「Cookie 及其他网站数据」）
- 用无痕模式（本次会话结束后）
- 浏览器存储空间紧张时被自动回收（少见）

**所以重要数据请定期用「导出备份」存成 JSON 文件。** 这也是我们提供导入导出的原因。
</details>

<details>
<summary><b>手机上能正常用吗？</b></summary>

可以。界面是响应式的，手机浏览器打开后会自适应布局；点击练习区会唤起软键盘。

不过实机打字练习本身还是键盘更合适，手机更适合用来复习单词和刷打卡。
</details>

<details>
<summary><b>为什么「四级大纲词汇」是 4540 条，但源文件写的是「共 4615 词」？</b></summary>

源文件声明 4615 条，其中有 75 条是**同一个词的不同词性**（例如 `bear` 的名词"熊"和动词"容忍"是分开两行的）。

生成脚本会把它们**合并成一条**，释义之间用 `｜` 分隔，所以最终是 4540 条独立词条 —— 信息一条都没丢。六级同理：2273 → 2220。

另外一个原因：源文件里还有 53 个空行和 28 行标题/分节标记（`A`、`B`…）不是词条。
</details>

<details>
<summary><b>不想要那两本全量词库（体积太大 / 版权顾虑）</b></summary>

删掉这两个文件：

```
assets/js/data/wordbook-cet4.js
assets/js/data/wordbook-cet6.js
```

并在 `index.html` 里移除这两行：

```html
<script src="assets/js/data/wordbook-cet4.js"></script>
<script src="assets/js/data/wordbook-cet6.js"></script>
```

网站会自动退回只使用手写精选内容（四级 466 词 / 六级 264 词），**其他功能完全不受影响** ——
内容源注册表会自动跳过不存在的文件，不会报错。体积也会从 743 KB 降回约 288 KB。
</details>

<details>
<summary><b>顺序练习练到一半，进度丢了？</b></summary>

进度存在 `etp:progress` 里，跟着 localStorage 走。以下情况会重置：

- 手动点了 **设置 → 数据 → 重置练习进度**
- 清空浏览器数据 / 用无痕模式
- 从备份导入时，**备份文件里没有 `progress` 字段** → 进度保持原样（不覆盖）

另外：**一旦打开「打乱顺序」，进度就不再起作用**（随机练习没有"练到哪"的概念），
关掉打乱后会从上次记下的位置继续。
</details>

<details>
<summary><b>为什么「看中文打英文」有时会直接显示英文？</b></summary>

因为当前条目**没有中文释义**（例如网络内容源按句拆分出来的句子、或自定义文本里你没填中文）。

这时显示英文是**故意的优雅降级** —— 否则你既看不到中文也看不到英文，完全没法练。界面下方会给出说明。

想让某份自定义内容支持中文模式，在「自定义文本」弹窗里的「中文释义」框中按行填写即可（第 N 行对应第 N 条）。
</details>

<details>
<summary><b>宽松模式下我漏打一个字母，后面全红了</b></summary>

这是**按位置比对**的必然结果，也是同类打字网站的通行做法：第 3 个字符只和第 3 个字符比，漏打一个就整体错位。

**解决办法：按 <kbd>Backspace</kbd> 删掉重打。** 或者改用「严格模式」——它会当场拦住错误，从根上杜绝错位。
</details>

<details>
<summary><b>能加自己的文章吗？</b></summary>

能，而且有两条路：

- **临时用**：点「自定义文本」→ 粘贴 → 开始练习。内容会存在本地，之后从「我的内容」一键调出。
- **永久加**：编辑 `assets/js/data/sources.js`，照着现有格式往里加一篇。
</details>

---

## 浏览器兼容性

| 浏览器 | 版本要求 | 说明 |
|---|---|---|
| Chrome / Edge | 90+ | 完整支持，推荐 |
| Firefox | 90+ | 完整支持 |
| Safari | 15.4+ | 完整支持；旧版本在线发音可能失效，会自动降级 |
| 手机 Chrome / Safari | iOS 15.4+ / Android 10+ | 支持 |
| IE 11 | ❌ | 不支持（使用了 CSS 变量、`Promise` 等现代特性） |

更老的浏览器通常也能正常使用，只是圆角、描边等**细节可能略有差异** —— 本项目为这些场景准备了降级样式（现代写法后面紧跟一行兼容写法）。

---

## 开源协议

[MIT License](LICENSE) —— 可自由使用、修改、分发、商用，只需保留版权声明。

---

## 致谢

感谢以下开源项目、公开资源与公开接口：
•	mahavivo/english-wordlists
四级 / 六级大纲词表来源，经 tools/build-wordbook.mjs 生成本项目内置词书。
•	Free Dictionary API / dictionaryapi.dev
可选的真人录音发音源，开源项目。
•	jsDelivr
开源 CDN，词库构建时用于拉取公开词表。
•	有道词典 dictvoice、百度翻译 TTS
公开发音接口，非开源项目，但为本项目自动发音链路提供了重要支持。
•	浏览器 Web API
SpeechSynthesis、Web Audio、Canvas 等，为本项目提供发音兜底、音效合成与走势图绘制能力。
•	设计参考
界面参考 Monkeytype 的极简打字反馈、Duolingo 的学习风主题思路。


祝打字飞快，四六级顺利 🎯
