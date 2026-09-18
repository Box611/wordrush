/* =====================================================================
   i18n.js —— 中英双语文案
   ---------------------------------------------------------------------
   【小白提示】想改界面上任何一句话，都在这个文件里找对应的 key 改。
      · 中文文案在 I18N.zh
      · 英文文案在 I18N.en
   两边的 key 必须一一对应，缺了哪个 key 就会回退到中文。
   页面 HTML 里用 data-i18n="key" 标记，JS 里用 ET.t('key') 取值。
   ===================================================================== */

(function (ET) {
  'use strict';

  var I18N = {
    /* ============================ 中文 ============================ */
    zh: {
      /* 应用信息 */
      'app.name': '单词冲刺',
      'app.slogan': '边打字边背单词 · 四六级',
      'app.docTitle': '单词冲刺 · WordRush',

      /* 顶部工具栏 */
      'toolbar.stats': '成绩记录',
      'toolbar.badges': '成就徽章',
      'toolbar.theme': '切换主题',
      'toolbar.lang': '切换语言',
      'toolbar.settings': '设置',

      /* 标签 */
      'label.practiceMode': '练习模式',
      'label.errorMode': '打错处理',
      'label.count': '每组数量',
      'label.source': '内容源',

      /* 练习模式 */
      'mode.en2en': '看英文打英文',
      'mode.zh2en': '看中文打英文',
      'mode.listen': '听发音打英文',
      'mode.en2en.short': '英文',
      'mode.zh2en.short': '中文',
      'mode.listen.short': '听音',
      'mode.en2en.desc': '屏幕上显示英文，照着打一遍。练打字速度 + 拼写。',
      'mode.zh2en.desc': '只显示中文意思，你要打出对应的英文。练回忆 + 拼写。',
      'mode.listen.desc': '只播放发音，不看文字，凭听力拼写出来。练听力 + 拼写。',

      /* 打错处理 */
      'mode.strict': '严格模式',
      'mode.loose': '宽松模式',
      'mode.sentence': '整句模式',
      'mode.strict.desc': '打错就卡住，必须打对才能继续。适合初学，能养成正确肌肉记忆。',
      'mode.loose.desc': '打错也能继续，错的字母标红，最后统一统计正确率。适合练速度。',
      'mode.sentence.desc': '一句打完再统一判卷，告诉你哪里错了。适合模拟真实考试。',

      /* 按钮 */
      'btn.custom': '自定义文本',
      'btn.speak': '播放发音',
      'btn.skip': '跳过',
      'btn.restart': '重新开始',
      'btn.cancel': '取消',
      'btn.close': '关闭',
      'btn.again': '再来一轮',
      'btn.reset': '恢复默认设置',

      /* 舞台提示 */
      'hint.clickToStart': '点击这里开始输入',
      'hint.tabToRestart': '重新开始本轮',

      /* 底部统计 */
      'stat.wpm': '速度',
      'stat.acc': '正确率',
      'stat.combo': '连击',
      'stat.score': '得分',
      'stat.time': '用时',
      'stat.progress': '进度',

      /* 顺序练习进度 */
      'progress.range': '第 {a}–{b} / {n} 条',

      /* 每日目标 */
      'daily.text': '今日已练 {min} / {goal} 分钟 · 目标完成度 {pct}%',
      'daily.done': '今日目标已完成！继续保持 🎉',
      'daily.streak': '连续打卡 {n} 天',
      'daily.goalReached': '恭喜！今日目标达成 🎉',

      /* 提示区 */
      'prompt.zh': '中文',
      'prompt.listen': '听力',
      'prompt.listenTip': '点击播放按钮再听一遍（快捷键 Ctrl+空格）',
      'prompt.word': '单词',
      'prompt.sentence': '句子',
      'prompt.paragraph': '段落',

      /* 舞台说明 */
      'note.noZhMode': '当前内容没有中文释义，无法使用「看中文打英文」，已自动切换为「看英文打英文」。',
      'note.noZhShort': '当前内容缺少中文释义',

      /* 整句模式结果 */
      'sentence.perfect': '完全正确！',
      'sentence.wrongCount': '有 {n} 处不同',
      'sentence.yours': '你输入的：',
      'sentence.pressEnterToNext': '按 Enter 进入下一题',

      /* 设置面板 */
      'settings.title': '设置',
      'settings.sec.appearance': '外观',
      'settings.sec.practice': '练习',
      'settings.sec.voice': '发音',
      'settings.sec.gamify': '趣味与激励',
      'settings.sec.data': '数据',
      'settings.theme': '主题',
      'settings.theme.desc': '浅色 / 深色 / 学习风，一键切换',
      'settings.lang': '界面语言',
      'settings.lang.desc': '只影响界面文字，不影响练习内容',
      'settings.fontSize': '字号',
      'settings.fontSize.desc': '调整练习文本的大小',
      'settings.autoNext': '自动下一题',
      'settings.autoNext.desc': '打对一题后自动跳转，不用手动点',
      'settings.shuffle': '打乱顺序',
      'settings.shuffle.desc': '关掉后按原顺序连续练习，并自动记住上次练到哪里',
      'settings.showPhonetic': '显示音标',
      'settings.showPhonetic.desc': '在「看英文打英文」模式下显示音标（其他模式不显示，以免泄露拼写）',
      'settings.resetProgress': '重置练习进度',
      'settings.resetProgressDone': '练习进度已重置',
      'settings.voiceProvider': '发音来源',
      'settings.voiceProvider.desc': '优先用在线词典发音，失败自动回退',
      'settings.accent': '口音',
      'settings.accent.desc': '美音 / 英音（取决于发音来源是否支持）',
      'settings.autoSpeak': '听音模式自动播放',
      'settings.autoSpeak.desc': '进入题目时自动播放发音（听音模式必开，否则没法做题）',
      'settings.autoSpeakEn2en': '看英文模式自动发音',
      'settings.autoSpeakEn2en.desc': '打字前先朗读一遍英文，边打边记发音',
      'settings.speakOnFinish': '答对后朗读',
      'settings.speakOnFinish.desc': '每做完一题朗读一遍，加深记忆',
      'settings.speechRate': '语音语速',
      'settings.speechRate.desc': '仅影响浏览器自带语音',
      'settings.pronounceBtn': '显示播放按钮',
      'settings.pronounceBtn.desc': '在练习区右上角显示发音按钮',
      'settings.g.wpm': '显示速度 WPM',
      'settings.g.acc': '显示正确率',
      'settings.g.combo': '显示连击',
      'settings.g.score': '显示得分',
      'settings.g.time': '显示用时',
      'settings.g.progress': '显示进度条',
      'settings.g.sound': '打字音效',
      'settings.g.soundVolume': '音效音量',
      'settings.g.dailyGoal': '每日目标',
      'settings.g.dailyGoalMinutes': '每日目标时长',
      'settings.g.badges': '成就徽章',
      'settings.g.streak': '连续打卡',
      'settings.g.badges.desc': '达到条件时解锁徽章',
      'settings.g.streak.desc': '记录连续练习的天数',
      'settings.resetConfirm': '确定把所有设置恢复为默认值吗？',

      /* 主题 / 口音 / 发音源 选项文案 */
      'theme.light': '浅色',
      'theme.dark': '深色',
      'theme.study': '学习风',
      'font.sm': '小',
      'font.md': '中',
      'font.lg': '大',
      'font.xl': '特大',
      'voice.auto': '自动（推荐）',
      'voice.youdao': '有道词典发音',
      'voice.baidu': '百度翻译发音',
      'voice.dictionaryapi': 'Free Dictionary 真人录音（较慢）',
      'voice.browser': '浏览器自带语音',
      'accent.us': '美音',
      'accent.uk': '英音',
      'min.suffix': '分钟',

      /* 自定义文本弹窗 */
      'custom.title': '自定义练习内容',
      'custom.tip': '粘贴任意英文文本，网站会自动拆分成「单词 / 句子 / 段落」，任选一种开始练习。',
      'custom.placeholder': '在此粘贴英文文本……\n例如：The quick brown fox jumps over the lazy dog.',
      'custom.splitAs': '拆分方式',
      'custom.unit.sentence': '按句子',
      'custom.unit.word': '按单词',
      'custom.unit.paragraph': '按段落',
      'custom.pick': '抽取条数',
      'custom.countAll': '全部',
      'custom.zhLabel': '中文释义（可选，用于「看中文打英文」）',
      'custom.zhHint': '按行填写，每行对应上面拆分出的第 N 条。留空则该条无法用于中文模式。',
      'custom.zhPlaceholder': '第一行的中文\n第二行的中文\n……',
      'custom.urlLabel': '从网址加载（可选 · 高级）',
      'custom.urlHint': '受浏览器跨域限制，只有允许跨域访问的网址才能成功；失败时请用上面的粘贴方式。',
      'custom.loadUrl': '加载',
      'custom.start': '开始练习',
      'custom.preview': '预览：将练习 {n} 条，其中 {m} 条有中文释义。',
      'custom.previewEmpty': '还没有内容，请先粘贴一段英文文本。',
      'custom.previewFirst': '前几条：',

      /* 本轮成绩 */
      'result.title': '本轮成绩',
      'result.wpm': '速度 WPM',
      'result.acc': '正确率',
      'result.time': '用时',
      'result.chars': '字符数',
      'result.combo': '最高连击',
      'result.score': '得分',
      'result.items': '完成题目',
      'result.newBadge': '解锁新徽章：',
      'result.perfect': '全对！非常稳 👏',
      'result.good': '不错，继续保持！',
      'result.keepGoing': '再练几轮就熟了 💪',

      /* 成绩记录 */
      'history.title': '成绩记录',
      'history.empty': '还没有练习记录，去打一轮吧！',
      'history.bestWpm': '历史最佳 WPM',
      'history.avgWpm': '平均 WPM',
      'history.totalSessions': '累计轮数',
      'history.totalChars': '累计字符',
      'history.totalTime': '累计时长',
      'history.streakDays': '连续打卡',
      'history.th.date': '时间',
      'history.th.mode': '模式',
      'history.th.errorMode': '判错',
      'history.th.source': '内容',
      'history.th.wpm': 'WPM',
      'history.th.acc': '正确率',
      'history.th.chars': '字符',
      'history.th.duration': '用时',
      'history.th.score': '得分',

      /* 数据导入导出 */
      'data.export': '导出备份 (JSON)',
      'data.import': '导入备份',
      'data.clear': '清空所有数据',
      'data.exported': '已导出备份文件',
      'data.imported': '备份导入成功：成绩 {r} 条、打卡 {d} 天',
      'data.importFailed': '导入失败：文件格式不正确',
      'data.confirmClear': '这会删除本机保存的所有成绩、打卡和设置，且无法恢复。确定继续吗？',
      'data.cleared': '已清空所有本地数据',
      'data.tip': '数据只保存在你自己的浏览器里，不会上传到任何服务器。换电脑时用「导出 / 导入」搬过去。',

      /* 导入确认弹窗 */
      'import.title': '确认导入备份',
      'import.confirm': '确认导入',
      'import.exportedAt': '备份导出时间：{d}',
      'import.fileHas': '这个备份文件里有',
      'import.machineHas': '本机当前：成绩 {r} 条、打卡 {d} 天、徽章 {b} 个、自定义文本 {c} 份',
      'import.warn': '导入会把本机数据替换成备份文件里的内容，且无法撤销。建议先点「导出备份」把当前数据存一份。',
      'import.cRecords': '成绩记录',
      'import.cDays': '打卡天数',
      'import.cBadges': '徽章',
      'import.cCustom': '自定义文本',
      'import.errEmpty': '这个文件是空的，请确认选对了文件',
      'import.errJson': '这个文件不是有效的 JSON，可能选错了文件（请选「导出备份」生成的那个 .json）',
      'import.errWrongApp': '这个 JSON 不是本项目的备份文件（缺少项目标识）',
      'import.errRead': '文件读取失败，请重试一次',

      /* 成就徽章 */
      'badges.title': '成就徽章',
      'badges.unlockedAt': '解锁于 {d}',

      /* 各类提示 */
      'toast.themeChanged': '主题已切换为「{v}」',
      'toast.langChanged': 'Language switched to English',
      'toast.settingsReset': '已恢复默认设置',
      'toast.customLoaded': '自定义内容已载入：{n} 条',
      'toast.customEmpty': '请先粘贴英文文本',
      'toast.urlFail': '网址加载失败（可能是跨域限制），请改用粘贴方式',
      'toast.urlOk': '已从网址加载内容',
      'toast.newBadge': '解锁徽章：{v}',
      'toast.skipped': '已跳过这题',
      'toast.voiceFallback': '在线发音不可用，已改用浏览器语音',
      'toast.noSpeech': '当前浏览器不支持语音合成，建议更换 Chrome / Edge',

      /* 成就徽章：名称与说明 */
      'badge.first_round.name': '启程',
      'badge.first_round.desc': '完成第一轮练习',
      'badge.chars_1000.name': '千字入门',
      'badge.chars_1000.desc': '累计输入 1,000 个字符',
      'badge.chars_10000.name': '万字功底',
      'badge.chars_10000.desc': '累计输入 10,000 个字符',
      'badge.chars_50000.name': '五万长征',
      'badge.chars_50000.desc': '累计输入 50,000 个字符',
      'badge.wpm_30.name': '初步上手',
      'badge.wpm_30.desc': '单轮速度达到 30 WPM',
      'badge.wpm_50.name': '熟练操盘',
      'badge.wpm_50.desc': '单轮速度达到 50 WPM',
      'badge.wpm_80.name': '疾风之指',
      'badge.wpm_80.desc': '单轮速度达到 80 WPM',
      'badge.acc_perfect.name': '零失误',
      'badge.acc_perfect.desc': '单轮正确率 100%',
      'badge.combo_100.name': '连击百段',
      'badge.combo_100.desc': '单轮最高连击达 100',
      'badge.combo_300.name': '连击狂潮',
      'badge.combo_300.desc': '单轮最高连击达 300',
      'badge.streak_3.name': '三日不辍',
      'badge.streak_3.desc': '连续打卡 3 天',
      'badge.streak_7.name': '一周坚持',
      'badge.streak_7.desc': '连续打卡 7 天',
      'badge.streak_30.name': '月度铁人',
      'badge.streak_30.desc': '连续打卡 30 天',
      'badge.daily_goal.name': '今日达成',
      'badge.daily_goal.desc': '完成一次每日目标',
      'badge.rounds_50.name': '五十轮老手',
      'badge.rounds_50.desc': '累计完成 50 轮练习',
      'badge.all_modes.name': '全能选手',
      'badge.all_modes.desc': '三种练习模式都至少练过一轮',
      'badge.no_mistake_round.name': '一尘不染',
      'badge.no_mistake_round.desc': '单轮 100 字符以上且零失误',
      'badge.night_owl.name': '夜猫子',
      'badge.night_owl.desc': '在凌晨 0 点至 5 点之间练习过',

      /* 内容源分组名 */
      'source.mine': '我的内容',
      'source.random': '随机一篇'
    },

    /* ============================ English ============================ */
    en: {
      'app.name': 'WordRush',
      'app.slogan': 'Type & learn · CET-4 / CET-6',
      'app.docTitle': 'WordRush · WordRush',

      'toolbar.stats': 'History',
      'toolbar.badges': 'Badges',
      'toolbar.theme': 'Switch theme',
      'toolbar.lang': 'Switch language',
      'toolbar.settings': 'Settings',

      'label.practiceMode': 'Practice mode',
      'label.errorMode': 'Mistake handling',
      'label.count': 'Per round',
      'label.source': 'Content',

      'mode.en2en': 'Read & type',
      'mode.zh2en': 'Meaning to English',
      'mode.listen': 'Listen & spell',
      'mode.en2en.short': 'Text',
      'mode.zh2en.short': 'Meaning',
      'mode.listen.short': 'Audio',
      'mode.en2en.desc': 'The English text is shown — just type it. Trains speed and spelling.',
      'mode.zh2en.desc': 'Only the Chinese meaning is shown — type the English. Trains recall.',
      'mode.listen.desc': 'Only the audio plays — spell what you hear. Trains listening.',

      'mode.strict': 'Strict',
      'mode.loose': 'Relaxed',
      'mode.sentence': 'Whole sentence',
      'mode.strict.desc': 'Wrong keys are blocked. You must type it right to continue.',
      'mode.loose.desc': 'Keep typing; wrong letters are marked red and counted at the end.',
      'mode.sentence.desc': 'Finish the whole sentence first, then see every mistake at once.',

      'btn.custom': 'Custom text',
      'btn.speak': 'Play pronunciation',
      'btn.skip': 'Skip',
      'btn.restart': 'Restart',
      'btn.cancel': 'Cancel',
      'btn.close': 'Close',
      'btn.again': 'Again',
      'btn.reset': 'Reset to defaults',

      'hint.clickToStart': 'Click here to start typing',
      'hint.tabToRestart': 'restart this round',

      'stat.wpm': 'Speed',
      'stat.acc': 'Accuracy',
      'stat.combo': 'Combo',
      'stat.score': 'Score',
      'stat.time': 'Time',
      'stat.progress': 'Progress',

      'progress.range': '{a}–{b} of {n}',

      'daily.text': 'Today {min} / {goal} min · {pct}% of goal',
      'daily.done': 'Daily goal reached! Keep it up 🎉',
      'daily.streak': '{n}-day streak',
      'daily.goalReached': 'Daily goal reached 🎉',

      'prompt.zh': 'Meaning',
      'prompt.listen': 'Listening',
      'prompt.listenTip': 'Tap the play button to hear it again (Ctrl+Space)',
      'prompt.word': 'Word',
      'prompt.sentence': 'Sentence',
      'prompt.paragraph': 'Paragraph',

      'note.noZhMode': 'This content has no Chinese meaning, so "Meaning to English" is unavailable. Switched to "Read & type".',
      'note.noZhShort': 'Missing Chinese meaning',

      'sentence.perfect': 'Perfect!',
      'sentence.wrongCount': '{n} difference(s)',
      'sentence.yours': 'You typed:',
      'sentence.pressEnterToNext': 'Press Enter for the next one',

      'settings.title': 'Settings',
      'settings.sec.appearance': 'Appearance',
      'settings.sec.practice': 'Practice',
      'settings.sec.voice': 'Pronunciation',
      'settings.sec.gamify': 'Fun & motivation',
      'settings.sec.data': 'Data',
      'settings.theme': 'Theme',
      'settings.theme.desc': 'Light / Dark / Study',
      'settings.lang': 'Interface language',
      'settings.lang.desc': 'Affects UI text only, not the practice content',
      'settings.fontSize': 'Font size',
      'settings.fontSize.desc': 'Size of the practice text',
      'settings.autoNext': 'Auto next',
      'settings.autoNext.desc': 'Jump to the next item once you finish one',
      'settings.shuffle': 'Shuffle',
      'settings.shuffle.desc': 'Turn off to practise in original order and remember where you left off',
      'settings.showPhonetic': 'Show phonetics',
      'settings.showPhonetic.desc': 'Show IPA in "Read & type" mode only (hidden elsewhere so it cannot give the spelling away)',
      'settings.resetProgress': 'Reset practice progress',
      'settings.resetProgressDone': 'Practice progress reset',
      'settings.voiceProvider': 'Audio source',
      'settings.voiceProvider.desc': 'Online dictionary first, browser voice as fallback',
      'settings.accent': 'Accent',
      'settings.accent.desc': 'US / UK, if the source supports it',
      'settings.autoSpeak': 'Auto-play in listen mode',
      'settings.autoSpeak.desc': 'Play the audio as soon as an item appears',
      'settings.autoSpeakEn2en': 'Auto-pronounce in Read & type',
      'settings.autoSpeakEn2en.desc': 'Read the word aloud before you start typing it',
      'settings.speakOnFinish': 'Speak after each item',
      'settings.speakOnFinish.desc': 'Read it once more after you finish, for memory',
      'settings.speechRate': 'Speech rate',
      'settings.speechRate.desc': 'Browser voice only',
      'settings.pronounceBtn': 'Show play button',
      'settings.pronounceBtn.desc': 'Show the speaker button in the stage header',
      'settings.g.wpm': 'Show WPM',
      'settings.g.acc': 'Show accuracy',
      'settings.g.combo': 'Show combo',
      'settings.g.score': 'Show score',
      'settings.g.time': 'Show time',
      'settings.g.progress': 'Show progress bar',
      'settings.g.sound': 'Typing sound',
      'settings.g.soundVolume': 'Sound volume',
      'settings.g.dailyGoal': 'Daily goal',
      'settings.g.dailyGoalMinutes': 'Daily goal (minutes)',
      'settings.g.badges': 'Achievements',
      'settings.g.streak': 'Streak',
      'settings.g.badges.desc': 'Unlock badges when you hit milestones',
      'settings.g.streak.desc': 'Track consecutive practice days',
      'settings.resetConfirm': 'Reset all settings to their defaults?',

      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'theme.study': 'Study',
      'font.sm': 'Small',
      'font.md': 'Medium',
      'font.lg': 'Large',
      'font.xl': 'Huge',
      'voice.auto': 'Auto (recommended)',
      'voice.youdao': 'Youdao Dictionary',
      'voice.baidu': 'Baidu Translate',
      'voice.dictionaryapi': 'Free Dictionary (native audio, slow)',
      'voice.browser': 'Browser speech',
      'accent.us': 'US',
      'accent.uk': 'UK',
      'min.suffix': 'min',

      'custom.title': 'Custom practice content',
      'custom.tip': 'Paste any English text. It is split into words / sentences / paragraphs automatically.',
      'custom.placeholder': 'Paste English text here…\ne.g. The quick brown fox jumps over the lazy dog.',
      'custom.splitAs': 'Split by',
      'custom.unit.sentence': 'Sentence',
      'custom.unit.word': 'Word',
      'custom.unit.paragraph': 'Paragraph',
      'custom.pick': 'Amount',
      'custom.countAll': 'All',
      'custom.zhLabel': 'Chinese meanings (optional, for "Meaning to English")',
      'custom.zhHint': 'One per line, matching the N-th extracted item. Leave empty to disable that mode.',
      'custom.zhPlaceholder': 'Meaning of line 1\nMeaning of line 2\n…',
      'custom.urlLabel': 'Load from URL (optional · advanced)',
      'custom.urlHint': 'Blocked by CORS on most sites. If it fails, paste the text instead.',
      'custom.loadUrl': 'Load',
      'custom.start': 'Start practice',
      'custom.preview': 'Preview: {n} items, {m} with Chinese meaning.',
      'custom.previewEmpty': 'No content yet — paste some English text first.',
      'custom.previewFirst': 'First items:',

      'result.title': 'Round result',
      'result.wpm': 'Speed WPM',
      'result.acc': 'Accuracy',
      'result.time': 'Time',
      'result.chars': 'Characters',
      'result.combo': 'Best combo',
      'result.score': 'Score',
      'result.items': 'Items done',
      'result.newBadge': 'New badge:',
      'result.perfect': 'Flawless! 👏',
      'result.good': 'Solid work — keep going!',
      'result.keepGoing': 'A few more rounds and it clicks 💪',

      'history.title': 'History',
      'history.empty': 'No records yet — go do a round!',
      'history.bestWpm': 'Best WPM',
      'history.avgWpm': 'Average WPM',
      'history.totalSessions': 'Rounds',
      'history.totalChars': 'Characters',
      'history.totalTime': 'Total time',
      'history.streakDays': 'Day streak',
      'history.th.date': 'When',
      'history.th.mode': 'Mode',
      'history.th.errorMode': 'Rules',
      'history.th.source': 'Content',
      'history.th.wpm': 'WPM',
      'history.th.acc': 'Acc',
      'history.th.chars': 'Chars',
      'history.th.duration': 'Time',
      'history.th.score': 'Score',

      'data.export': 'Export backup (JSON)',
      'data.import': 'Import backup',
      'data.clear': 'Clear all data',
      'data.exported': 'Backup file exported',
      'data.imported': 'Imported: {r} records, {d} days',
      'data.importFailed': 'Import failed: invalid file',
      'data.confirmClear': 'This deletes all local records, streak and settings. It cannot be undone. Continue?',
      'data.cleared': 'All local data cleared',
      'data.tip': 'Your data lives only in this browser. Nothing is uploaded. Use Export / Import to move it to another computer.',

      'import.title': 'Confirm import',
      'import.confirm': 'Import',
      'import.exportedAt': 'Backup exported: {d}',
      'import.fileHas': 'This backup file contains',
      'import.machineHas': 'On this device: {r} records, {d} days, {b} badges, {c} custom texts',
      'import.warn': 'Importing replaces the data on this device and cannot be undone. Export a backup of the current data first.',
      'import.cRecords': 'Records',
      'import.cDays': 'Days',
      'import.cBadges': 'Badges',
      'import.cCustom': 'Custom texts',
      'import.errEmpty': 'The file is empty — check you picked the right one',
      'import.errJson': 'Not a valid JSON file — please pick the .json produced by Export backup',
      'import.errWrongApp': 'This JSON is not a backup from this project (missing app id)',
      'import.errRead': 'Could not read the file, please try again',

      'badges.title': 'Achievements',
      'badges.unlockedAt': 'Unlocked {d}',

      'toast.themeChanged': 'Theme: {v}',
      'toast.langChanged': '界面语言已切换为中文',
      'toast.settingsReset': 'Settings restored to defaults',
      'toast.customLoaded': 'Custom content loaded: {n} items',
      'toast.customEmpty': 'Paste some English text first',
      'toast.urlFail': 'Could not load the URL (likely CORS). Please paste the text instead.',
      'toast.urlOk': 'Content loaded from URL',
      'toast.newBadge': 'Badge unlocked: {v}',
      'toast.skipped': 'Skipped',
      'toast.voiceFallback': 'Online audio failed — using browser voice',
      'toast.noSpeech': 'This browser has no speech synthesis. Try Chrome or Edge.',

      'badge.first_round.name': 'First Step',
      'badge.first_round.desc': 'Finish your first round',
      'badge.chars_1000.name': 'First Thousand',
      'badge.chars_1000.desc': 'Type 1,000 characters in total',
      'badge.chars_10000.name': 'Ten Thousand',
      'badge.chars_10000.desc': 'Type 10,000 characters in total',
      'badge.chars_50000.name': 'The Long March',
      'badge.chars_50000.desc': 'Type 50,000 characters in total',
      'badge.wpm_30.name': 'Getting Warm',
      'badge.wpm_30.desc': 'Reach 30 WPM in a round',
      'badge.wpm_50.name': 'Fluent',
      'badge.wpm_50.desc': 'Reach 50 WPM in a round',
      'badge.wpm_80.name': 'Flying Fingers',
      'badge.wpm_80.desc': 'Reach 80 WPM in a round',
      'badge.acc_perfect.name': 'Flawless',
      'badge.acc_perfect.desc': 'Finish a round with 100% accuracy',
      'badge.combo_100.name': 'Century Combo',
      'badge.combo_100.desc': 'A combo of 100 in one round',
      'badge.combo_300.name': 'Combo Storm',
      'badge.combo_300.desc': 'A combo of 300 in one round',
      'badge.streak_3.name': 'Three Days In',
      'badge.streak_3.desc': 'Practise 3 days in a row',
      'badge.streak_7.name': 'One Week Strong',
      'badge.streak_7.desc': 'Practise 7 days in a row',
      'badge.streak_30.name': 'Iron Month',
      'badge.streak_30.desc': 'Practise 30 days in a row',
      'badge.daily_goal.name': 'Goal Hit',
      'badge.daily_goal.desc': 'Complete a daily goal',
      'badge.rounds_50.name': 'Fifty Rounds',
      'badge.rounds_50.desc': 'Finish 50 rounds in total',
      'badge.all_modes.name': 'All-Rounder',
      'badge.all_modes.desc': 'Try all three practice modes at least once',
      'badge.no_mistake_round.name': 'Spotless',
      'badge.no_mistake_round.desc': '100+ characters with zero mistakes',
      'badge.night_owl.name': 'Night Owl',
      'badge.night_owl.desc': 'Practise between midnight and 5 am',
      'source.mine': 'My content',
      'source.random': 'Random article'
    }
  };

  ET.I18N = I18N;

  /**
   * 取一条翻译。
   * 用法：ET.t('btn.skip')  →  "跳过"
   *       ET.t('custom.preview', {n: 20, m: 0})  →  替换 {n} {m} 占位符
   * @param {string} key
   * @param {Object} [vars] 占位符替换表
   * @returns {string}
   */
  ET.t = function (key, vars) {
    var lang = (ET.Store && ET.Store.get('lang')) || 'zh';
    var dict = I18N[lang] || I18N.zh;
    var s = dict[key];
    if (s === undefined) s = I18N.zh[key];       // 英文缺词条时回退中文
    if (s === undefined) s = key;                // 都没有就直接显示 key，方便排查
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] !== undefined ? vars[k] : m;
      });
    }
    return s;
  };

  /**
   * 当前语言代码（给 <html lang> 用）。
   * @returns {string}
   */
  ET.currentLang = function () {
    return (ET.Store && ET.Store.get('lang')) === 'en' ? 'en' : 'zh';
  };

})(window.ET);
