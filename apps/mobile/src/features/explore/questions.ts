export type AIQuestion = {
  id: number;
  question: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
};

export const aiQuestions: AIQuestion[] = [
  {id: 1, question: '以下哪个属于人工智能应用？', options: ['A 自动驾驶', 'B 普通计算器', 'C 机械钟表', 'D 传统电话'], answer: 0, explanation: '自动驾驶利用人工智能进行环境感知和路径决策。'},
  {id: 2, question: '人工智能最接近下面哪种描述？', options: ['A 让机器完成需要智能的任务', 'B 只让电脑运行更快', 'C 只制造机器人外壳', 'D 把所有资料打印出来'], answer: 0, explanation: '人工智能让计算机通过感知、学习和推理来完成智能任务。'},
  {id: 3, question: '机器学习主要让计算机做什么？', options: ['A 从数据中学习规律', 'B 永远不用程序', 'C 只保存照片', 'D 只计算加减法'], answer: 0, explanation: '机器学习通过数据寻找规律，再用规律帮助预测或分类。'},
  {id: 4, question: '深度学习通常擅长处理哪类任务？', options: ['A 图像和语音等复杂数据', 'B 手工抄写作业', 'C 给纸张装订', 'D 调整桌椅高度'], answer: 0, explanation: '深度学习能从图像、语音等复杂数据中自动提取特征。'},
  {id: 5, question: '计算机视觉主要帮助AI理解什么？', options: ['A 图片和视频内容', 'B 食物的味道', 'C 风的温度', 'D 纸张的重量'], answer: 0, explanation: '计算机视觉让机器能够识别和理解图片、视频中的信息。'},
  {id: 6, question: '自然语言处理主要研究什么？', options: ['A 让AI理解和生成语言', 'B 让手机屏幕更亮', 'C 让键盘更大', 'D 让网络线更长'], answer: 0, explanation: '自然语言处理帮助AI理解、分析并生成我们使用的语言。'},
  {id: 7, question: '智能助手能回答问题，主要会用到什么能力？', options: ['A 自然语言处理', 'B 机械传动', 'C 电路焊接', 'D 纸质档案'], answer: 0, explanation: '智能助手需要理解用户的问题并用自然语言组织回答。'},
  {id: 8, question: '视频平台推荐你喜欢的内容，常用的是？', options: ['A 推荐算法', 'B 闹钟程序', 'C 计算器按键', 'D 文件夹颜色'], answer: 0, explanation: '推荐算法会根据兴趣和行为，为用户挑选可能喜欢的内容。'},
  {id: 9, question: '训练AI识别猫和狗时，最需要准备什么？', options: ['A 标注过的猫狗图片数据', 'B 一张空白纸', 'C 一把尺子', 'D 一本日历'], answer: 0, explanation: '训练数据和正确标签能帮助AI学习猫和狗之间的区别。'},
  {id: 10, question: '机器人要安全避开障碍物，通常需要？', options: ['A 传感器感知周围环境', 'B 只增加外壳颜色', 'C 关掉所有程序', 'D 只靠人工推着走'], answer: 0, explanation: '传感器提供周围环境信息，AI据此规划安全移动路线。'},
];
