/* =====================================================================
   data/sources.js —— 固定内容源（"一键加载"的英文学习材料）
   ---------------------------------------------------------------------
   设计说明（重要，请先读）：
     项目最初的需求是「自动抓取 VOA / BBC 的网页内容」。但浏览器出于
     安全考虑有「跨域限制」（CORS），直接抓取公共网站大概率会失败，
     而且网页结构一变抓取就坏——非常不稳定。

     因此这里采用「最稳定、最省事」的方案：
       ① 内置一批按 VOA / BBC 学习栏目风格撰写的英文选段（本文件），
          点一下就加载，不需要网络、不会失败；
       ② 保留「自定义文本」里的「从网址加载」，需要时再试；
       ③ 保留手动粘贴，永远可用。

     下面这些文本是为本项目专门撰写的原创学习材料（非转载），
     可自由使用、修改、替换。想换内容，直接改 body 字段即可。

   格式：
     { id, name:{zh,en}, group:'web', unit:'sentence',
       desc:{zh,en}, texts:[ { title:{zh,en}, body:'English text' } ] }
   ===================================================================== */

window.ET = window.ET || {};
window.ET.SOURCES = window.ET.SOURCES || [];

(function (ET) {

  ET.SOURCES.push({
    id: 'voa',
    group: 'web',
    unit: 'sentence',
    name: { zh: 'VOA 慢速英语风格', en: 'VOA-style Slow English' },
    desc: { zh: '短句、慢节奏，适合精听与拼写', en: 'Short sentences, slow pace' },
    texts: [
      {
        title: { zh: '睡眠与学习', en: 'Sleep and Learning' },
        body: 'Scientists say sleep is important for learning. When you sleep, your brain organizes what you learned during the day. Students who sleep well remember more information than students who stay up late. Experts suggest seven to nine hours of sleep each night. They also say you should not use your phone in bed. A quiet, dark room helps you fall asleep faster. Good sleep is not lazy. It is part of good study habits.'
      },
      {
        title: { zh: '世界上的水', en: 'Water in the World' },
        body: 'Most of our planet is covered by water. But only a small part of it is fresh water that people can drink. Many countries now face a shortage of clean water. Farmers use most of the fresh water to grow food. Cities use it for homes and factories. Experts say we should fix leaking pipes and use less water. Small changes at home can make a big difference. Turning off the tap while brushing your teeth saves several liters every day.'
      },
      {
        title: { zh: '城市里的树', en: 'Trees in the City' },
        body: 'Trees do more than make a city look beautiful. They clean the air and cool the streets in summer. A large tree can lower the temperature around it by several degrees. Trees also reduce noise and give birds a place to live. Some cities now plant trees along every new road. Studies show that people who live near trees feel less stressed. Planting a tree takes only a few minutes, but its benefits can last for a hundred years.'
      },
      {
        title: { zh: '如何开始一项新技能', en: 'How to Start a New Skill' },
        body: 'Many people want to learn a new skill but never begin. They wait for the perfect time or the perfect plan. In fact, the best way to start is to start small. Practice for ten minutes every day instead of two hours once a week. Write down what you did, and look at it again at the end of the month. Progress is often slow at first, and that is normal. The people who succeed are not always the most talented. They are simply the ones who keep going.'
      }
    ]
  });

  ET.SOURCES.push({
    id: 'bbc',
    group: 'web',
    unit: 'sentence',
    name: { zh: 'BBC Learning English 风格', en: 'BBC Learning English-style' },
    desc: { zh: '英式表达与地道短语，适合进阶', en: 'British usage and useful phrases' },
    texts: [
      {
        title: { zh: '为什么人们爱喝咖啡', en: 'Why People Love Coffee' },
        body: 'Coffee is one of the most popular drinks in the world. Millions of people start their morning with a cup of it. Some drink it to stay awake; others simply enjoy the taste. Scientists have studied coffee for many years, and their findings are mixed. A moderate amount may be harmless for most adults, but too much can make you anxious or keep you awake at night. If you find it hard to sleep, the answer might be simpler than you think: try cutting down.'
      },
      {
        title: { zh: '拖延症的真相', en: 'The Truth About Procrastination' },
        body: 'Putting things off is something we all do, but it is rarely about laziness. Research suggests that procrastination is often about emotions. When a task makes us feel worried or bored, we look for something that feels better right now. The problem is that the relief does not last. A useful trick is to make the first step ridiculously small. Instead of writing a report, promise yourself you will only open the document. Once you have started, carrying on becomes far easier.'
      },
      {
        title: { zh: '语言是怎么变化的', en: 'How Language Changes' },
        body: 'Languages are not fixed. They change slowly, year after year, as people use them. New words appear when we need them, and old ones quietly fall out of use. The internet has made this process much faster. A phrase can spread around the world in a matter of days. Some people worry that this is damaging the language, but historians point out that every generation has said the same thing. Change is not decline; it is simply what living languages do.'
      },
      {
        title: { zh: '通勤时间怎么用', en: 'Making the Most of Your Commute' },
        body: 'For many of us, the journey to work takes an hour or more each day. It is easy to see this as wasted time, but it does not have to be. Some people listen to podcasts or audiobooks while they travel. Others use the time to plan the day ahead or simply to think. A few even manage to study a language, repeating new words under their breath. Whatever you choose, the point is to decide in advance, rather than to let the time disappear on its own.'
      }
    ]
  });

  ET.SOURCES.push({
    id: 'daily',
    group: 'web',
    unit: 'paragraph',
    name: { zh: '每日精选短文', en: 'Daily Short Reads' },
    desc: { zh: '科技与生活主题，段落较长', en: 'Tech and life topics, longer passages' },
    texts: [
      {
        title: { zh: '人工智能与日常工作', en: 'AI and Everyday Work' },
        body: 'Artificial intelligence is already part of many jobs, though often in ways we do not notice. It sorts our emails, suggests the next word we type and helps doctors read images. This does not mean that machines are replacing people. In most cases they are taking over the boring parts of a task, leaving the judgement to us. The workers who benefit most are those who learn how to use these tools well and who keep asking questions the software cannot answer.'
      },
      {
        title: { zh: '阅读习惯的改变', en: 'How Reading Is Changing' },
        body: 'We read more words today than at any point in history, yet many of us read them in short bursts. Screens encourage skimming: we jump between paragraphs, follow links and rarely finish a long article. Deep reading, the kind that requires patience and a quiet room, is becoming a rare skill. Researchers warn that this shift affects concentration and memory. The good news is that the habit can be rebuilt. Twenty minutes a day with a printed book is still one of the cheapest forms of training for the mind.'
      },
      {
        title: { zh: '城市与乡村的选择', en: 'City or Countryside' },
        body: 'Where to live is one of the biggest decisions a person makes. Cities offer jobs, universities and public transport, but they also bring noise, high rents and long queues. The countryside offers space, quiet and lower costs, but often fewer opportunities and slower internet. In recent years, remote work has made the choice less final. A growing number of people now spend part of the year in each, keeping the advantages of both while accepting that they will never get all of them at once.'
      },
      {
        title: { zh: '为什么我们要运动', en: 'Why We Need to Move' },
        body: 'The human body was designed to move, yet modern life asks us to sit for most of the day. We sit at breakfast, in traffic, at a desk and then on the sofa. Scientists now describe long sitting as a health risk in its own right, separate from the question of exercise. The advice is not complicated: stand up every half an hour, walk during phone calls, and take the stairs when you can. None of it requires a gym or a special plan, and all of it adds up.'
      }
    ]
  });

})(window.ET);
