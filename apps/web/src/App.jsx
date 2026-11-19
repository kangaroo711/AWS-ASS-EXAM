import { useEffect, useMemo, useState } from "react";
import { questions as fallbackQuestions } from "@aws-ssa/shared";

const GLOSSARY = [
  ["EC2", "Elastic Compute Cloud", "弹性计算云 —— AWS 的虚拟服务器（云主机），题里的『实例 instance』就是一台 EC2 虚拟机"],
  ["EBS", "Elastic Block Store", "弹性块存储 —— 挂在 EC2 上的虚拟硬盘（云盘），数据持久保存"],
  ["Instance Store", "实例临时存储", "实例自带的临时盘 —— 实例一停数据全丢，只做临时缓存"],
  ["EFS", "Elastic File System", "弹性文件系统 —— 可被多台 EC2 同时挂载的共享网盘（NFS）"],
  ["S3", "Simple Storage Service", "简单存储服务 —— 对象存储（桶），存文件、备份、静态网站"],
  ["S3 存储层", "Standard / IA / Glacier", "按访问频率分层：Standard 热 → IA 不常访问 → Glacier 冰冷归档（越冷越便宜）"],
  ["IAM", "Identity and Access Management", "身份与访问管理 —— 最小权限原则的载体"],
  ["IAM Role", "IAM 角色", "临时权限身份 —— 自动轮换的临时凭证，不用管密钥"],
  ["STS", "Security Token Service", "安全令牌服务 —— 签发有时效的临时凭证"],
  ["KMS", "Key Management Service", "密钥管理服务 —— 托管加密密钥，主密钥永不离开 KMS"],
  ["CloudTrail", "云追踪", "操作审计日志 —— 记录所有 API 调用，合规审计必备"],
  ["CloudWatch", "云监控", "监控与告警 —— 运维仪表盘"],
  ["VPC", "Virtual Private Cloud", "虚拟私有云 —— 私有网络空间，内含子网、路由表、网关"],
  ["NAT Gateway", "Network Address Translation 网关", "让私有子网『只出不进』访问互联网"],
  ["IGW", "Internet Gateway", "互联网网关 —— VPC 连接公网的大门"],
  ["安全组 SG", "Security Group", "实例级防火墙 —— 有状态，只配允许规则"],
  ["NACL", "Network Access Control List", "子网级防火墙 —— 无状态，出入站分别配规则"],
  ["ALB / ELB", "Application / Elastic Load Balancer", "负载均衡器 —— ALB 是七层 HTTP 版"],
  ["ASG", "Auto Scaling Group", "自动伸缩组 —— 自动增减 EC2、替换不健康实例"],
  ["RDS", "Relational Database Service", "托管关系数据库（MySQL/PostgreSQL 等）"],
  ["Multi-AZ", "Multiple Availability Zones", "多可用区部署 —— 故障自动切换，高可用专用"],
  ["Read Replica", "只读副本", "异步复制的只读库 —— 分摊读流量（读写分离）"],
  ["DynamoDB", "—", "托管键值/文档 NoSQL —— 毫秒级延迟、按请求计费"],
  ["ElastiCache", "弹性缓存", "托管内存缓存（Redis/Memcached）"],
  ["Lambda", "—", "无服务器函数（FaaS）—— 无请求零成本"],
  ["Fargate", "无服务器容器引擎", "跑容器不用管服务器"],
  ["SQS", "Simple Queue Service", "消息队列 —— 削峰填谷、解耦"],
  ["SNS", "Simple Notification Service", "发布/订阅广播 —— 配合 SQS 叫 Fan-out"],
  ["Step Functions", "步骤函数", "可视化工作流编排 —— 内置重试/错误处理"],
  ["Route 53", "—", "AWS DNS —— 故障转移/加权/延迟/地理路由"],
  ["CloudFront", "—", "AWS CDN —— 全球边缘缓存加速"],
  ["Direct Connect", "直连专线", "物理专线接入 AWS —— 不走公网、稳定低延迟"],
  ["Site-to-Site VPN", "站点到站点 VPN", "IPsec 加密隧道连本地机房 ↔ VPC"],
  ["Transit Gateway", "中转网关", "VPC 互联中心枢纽 —— 星型架构"],
  ["VPC Peering", "VPC 对等连接", "两个 VPC 点对点直连 —— 非传递性"],
  ["Spot 实例", "竞价实例", "最高 90% off，可被 2 分钟通知回收，只用于可中断任务"],
  ["On-Demand", "按需实例", "按时长全价付费 —— 适合波动负载"],
  ["Reserved Instance", "预留实例", "承诺 1/3 年换折扣 —— 适合长期稳定负载"],
  ["PITR", "Point-in-Time Recovery", "时间点恢复 —— 恢复到保留期内任意秒级"],
  ["Snowball", "雪球迁移设备", "离线搬运存储箱 —— >10TB 大批量迁移"],
];

const LETTERS = ["A", "B", "C", "D"];

export default function App() {
  const [all, setAll] = useState(fallbackQuestions);
  const [source, setSource] = useState("内置题库（API 未连接）");
  const [answers, setAnswers] = useState({});
  const [filter, setFilter] = useState("全部");
  const [light, setLight] = useState(
    () => localStorage.getItem("saa-theme") === "light"
  );

  useEffect(() => {
    document.body.classList.toggle("light", light);
    localStorage.setItem("saa-theme", light ? "light" : "dark");
  }, [light]);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setAll(data);
          setSource("MySQL 题库（API）");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("saa-answers") || "{}");
      setAnswers(saved);
    } catch {}
  }, []);

  const updateAnswers = (next) => {
    setAnswers(next);
    localStorage.setItem("saa-answers", JSON.stringify(next));
  };

  const domains = useMemo(
    () => ["全部", ...new Set(all.map((q) => q.domain))],
    [all]
  );
  const list = useMemo(
    () => (filter === "全部" ? all : all.filter((q) => q.domain === filter)),
    [all, filter]
  );
  const done = Object.keys(answers).length;
  const right = Object.entries(answers).filter(
    ([id, a]) => all.find((q) => String(q.id) === id)?.answer === a
  ).length;
  const acc = done ? Math.round((right / done) * 100) : null;
  const allDone = done === all.length;

  const pick = (qid, opt) => {
    if (answers[qid] !== undefined) return;
    updateAnswers({ ...answers, [qid]: opt });
    fetch("/api/answers?" + new URLSearchParams({
      user_key: "local-user", question_id: qid, selected: opt,
    })).catch(() => {});
  };

  const showWrong = () => {
    const wrong = Object.entries(answers)
      .filter(([id, a]) => all.find((q) => String(q.id) === id)?.answer !== a)
      .map(([id]) => String(id));
    if (!wrong.length) { alert("当前筛选范围内没有错题，继续加油！"); return; }
    document.querySelectorAll(".q-card").forEach((el) => (el.style.display = "none"));
    wrong.forEach((id) => {
      const el = document.getElementById("qc" + id);
      if (el) el.style.display = "block";
    });
  };

  return (
    <div className="container">
      <header>
        <h1>AWS SSA 刷题平台</h1>
        <p>{source} · 逐选项解析 · 点击选项即时判分</p>
        <button className="btn ghost" onClick={() => setLight(!light)}>
          {light ? "☀️ 日间模式" : "🌙 夜间模式"}
        </button>
      </header>

      <div className="stats">
        <div className="stat"><div className="num">{all.length}</div><div className="label">总题数</div></div>
        <div className="stat"><div className="num">{done}</div><div className="label">已作答</div></div>
        <div className="stat"><div className="num">{right}</div><div className="label">答对</div></div>
        <div className="stat"><div className="num">{acc ?? "-"}</div><div className="label">正确率</div></div>
      </div>

      <div className="domain-bar">
        {domains.map((d) => (
          <span key={d} className={"domain-tag" + (filter === d ? " active" : "")}
                onClick={() => setFilter(d)}>{d}</span>
        ))}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => updateAnswers({})}>重置重刷</button>
        <button className="btn ghost" onClick={showWrong}>只看错题</button>
      </div>

      {allDone && (
        <div className="result">
          <h2>本轮完成</h2>
          <p>
            正确率 <b className="hl">{acc}%</b>（{right}/{all.length}）<br />
            {acc >= 72
              ? "✅ 达到真考及格线（720/1000 ≈ 72%）水平，可以约考了"
              : "📖 未到 72% 及格水平，点『只看错题』针对性复习后再刷一轮"}
          </p>
        </div>
      )}

      <div id="quiz">
        {list.map((q) => {
          const sel = answers[String(q.id)];
          return (
            <div key={q.id} id={"qc" + q.id}
                 className={"q-card" + (sel === undefined ? "" : sel === q.answer ? " correct" : " wrong")}>
              <div className="q-head">
                <span className="q-num">第 {q.id} 题</span>
                <span className="domain-badge">{q.domain}</span>
              </div>
              <div className="q-text">{q.question}</div>
              {q.options.map((opt, j) => {
                let cls = "opt";
                if (sel !== undefined) {
                  if (j === q.answer) cls += " right";
                  else if (j === sel) cls += " wrong";
                }
                return (
                  <button key={j} className={cls} disabled={sel !== undefined}
                          onClick={() => pick(q.id, j)}>
                    <b>{LETTERS[j]}.</b>{opt}
                  </button>
                );
              })}
              {sel !== undefined && (
                <div className="explain show">
                  {q.explanations.map((t, j) => (
                    <div key={j} className={"ex-item" + (j === q.answer ? " correct" : j === sel ? " incorrect" : "")}>
                      <b>{LETTERS[j]}.</b> {t}
                    </div>
                  ))}
                  {q.tip && <div className="tip">💡 <b>举一反三：</b>{q.tip}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="glossary">
        <h3 onClick={(e) => e.currentTarget.parentElement.classList.toggle("open")}>
          📖 专业术语表（点击展开/收起 · 缩写 = 英文全称 = 中文含义）
        </h3>
        <div className="g-body">
          <div className="g-grid">
            {GLOSSARY.map(([abbr, full, cn]) => (
              <div key={abbr} className="g-item">
                <b>{abbr}</b><br /><span className="full">{full}</span><br />
                <span className="cn">{cn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
