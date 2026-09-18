#!/usr/bin/env node
/* =====================================================================
   tools/build-wordbook.mjs —— 生成内置全量四六级词库
   ---------------------------------------------------------------------
   ⚠️ 这是一个「开发工具」，不是网站运行的一部分。
      · 网站本身完全不需要 Node.js，双击 index.html 就能跑。
      · 只有在你想「重新生成 / 更新词库数据」时才需要运行本脚本。
      · 生成结果是 assets/js/data/wordbook-cet4.js 和 wordbook-cet6.js。

   为什么要用脚本生成、而不是手写数据文件？
     · 4615 + 2273 条数据手写不现实；
     · 词库来源必须可追溯（跑一次就能重新拉取、可复核）；
     · 生成的文件头部会写明出处，方便判断版权归属。

   用法（在项目根目录执行）：
       node tools/build-wordbook.mjs
   可选：把已下载的原始文件放进 tools/raw/ 目录，脚本会优先使用本地文件，
        这样离线也能重新生成。

   数据来源
     仓库：mahavivo/english-wordlists（GitHub）
     文件：CET4_edited.txt（大学英语四级大纲单词表，4615 词）
           CET6_edited.txt（六级大纲词汇，2273 词）
     通道：jsDelivr CDN（GitHub 在国内常不可直连，CDN 可直连且允许跨域）
     ⚠️ 该仓库未声明开源协议。词条本身来自公开的考试大纲词汇表，
        中文释义由该仓库整理。若你打算公开分发本项目，请自行评估是否需要
        取得许可，或改用自己整理/已授权的词库（替换本脚本的数据源即可）。
   ===================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(__dirname, 'raw');
const OUT_DIR = path.join(ROOT, 'assets', 'js', 'data');

const CDN = 'https://cdn.jsdelivr.net/gh/mahavivo/english-wordlists@master/';

/* 要生成的两本词书 */
const BOOKS = [
  {
    key: 'cet4full',
    file: 'CET4_edited.txt',
    out: 'wordbook-cet4.js',
    id: 'cet4full',
    name: { zh: '四级大纲词汇', en: 'CET-4 Full Syllabus' },
    desc: {
      zh: '大学英语四级大纲单词表（全量）',
      en: 'Full CET-4 syllabus vocabulary'
    }
  },
  {
    key: 'cet6full',
    file: 'CET6_edited.txt',
    out: 'wordbook-cet6.js',
    id: 'cet6full',
    name: { zh: '六级大纲词汇', en: 'CET-6 Full Syllabus' },
    desc: {
      zh: '大学英语六级大纲词汇（全量）',
      en: 'Full CET-6 syllabus vocabulary'
    }
  }
];

const SOURCE_REPO = 'mahavivo/english-wordlists';
const SOURCE_URL = 'https://github.com/mahavivo/english-wordlists';

/* ---------------------------------------------------------------------
   取原始文件：优先用 tools/raw/ 里的本地副本，否则从 CDN 下载
   --------------------------------------------------------------------- */
async function getRaw(fileName) {
  const local = path.join(RAW_DIR, fileName);
  if (fs.existsSync(local)) {
    console.log(`  · 使用本地副本 ${path.relative(ROOT, local)}`);
    return fs.readFileSync(local, 'utf8');
  }

  const url = CDN + encodeURIComponent(fileName);
  console.log(`  · 下载 ${url}`);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    // 顺手缓存到 tools/raw/，下次离线也能用
    fs.mkdirSync(RAW_DIR, { recursive: true });
    fs.writeFileSync(local, text, 'utf8');
    console.log(`  · 已缓存到 tools/raw/${fileName}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------------
   解析
   ---------------------------------------------------------------------
   原始文本长这样：

     大学英语四级大纲单词表        ← 标题行，丢弃
     (共 4615 词)                  ← 计数行，丢弃

     A                             ← 首字母分节标记，丢弃

     a art.一(个)；每一(个)              ← 无音标
     abandon [əˈbændən] vt.丢弃；放弃    ← 有音标
     instruct[ inˈstrʌkt] vt.教；指示    ← 音标前没有空格（源文件不统一）
     a.m (缩)上午，午前                  ← 词条本身带点号
     systematic(al) [ˌsistiˈmætik] ...   ← 词条带括号变体
     attribute 2 [ˈætrɪbjʊːt] n. ...     ← 源文件用 "word 1/2/3" 区分不同词性
     buzz word [bʌz wɜːd] n. ...         ← 本身就是词组的词条

   解析思路（先抠音标，再切前后）：
     1. 找到第一个 [ ... ]，里面的东西当作音标
     2. 它前面的部分是「词条」；后面的部分是「释义」
     3. 没有方括号时，退回「第一个空格前是词条」

   随后做几项规范化（都是为「能被键盘打出来」服务）：
     · 源文件里 oˈclock 用 ˈ 当撇号 → 统一成 ASCII 的 '，否则用户根本打不出来
     · systematic(al) / toward(s) → 去掉括号变体，取基础形 systematic / toward
     · "attribute 2" → 去掉尾部的序号 2
     · 释义里残留的方括号音标 → 去掉，保持提示区干净
   --------------------------------------------------------------------- */

const RE_CJK = /[\u4e00-\u9fa5]/;

/** 把词条规范化成「可以用键盘打出来」的形式 */
function normalizeHead(head) {
  let w = head
    .replace(/[\u02C8\u02CC]/g, "'")   // IPA 重音符号被误用成撇号的情况
    .replace(/[\u2018\u2019]/g, "'")    // 弯撇号 → 直撇号
    .replace(/\s+/g, ' ')
    .trim();
  // 去掉尾部序号："attribute 2" → "attribute"
  w = w.replace(/\s+\d+$/, '');
  // 去掉括号变体："systematic(al)" → "systematic"，"toward(s)" → "toward"
  w = w.replace(/\([^)]*\)\s*$/, '').trim();
  return w;
}

function parse(text) {
  const stat = {
    total: 0, blank: 0, header: 0, noMatch: 0, noChinese: 0,
    merged: 0, withIpa: 0, dropped: []
  };
  const map = new Map();     // 小写词条 → 条目对象
  const order = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\uFEFF/g, '').replace(/\s+/g, ' ').trim();
    stat.total++;
    if (!line) { stat.blank++; continue; }
    if (/^[A-Z]$/.test(line)) { stat.header++; continue; }        // 分节标记 A B C…
    if (!/^[A-Za-z]/.test(line)) { stat.header++; continue; }     // 标题 / 计数行

    // ① 抠出第一组方括号当作音标
    let head, ipa = '', zh;
    const open = line.indexOf('[');
    const close = open >= 0 ? line.indexOf(']', open + 1) : -1;

    if (open > 0 && close > open) {
      head = line.slice(0, open);
      ipa = line.slice(open + 1, close).trim();
      zh = line.slice(close + 1);
    } else {
      // ② 没有音标：第一个空格前是词条
      const sp = line.indexOf(' ');
      if (sp < 0) { stat.noMatch++; stat.dropped.push(line); continue; }
      head = line.slice(0, sp);
      zh = line.slice(sp + 1);
    }

    head = normalizeHead(head);
    // 释义里可能还有第二组音标（例如 abuse 的动词/名词读音不同），去掉以保持整洁
    zh = zh.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ')
           .replace(/\s*;\s*/g, '；').replace(/^[|｜\s]+/, '').trim();

    // 词条必须是纯英文（允许撇号、连字符、点号、空格，支持 buzz word 这类词组）
    if (!/^[A-Za-z][A-Za-z'.\- ]*$/.test(head)) { stat.noMatch++; stat.dropped.push(line); continue; }
    if (!zh || !RE_CJK.test(zh)) { stat.noChinese++; stat.dropped.push(line); continue; }

    const key = head.toLowerCase();
    const exist = map.get(key);
    if (exist) {
      // ⚠️ 同一个词的不同词性（bear 名词"熊" / 动词"容忍"）在源文件里是分开两行的。
      //    这不是重复数据，直接丢掉会损失释义 —— 合并成一条，用 ｜ 分隔。
      if (exist.zh.indexOf(zh) < 0) exist.zh += ' ｜ ' + zh;
      if (!exist.ipa && ipa) exist.ipa = ipa;
      stat.merged++;
      continue;
    }
    map.set(key, { en: head, zh: zh, ipa: ipa });
    order.push(key);
  }

  // 按字母顺序排好，方便「按顺序连续练习」时符合直觉
  const items = order.map((k) => map.get(k)).sort((a, b) =>
    a.en.toLowerCase().localeCompare(b.en.toLowerCase(), 'en'));
  // 带音标的条数要等合并完成后统计才准（合并时可能补上了音标）
  stat.withIpa = items.filter((it) => it.ipa).length;
  return { items, stat };
}

/* ---------------------------------------------------------------------
   输出成 JS 数据文件
   --------------------------------------------------------------------- */
function toJs(book, items, stat, fetchedAt) {
  const lines = [];
  lines.push('/* =====================================================================');
  lines.push(`   ${book.out} —— ${book.name.zh}（自动生成，请勿手工编辑）`);
  lines.push('   ---------------------------------------------------------------------');
  lines.push('   本文件由 tools/build-wordbook.mjs 生成。');
  lines.push('   想改内容或换数据源：改那个脚本，然后运行  node tools/build-wordbook.mjs');
  lines.push('   （手工改这里的内容，下次生成会被覆盖。）');
  lines.push('');
  lines.push(`   数据来源：${SOURCE_REPO}`);
  lines.push(`   原始文件：${book.file}`);
  lines.push(`   生成时间：${fetchedAt}`);
  lines.push(`   词条数量：${items.length}（其中 ${stat.withIpa} 条带音标）`);
  lines.push('');
  lines.push('   ⚠️ 版权提示：原仓库未声明开源协议。词条来自公开的四六级考试大纲');
  lines.push('      词汇表，中文释义由该仓库整理。若你打算公开分发本项目，请自行');
  lines.push('      评估许可问题，或替换成自己整理 / 已获授权的词库。');
  lines.push('   ===================================================================== */');
  lines.push('');
  lines.push('window.ET = window.ET || {};');
  lines.push('window.ET.DATA = window.ET.DATA || {};');
  lines.push('');
  lines.push(`window.ET.DATA.${book.key} = {`);
  lines.push(`  id: '${book.id}',`);
  lines.push("  group: 'words',");
  lines.push("  unit: 'word',");
  lines.push(`  name: { zh: '${book.name.zh}', en: '${book.name.en}' },`);
  lines.push(`  desc: { zh: '${book.desc.zh}，共 ${items.length} 词', en: '${book.desc.en} · ${items.length} words' },`);
  lines.push('  /* 出处信息：界面上作为悬停提示展示，也便于使用者核对数据来源 */');
  lines.push('  source: {');
  lines.push(`    repo: '${SOURCE_REPO}',`);
  lines.push(`    file: '${book.file}',`);
  lines.push(`    url: '${SOURCE_URL}',`);
  lines.push(`    fetchedAt: '${fetchedAt}'`);
  lines.push('  },');
  lines.push('  /* 每条格式：[英文, 中文释义, 音标(可能为空)] */');
  lines.push('  items: [');
  for (const it of items) {
    lines.push(`    [${JSON.stringify(it.en)}, ${JSON.stringify(it.zh)}${it.ipa ? ', ' + JSON.stringify(it.ipa) : ''}],`);
  }
  lines.push('  ]');
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/* ---------------------------------------------------------------------
   主流程
   --------------------------------------------------------------------- */
(async () => {
  console.log('生成内置词库…\n');
  const fetchedAt = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const book of BOOKS) {
    console.log(`[${book.key}] ${book.name.zh}`);
    const text = await getRaw(book.file);
    const { items, stat } = parse(text);
    const js = toJs(book, items, stat, fetchedAt);
    const outPath = path.join(OUT_DIR, book.out);
    fs.writeFileSync(outPath, js, 'utf8');

    console.log(`  · 解析行数 ${stat.total}`);
    console.log(`  · 跳过：空行 ${stat.blank} / 标题与分节 ${stat.header} / 格式不符 ${stat.noMatch} / 释义无中文 ${stat.noChinese}`);
    console.log(`  · 同词不同词性合并 ${stat.merged} 次（例如 bear 的"熊"与"容忍"合并为一条）`);
    console.log(`  · 得到词条 ${items.length}（带音标 ${stat.withIpa}）`);
    console.log(`  · 输出 ${path.relative(ROOT, outPath)}（${(Buffer.byteLength(js) / 1024).toFixed(0)} KB）`);
    if (stat.dropped.length) {
      console.log(`  · 被丢弃的行（供核对，最多显示 12 条）：`);
      stat.dropped.slice(0, 12).forEach((l) => console.log(`      ${l.slice(0, 110)}`));
    }
    console.log('');

    if (items.length < 1000) {
      console.error(`  ✗ 词条数异常偏少（${items.length}），请检查原始文件格式是否变化`);
      process.exitCode = 1;
    }
  }

  console.log('完成。记得在 assets/js/data 的加载清单和 index.html 里注册新的数据文件。');
})().catch((e) => {
  console.error('生成失败：', e.message);
  console.error('提示：可手动下载原始文件放到 tools/raw/ 目录后重试。');
  process.exitCode = 1;
});
