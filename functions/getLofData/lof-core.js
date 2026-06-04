const REFRESH_MS = Number(process.env.REFRESH_MS || 60_000);
const FUND_POOL_REFRESH_MS = Number(process.env.FUND_POOL_REFRESH_MS || 24 * 60 * 60 * 1000);
const JISILU_COOKIE = process.env.JISILU_COOKIE || "";
const ENABLE_EASTMONEY = process.env.ENABLE_EASTMONEY !== "false";

const JISILU_BASE = "https://app.jisilu.cn";
const EASTMONEY_LOF_URL = "https://fund.eastmoney.com/LOF_ljjz.html";
const EASTMONEY_FUND_SEARCH_URL = "https://fund.eastmoney.com/js/fundcode_search.js";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FALLBACK_LOFS = [
  { code: "501300", name: "海富通全球收益债券人民币(LOF)" },
  { code: "161130", name: "易方达纳斯达克100ETF联接(QDII-LOF)A(人民币)" },
  { code: "161127", name: "标普生物科技LOF" },
  { code: "161125", name: "标普500LOF" },
  { code: "162411", name: "华宝油气LOF" },
  { code: "160125", name: "南方香港优选股票" },
  { code: "161831", name: "银华恒生国企指数(QDII-LOF)A" },
  { code: "160526", name: "博时优势企业" },
  { code: "161229", name: "国投中国价值LOF" },
  { code: "161233", name: "国投瑞泰LOF" },
  { code: "163418", name: "兴全合兴LOF" },
  { code: "164403", name: "农业精选LOF" },
  { code: "166001", name: "中欧趋势LOF" },
  { code: "169101", name: "东方红睿丰LOF" },
  { code: "169201", name: "浙商鼎盈LOF" },
  { code: "161035", name: "医药增强LOF" },
  { code: "161227", name: "国投深证100LOF" },
  { code: "162412", name: "医疗基金LOF" },
  { code: "162711", name: "中证500LOF" },
  { code: "163821", name: "沪深300等权LOF" },
  { code: "167301", name: "保险主题LOF" },
  { code: "501050", name: "50AHLOF" },
  { code: "501059", name: "国企红利LOF" }
];

const ETF_NAME_ALLOWLIST = new Set(["161130"]);

function domesticIndex(symbol, label, weight = 0.95) {
  return {
    overrideExisting: true,
    useFundEstimate: false,
    label,
    components: [
      { symbol, weight },
      { symbol: "CASH_FLAT", weight: 1 - weight, flat: true }
    ]
  };
}

const FUTURES_ESTIMATORS = {
  "160723": { symbol: "hf_CL", label: "纽约原油期货", includeFx: true, overrideExisting: true },
  "501018": { symbol: "hf_CL", label: "纽约原油期货", includeFx: true, overrideExisting: true },
  "161129": { symbol: "hf_CL", label: "纽约原油期货", includeFx: true, overrideExisting: true },
  "164701": { symbol: "hf_GC", label: "纽约黄金期货", includeFx: true, overrideExisting: true },
  "160719": { symbol: "hf_GC", label: "纽约黄金期货", includeFx: true, overrideExisting: true },
  "161116": { symbol: "hf_GC", label: "纽约黄金期货", includeFx: true, overrideExisting: true },
  "161226": { symbol: "hf_SI", label: "纽约白银期货", includeFx: true, overrideExisting: true },
  "161125": { symbol: "gb_inx", label: "标普500指数", overrideExisting: true, sourcePrefix: "指数估算" },
  "160924": { symbol: "hf_HSI", label: "恒生指数期货", includeFx: true, fxSymbol: "HKDCNY", overrideExisting: true },
  "164705": { symbol: "hf_HSI", label: "恒生指数期货", includeFx: true, fxSymbol: "HKDCNY", overrideExisting: true },
  "501302": { symbol: "hf_HSI", label: "恒生指数期货", includeFx: true, fxSymbol: "HKDCNY", overrideExisting: true },
  "160125": {
    overrideExisting: true,
    label: "95%恒生指数 + 5%活期存款",
    components: [
      { symbol: "rt_hkHSI", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "160322": {
    overrideExisting: true,
    label: "90%恒生综合指数 + 10%活期存款",
    components: [
      { symbol: "em_124.HSCI", weight: 0.9, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.1, flat: true }
    ]
  },
  "160922": {
    overrideExisting: true,
    label: "95%恒生综合中小型股指数 + 5%活期存款",
    components: [
      { symbol: "em_124.HSMSI", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "161124": {
    overrideExisting: true,
    label: "95%恒生综合小型股指数 + 5%活期存款",
    components: [
      { symbol: "em_124.HSSI", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "162416": {
    overrideExisting: true,
    label: "95%恒生香港35 + 5%活期存款",
    components: [
      { symbol: "em_124.HSHK35", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "501301": {
    overrideExisting: true,
    label: "95%恒生中国(香港上市)30 + 5%活期存款",
    components: [
      { symbol: "em_124.HSFML25", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "501303": {
    overrideExisting: true,
    label: "95%恒生综合中型股指数 + 5%活期存款",
    components: [
      { symbol: "em_124.HSMI", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "501311": {
    overrideExisting: true,
    label: "95%恒生港股通新经济指数 + 5%活期存款",
    components: [
      { symbol: "em_124.HSSCNE", weight: 0.95, includeFx: true, fxSymbol: "HKDCNY" },
      { symbol: "CASH_FLAT", weight: 0.05, flat: true }
    ]
  },
  "161831": {
    symbol: "rt_hkHSCEI",
    label: "恒生中国企业指数",
    includeFx: true,
    fxSymbol: "HKDCNY",
    overrideExisting: true,
    sourcePrefix: "指数估算"
  },
  "501312": {
    overrideExisting: true,
    label: "80%纳斯达克100 + 10%恒生科技 + 10%中证综合债",
    components: [
      { symbol: "hf_NQ", weight: 0.8, includeFx: true },
      { symbol: "rt_hkHSTECH", weight: 0.1 },
      { symbol: "BOND_FLAT", weight: 0.1, flat: true }
    ]
  },
  "161130": { symbol: "gb_ndx", label: "纳斯达克100指数", overrideExisting: true, sourcePrefix: "指数估算" },
  "160628": domesticIndex("em_0.399965", "95%中证800地产 + 5%活期存款"),
  "161726": domesticIndex("em_0.399441", "95%国证生物医药 + 5%活期存款"),
  "501090": domesticIndex("em_2.931068", "95%中证消费龙头 + 5%活期存款"),
  "161724": domesticIndex("em_0.399990", "95%中证煤炭等权 + 5%活期存款"),
  "501043": domesticIndex("em_1.000300", "95%沪深300 + 5%活期存款"),
  "161035": domesticIndex("em_1.000121", "95%中证医药主题 + 5%活期存款"),
  "163118": domesticIndex("em_1.000808", "95%中证申万医药生物 + 5%活期存款"),
  "160629": domesticIndex("em_0.399971", "95%中证传媒 + 5%活期存款"),
  "165521": domesticIndex("em_1.000974", "95%中证800金融 + 5%活期存款"),
  "161029": domesticIndex("em_0.399986", "95%中证银行 + 5%活期存款"),
  "161121": domesticIndex("em_0.399986", "95%中证银行 + 5%活期存款"),
  "160631": domesticIndex("em_0.399986", "95%中证银行 + 5%活期存款"),
  "165309": domesticIndex("em_1.000300", "95%沪深300 + 5%活期存款"),
  "502048": domesticIndex("em_1.000016", "95%上证50 + 5%活期存款"),
  "161811": domesticIndex("em_1.000300", "95%沪深300 + 5%活期存款"),
  "501045": domesticIndex("em_1.000300", "95%沪深300 + 5%活期存款"),
  "163407": domesticIndex("em_1.000300", "95%沪深300 + 5%活期存款"),
  "161812": domesticIndex("em_0.399330", "95%深证100 + 5%活期存款"),
  "161227": domesticIndex("em_0.399330", "95%深证100 + 5%活期存款"),
  "160706": domesticIndex("em_1.000300", "95%沪深300 + 5%活期存款"),
  "162509": domesticIndex("em_1.000903", "95%中证A100 + 5%活期存款"),
  "160637": domesticIndex("em_0.399006", "95%创业板指 + 5%活期存款"),
  "165520": domesticIndex("em_1.000823", "95%中证800有色 + 5%活期存款"),
  "161725": domesticIndex("em_0.399997", "95%中证白酒 + 5%活期存款"),
  "161816": domesticIndex("em_1.000971", "95%中证等权90 + 5%活期存款"),
  "501037": domesticIndex("em_1.000905", "95%中证500 + 5%活期存款"),
  "168204": domesticIndex("em_0.399998", "95%中证煤炭 + 5%活期存款"),
  "160223": domesticIndex("em_0.399006", "95%创业板指 + 5%活期存款"),
  "164508": domesticIndex("em_1.000903", "95%中证A100 + 5%活期存款"),
  "501036": domesticIndex("em_1.000905", "95%中证500 + 5%活期存款"),
  "161032": domesticIndex("em_0.399998", "95%中证煤炭 + 5%活期存款"),
  "162711": domesticIndex("em_1.000905", "95%中证500 + 5%活期存款"),
  "168701": domesticIndex("em_0.399699", "95%香蜜湖金融科技 + 5%活期存款"),
  "160806": domesticIndex("em_1.000906", "95%中证800 + 5%活期存款"),
  "160620": domesticIndex("em_1.000805", "95%A股资源 + 5%活期存款"),
  "163115": domesticIndex("em_0.399967", "95%中证军工 + 5%活期存款"),
  "161024": domesticIndex("em_0.399967", "95%中证军工 + 5%活期存款"),
  "502003": domesticIndex("em_0.399967", "95%中证军工 + 5%活期存款")
};

let cache = {
  ok: false,
  rows: [],
  sources: [],
  warnings: [],
  refreshedAt: null,
  refreshing: false,
  error: null
};

let fundPoolCache = {
  rows: [],
  refreshedAt: 0
};

const columns = [
  { key: "code", label: "代码" },
  { key: "name", label: "名称" },
  { key: "t2Estimate", label: "T-2净值" },
  { key: "t2Premium", label: "T-2溢价" },
  { key: "t1Estimate", label: "T-1估值" },
  { key: "t1Premium", label: "T-1溢价" },
  { key: "realEstimate", label: "实时估值" },
  { key: "realPremium", label: "实时溢价" },
  { key: "latestEstimate", label: "最新估值" },
  { key: "latestPremium", label: "最新溢价" },
  { key: "benchmarkChange", label: "指数涨幅参考" },
  { key: "estimateDate", label: "估值日期" },
  { key: "estimateSource", label: "估值来源" },
  { key: "price", label: "现价" },
  { key: "change", label: "涨跌" },
  { key: "turnover", label: "成交额(万元)" },
  { key: "listedShares", label: "场内份额(万份)" },
  { key: "newShares", label: "新增份额(万份)" },
  { key: "nav", label: "净值" },
  { key: "navChange", label: "净值涨跌" },
  { key: "navDate", label: "净值日期" },
  { key: "purchaseLimit", label: "申购限额" },
  { key: "purchaseFee", label: "申购费" },
  { key: "redeemFee", label: "赎回费" }
];

function toNumber(value) {
  if (value === null || value === undefined || value === "" || value === "-") return null;
  const parsed = Number(String(value).replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\r\n/g, "\n").trim();
}

const COMMODITY_CODES = new Set([
  "160216", "160416", "160719", "160723", "161116", "161129",
  "161815", "162411", "162719", "163208", "164701", "165513", "501018"
]);
const EUROPE_US_CODES = new Set([
  "160125", "160644", "161125", "161126", "161127", "161128", "161130",
  "162415", "164906", "501225", "501300", "501312"
]);
const ASIA_CODES = new Set([
  "160322", "160717", "160922", "160924", "161124", "161831",
  "162416", "164705", "164824", "501021", "501025", "501301", "501302",
  "501303", "501305", "501306", "501307", "501310", "501311"
]);
const COMMODITY_KEYWORDS = ["原油", "石油", "油气", "黄金", "抗通胀", "全球商品", "大宗商品配置"];
const ASIA_KEYWORDS = ["港股", "香港", "恒生", "中概", "印度", "日本", "亚洲", "亚太", "越南", "中国香港"];
const EUROPE_US_KEYWORDS = [
  "美国", "欧美", "欧洲", "德国", "法国", "纳指", "纳斯达克", "标普", "道琼斯",
  "REIT", "REITS", "海外", "全球", "港美", "香港美国", "芯片", "科技", "信息", "生物科技", "消费", "医疗"
];
const CROSS_BORDER_KEYWORDS = [
  "QDII", "海外", "全球", "美国", "欧美", "欧洲", "德国", "法国", "纳指", "纳斯达克",
  "标普", "道琼斯", "港股", "香港", "港美", "恒生", "中概", "印度", "日本", "亚洲", "亚太", "越南"
];

function hasAnyKeyword(text, keywords) {
  const value = String(text || "").toUpperCase();
  return keywords.some((keyword) => value.includes(keyword.toUpperCase()));
}

function isListedLofCode(code) {
  return /^(16|50)\d{4}$/.test(code);
}

function isLofRow(row) {
  const code = normalizeText(row.code);
  const name = normalizeText(row.name);
  const sources = normalizeText(row.source).split("+");
  if (!/^\d{6}$/.test(code)) return false;
  if (!isListedLofCode(code)) return false;
  if (/ETF/i.test(name) && !/LOF/i.test(name) && !ETF_NAME_ALLOWLIST.has(code)) return false;
  if (ETF_NAME_ALLOWLIST.has(code)) return true;
  if (sources.includes("fallback")) return true;
  if (/LOF/i.test(name)) return true;
  if (row.source === "eastmoney-lof") return false;
  return false;
}

function classifyMarket(row) {
  const code = normalizeText(row.code);
  const text = `${row.name || ""} ${row.estimateSource || ""}`;
  if (EUROPE_US_CODES.has(code)) return "europe-us";
  if (/港美|香港.*美国|美国.*香港/.test(text)) return "europe-us";
  if (ASIA_CODES.has(code)) return "asia";
  if (COMMODITY_CODES.has(code) || hasAnyKeyword(text, COMMODITY_KEYWORDS)) return "commodity";
  if (hasAnyKeyword(text, ASIA_KEYWORDS)) return "asia";
  if (/中国A股|A股红利|A股资源|沪深|中证|国证|创业板|科创/.test(text)) return "domestic";
  if (hasAnyKeyword(text, CROSS_BORDER_KEYWORDS) && hasAnyKeyword(text, EUROPE_US_KEYWORDS)) return "europe-us";
  return "domestic";
}

function pickDate(row) {
  return normalizeText(row.last_est_time) || normalizeText(row.est_val_dt) || "";
}

function parsePurchaseLimit(row) {
  const minAmt = normalizeText(row.min_amt);
  const match = minAmt.match(/日累计申购限额[:：]\s*([^\n\r]+)/);
  if (match) return match[1].trim();
  return normalizeText(row.apply_status) || normalizeText(row.status);
}

function isOpenByText(text) {
  const value = normalizeText(text);
  if (!value) return null;
  if (/暂停|不可|停止|封闭|未开放|停牌|暂停\/不可/.test(value)) return false;
  return true;
}

function isTradableByText(text) {
  const value = normalizeText(text);
  if (!value) return null;
  if (/停牌|未上市|终止上市|退市|未开放|封闭|暂停交易|不可交易/.test(value)) return false;
  return true;
}

function hasTradingActivity(price, ...activityValues) {
  const p = toNumber(price);
  if (!p || p <= 0) return false;
  return activityValues.some((value) => {
    const n = toNumber(value);
    return n !== null && n > 0;
  });
}

function calcPremium(price, estimate) {
  const p = toNumber(price);
  const e = toNumber(estimate);
  if (!p || !e) return null;
  return ((p - e) / e) * 100;
}

function estimateByChange(baseValue, change) {
  const base = toNumber(baseValue);
  const pct = toNumber(change);
  if (!base || pct === null) return null;
  return base * (1 + pct / 100);
}

function formatFxSymbol(symbol) {
  if (symbol === "USDCNY") return "USD/CNY";
  if (symbol === "HKDCNY") return "HKD/CNY";
  return symbol;
}

function fromJisilu(row, category) {
  const c = row.cell || row;
  const price = toNumber(c.price);
  const estimate = toNumber(c.estimate_value);
  const nav = toNumber(c.fund_nav);
  const latestPremium = toNumber(c.discount_rt) ?? toNumber(c.nav_discount_rt);
  return {
    code: normalizeText(c.fund_id),
    name: normalizeText(c.fund_nm),
    category,
    realEstimate: null,
    realPremium: null,
    latestEstimate: estimate ?? nav,
    latestPremium: latestPremium ?? calcPremium(price, estimate ?? nav),
    estimateDate: pickDate(c),
    estimateSource: "",
    price,
    change: toNumber(c.increase_rt),
    turnover: toNumber(c.volume),
    listedShares: toNumber(c.amount),
    newShares: toNumber(c.amount_incr),
    nav,
    navChange: toNumber(c.nav_incr_rt),
    navDate: normalizeText(c.nav_dt),
    indexChange: toNumber(c.index_increase_rt) ?? toNumber(c.stock_increase_rt),
    baseIndexChange: toNumber(c.index_increase_rt) ?? toNumber(c.stock_increase_rt),
    benchmarkChange: toNumber(c.index_increase_rt) ?? toNumber(c.stock_increase_rt),
    purchaseLimit: parsePurchaseLimit(c),
    isOpen: isOpenByText(`${c.apply_status || ""} ${c.redeem_status || ""}`),
    isTradable:
      isTradableByText(`${c.notes || ""} ${c.apply_status || ""} ${c.redeem_status || ""}`) === false
        ? false
        : hasTradingActivity(c.price, c.volume, c.stock_volume),
    purchaseFee: normalizeText(c.apply_fee),
    redeemFee: normalizeText(c.redeem_fee),
    purchaseFeeTips: normalizeText(c.apply_fee_tips),
    redeemFeeTips: normalizeText(c.redeem_fee_tips),
    source: "jisilu",
    sourceDetail: category
  };
}

function fromLof8(row) {
  const price = toNumber(row.price);
  const estimate = toNumber(row.estNav);
  return {
    code: normalizeText(row.code),
    name: normalizeText(row.name),
    category: "lof8",
    realEstimate: null,
    realPremium: null,
    latestEstimate: estimate,
    latestPremium: toNumber(row.premium) ?? calcPremium(price, estimate),
    estimateDate: normalizeText(row.estTime),
    estimateSource: "",
    fundEstimate: row.hasEstNav ? estimate : null,
    price,
    change: toNumber(row.change),
    turnover: toNumber(row.amount),
    listedShares: null,
    newShares: null,
    nav: toNumber(row.nav),
    navChange: null,
    navDate: normalizeText(row.navDate),
    indexChange: toNumber(row.estChange),
    purchaseLimit: normalizeText(row.status),
    isOpen: isOpenByText(row.status),
    isTradable: isTradableByText(row.status) === false ? false : hasTradingActivity(row.price, row.volume, row.amount),
    purchaseFee: "",
    redeemFee: "",
    purchaseFeeTips: "",
    redeemFeeTips: "",
    source: "lof8",
    sourceDetail: "monitor"
  };
}

function fromJinkuaicha(row) {
  const price = toNumber(row.price);
  const nav = toNumber(row.nav);
  const purchaseLimitNumber = toNumber(row.purchase_limit);
  let purchaseLimit = "";
  if (row.is_suspended) {
    purchaseLimit = "停牌/未开放";
  } else if (row.can_purchase === false || purchaseLimitNumber === 0) {
    purchaseLimit = "暂停/不可申购";
  } else if (purchaseLimitNumber === null) {
    purchaseLimit = "开放/无限额";
  } else {
    purchaseLimit = `${purchaseLimitNumber.toLocaleString("zh-CN")}元`;
  }
  return {
    code: normalizeText(row.code),
    name: normalizeText(row.name),
    category: "金快查",
    realEstimate: null,
    realPremium: null,
    latestEstimate: nav,
    latestPremium: toNumber(row.premium_rate) ?? calcPremium(price, nav),
    estimateDate: normalizeText(row.data_date),
    estimateSource: "",
    price,
    change: toNumber(row.change_pct),
    turnover: toNumber(row.amount) ? toNumber(row.amount) / 10_000 : null,
    listedShares: null,
    newShares: null,
    nav,
    navChange: null,
    navDate: normalizeText(row.nav_date),
    indexChange: null,
    purchaseLimit,
    isOpen: row.is_suspended ? false : row.can_purchase !== false && purchaseLimitNumber !== 0,
    isTradable: !row.is_suspended && hasTradingActivity(row.price, row.volume, row.amount),
    purchaseFee: toNumber(row.purchase_fee_rate) === null ? "" : `${toNumber(row.purchase_fee_rate).toFixed(2)}%`,
    redeemFee: toNumber(row.redemption_fee_rate) === null ? "" : `${toNumber(row.redemption_fee_rate).toFixed(2)}%`,
    purchaseFeeTips: "",
    redeemFeeTips: "",
    source: "jinkuaicha",
    sourceDetail: "funds"
  };
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json,text/plain,*/*",
      "Referer": `${JISILU_BASE}/data/lof/`,
      ...headers
    }
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) return {};
  return JSON.parse(text);
}

async function fetchJisiluList(path, category) {
  const url = `${JISILU_BASE}${path}?rp=200&page=1&_=${Date.now()}`;
  const headers = JISILU_COOKIE ? { Cookie: JISILU_COOKIE } : {};
  const json = await fetchJson(url, headers);
  const rows = Array.isArray(json.rows) ? json.rows.map((row) => fromJisilu(row, category)) : [];
  const warning = json.warn ? normalizeText(json.warn) : "";
  return { rows, warning, all: json.all, total: json.total };
}

async function fetchLof8() {
  const json = await fetchJson("https://lof8.cn/lof-monitor/api/lof");
  return Array.isArray(json.data) ? json.data.map(fromLof8) : [];
}

async function fetchJinkuaicha() {
  const json = await fetchJson("https://jinkuaicha.com/api/funds?page=1&page_size=600&suspended=1&unpurchasable=1");
  return Array.isArray(json.data) ? json.data.map(fromJinkuaicha) : [];
}

function stripHtml(value) {
  return normalizeText(String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">"));
}

function matchCell(rowHtml, className) {
  const match = rowHtml.match(new RegExp(`<td[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function fromEastmoneyLof(code, rowHtml) {
  const titleMatch = rowHtml.match(new RegExp(`<td[^>]*class=["'][^"']*tol[^"']*["'][^>]*>[\\s\\S]*?<a[^>]*title=["']([^"']+)["'][^>]*href=["']${code}\\.html["']`, "i"));
  const name = normalizeText(titleMatch?.[1]) || code;
  const nav = toNumber(matchCell(rowHtml, "dwjz"));
  const totalNav = toNumber(matchCell(rowHtml, "ljjz"));
  const navChange = toNumber(matchCell(rowHtml, "rzzl"));
  const purchaseStatus = matchCell(rowHtml, "sgzt");
  const redeemStatus = matchCell(rowHtml, "shzt");
  return {
    code,
    name,
    category: "天天基金LOF",
    categoryKey: null,
    realEstimate: null,
    realPremium: null,
    latestEstimate: nav,
    latestPremium: null,
    estimateDate: "",
    estimateSource: "",
    price: null,
    change: null,
    turnover: null,
    listedShares: null,
    newShares: null,
    nav,
    totalNav,
    navChange,
    navDate: "",
    indexChange: null,
    benchmarkChange: null,
    purchaseLimit: purchaseStatus,
    isOpen: isOpenByText(`${purchaseStatus} ${redeemStatus}`),
    isTradable: null,
    purchaseFee: "",
    redeemFee: "",
    purchaseFeeTips: "",
    redeemFeeTips: "",
    source: "eastmoney-lof",
    sourceDetail: "fund-pool"
  };
}

async function fetchEastmoneyLofList() {
  const now = Date.now();
  if (fundPoolCache.rows.length && now - fundPoolCache.refreshedAt < FUND_POOL_REFRESH_MS) {
    return fundPoolCache.rows;
  }
  const res = await fetch(EASTMONEY_LOF_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": "https://fund.eastmoney.com/"
    }
  });
  if (!res.ok) throw new Error(`天天基金 LOF 清单 HTTP ${res.status}`);
  const html = new TextDecoder("gb18030").decode(await res.arrayBuffer());
  const rows = [];
  for (const match of html.matchAll(/<tr id=["']tr(\d{6})["']>([\s\S]*?)(?=<tr id=["']tr\d{6}["']>|<\/tbody>)/g)) {
    const row = fromEastmoneyLof(match[1], match[2]);
    if (isLofRow(row)) rows.push(row);
  }
  fundPoolCache = {
    rows,
    refreshedAt: now
  };
  return rows;
}

function fromEastmoneyFundSearch(item) {
  return {
    code: normalizeText(item[0]),
    name: normalizeText(item[2]),
    category: "天天基金代码库",
    categoryKey: null,
    realEstimate: null,
    realPremium: null,
    latestEstimate: null,
    latestPremium: null,
    estimateDate: "",
    estimateSource: "",
    price: null,
    change: null,
    turnover: null,
    listedShares: null,
    newShares: null,
    nav: null,
    totalNav: null,
    navChange: null,
    navDate: "",
    indexChange: null,
    benchmarkChange: null,
    purchaseLimit: "",
    isOpen: null,
    isTradable: null,
    purchaseFee: "",
    redeemFee: "",
    purchaseFeeTips: "",
    redeemFeeTips: "",
    source: "eastmoney-search",
    sourceDetail: "fund-code-search"
  };
}

async function fetchEastmoneyFundSearchLofs() {
  const res = await fetch(EASTMONEY_FUND_SEARCH_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": "https://fund.eastmoney.com/"
    }
  });
  if (!res.ok) throw new Error(`天天基金代码库 HTTP ${res.status}`);
  const script = await res.text();
  const match = script.match(/var\s+r\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) return [];
  const data = JSON.parse(match[1]);
  return data.map(fromEastmoneyFundSearch).filter(isLofRow);
}

async function fetchEastmoneyNav(code) {
  const url = `https://api.fund.eastmoney.com/f10/lsjz?fundCode=${code}&pageIndex=1&pageSize=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": `https://fundf10.eastmoney.com/jjjz_${code}.html`
    }
  });
  if (!res.ok) return null;
  const json = await res.json();
  const latest = json.Data?.LSJZList?.[0];
  if (!latest) return null;
  return {
    nav: toNumber(latest.DWJZ),
    navDate: normalizeText(latest.FSRQ),
    navChange: toNumber(latest.JZZZL),
    purchaseLimit: normalizeText(latest.SGZT)
  };
}

function parseListedFundQuote(symbol, values) {
  const code = symbol.replace(/^(sh|sz)/, "");
  const price = toNumber(values[3]);
  const previous = toNumber(values[2]);
  return {
    code,
    name: normalizeText(values[0]),
    price,
    change: price && previous ? ((price - previous) / previous) * 100 : null,
    turnover: toNumber(values[9]) ? toNumber(values[9]) / 10_000 : null,
    volume: toNumber(values[8]),
    date: normalizeText(values[30]),
    time: normalizeText(values[31])
  };
}

async function fetchListedFundQuotesBatch(codes) {
  const symbols = codes.map((code) => `${String(code).startsWith("5") ? "sh" : "sz"}${code}`);
  const url = `https://hq.sinajs.cn/list=${symbols.join(",")}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": "https://finance.sina.com.cn"
    }
  });
  if (!res.ok) throw new Error(`新浪场内基金行情 HTTP ${res.status}`);
  const text = new TextDecoder("gb18030").decode(await res.arrayBuffer());
  const quotes = new Map();
  for (const match of text.matchAll(/var hq_str_([^=]+)="([^"]*)";/g)) {
    const quote = parseListedFundQuote(match[1], match[2].split(","));
    if (quote.code && quote.price) quotes.set(quote.code, quote);
  }
  return quotes;
}

async function fetchListedFundQuotes(codes) {
  const quotes = new Map();
  const unique = [...new Set(codes)].filter(Boolean);
  for (let index = 0; index < unique.length; index += 80) {
    const batch = unique.slice(index, index + 80);
    const batchQuotes = await fetchListedFundQuotesBatch(batch);
    for (const [code, quote] of batchQuotes) quotes.set(code, quote);
  }
  return quotes;
}

async function fetchFallbackLofs() {
  const codes = FALLBACK_LOFS.map((fund) => fund.code);
  const [quotes, navs] = await Promise.all([
    fetchListedFundQuotes(codes).catch(() => new Map()),
    mapLimit(codes, 4, (code) => fetchEastmoneyNav(code))
  ]);
  return FALLBACK_LOFS.map((fund, index) => {
    const quote = quotes.get(fund.code);
    const nav = navs[index];
    const price = quote?.price ?? null;
    const latestEstimate = nav?.nav ?? null;
    const purchaseLimit = nav?.purchaseLimit || "";
    return {
      code: fund.code,
      name: fund.name || quote?.name || fund.code,
      category: "补充清单",
      realEstimate: null,
      realPremium: null,
      latestEstimate,
      latestPremium: calcPremium(price, latestEstimate),
      estimateDate: nav?.navDate || quote?.date || "",
      estimateSource: "",
      price,
      change: quote?.change ?? null,
      turnover: quote?.turnover ?? null,
      listedShares: null,
      newShares: null,
      nav: nav?.nav ?? null,
      navChange: nav?.navChange ?? null,
      navDate: nav?.navDate || "",
      indexChange: null,
      purchaseLimit,
      isOpen: isOpenByText(purchaseLimit),
      isTradable: hasTradingActivity(price, quote?.volume, quote?.turnover),
      purchaseFee: "",
      redeemFee: "",
      purchaseFeeTips: "",
      redeemFeeTips: "",
      source: "fallback",
      sourceDetail: "supplement"
    };
  });
}

async function enrichWithListedQuotes(rows) {
  const codes = rows.map((row) => row.code).filter(Boolean);
  if (!codes.length) return rows;
  const quotes = await fetchListedFundQuotes(codes).catch(() => new Map());
  if (!quotes.size) return rows;
  return rows.map((row) => {
    const quote = quotes.get(row.code);
    if (!quote) return row;
    const latestEstimate = row.latestEstimate ?? row.nav;
    return {
      ...row,
      name: row.name || quote.name,
      price: row.price ?? quote.price,
      change: row.change ?? quote.change,
      turnover: row.turnover ?? quote.turnover,
      latestPremium: row.latestPremium ?? calcPremium(quote.price, latestEstimate),
      isTradable: row.isTradable ?? hasTradingActivity(quote.price, quote.volume, quote.turnover)
    };
  });
}

async function fetchEastmoneyEstimate(code) {
  const res = await fetch(`https://fundgz.1234567.com.cn/js/${code}.js`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": "https://fund.eastmoney.com/"
    }
  });
  if (!res.ok) return null;
  const text = await res.text();
  const match = text.match(/jsonpgz\((.*)\);?$/);
  if (!match) return null;
  const data = JSON.parse(match[1]);
  const estimate = toNumber(data.gsz);
  if (!estimate) return null;
  return {
    estimate,
    change: toNumber(data.gszzl),
    time: normalizeText(data.gztime)
  };
}

function formatQuoteTime(seconds) {
  const value = toNumber(seconds);
  if (!value) return "";
  return new Date(value * 1000).toLocaleString("zh-CN", {
    hour12: false,
    timeZone: "Asia/Shanghai"
  });
}

function parseSinaQuoteLine(symbol, values) {
  if (symbol === "USDCNY" || symbol === "HKDCNY" || symbol === "fx_susdcny" || symbol === "fx_shkdcny") {
    return {
      symbol,
      price: toNumber(values[1]),
      previous: toNumber(values[5] ?? values[3]),
      time: values[0],
      date: values[10] || values[17] || ""
    };
  }
  if (symbol.startsWith("rt_hk") || symbol.startsWith("hk")) {
    return {
      symbol,
      price: toNumber(values[6]),
      previous: toNumber(values[3]),
      time: values[18] || "",
      date: values[17] ? values[17].replaceAll("/", "-") : ""
    };
  }
  if (symbol.startsWith("gb_")) {
    const price = toNumber(values[1]);
    const pct = toNumber(values[2]);
    return {
      symbol,
      price,
      previous: price && pct !== null ? price / (1 + pct / 100) : toNumber(values[5]),
      time: normalizeText(values[3]).split(" ")[1] || "",
      date: normalizeText(values[3]).split(" ")[0] || ""
    };
  }
  return {
    symbol,
    price: toNumber(values[0]),
    previous: toNumber(values[7]),
    time: values[6],
    date: values[12] || ""
  };
}

async function fetchSinaQuotes(symbols) {
  const unique = [...new Set(symbols)];
  if (!unique.length) return new Map();
  const url = `https://hq.sinajs.cn/list=${unique.join(",")}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": "https://finance.sina.com.cn"
    }
  });
  if (!res.ok) throw new Error(`新浪行情 HTTP ${res.status}`);
  const text = await res.text();
  const quotes = new Map();
  for (const match of text.matchAll(/var hq_str_([^=]+)="([^"]*)";/g)) {
    quotes.set(match[1], parseSinaQuoteLine(match[1], match[2].split(",")));
  }
  return quotes;
}

function formatEastmoneyTimestamp(seconds) {
  const date = new Date(seconds * 1000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEastmoneyIndexQuotes(symbols) {
  const unique = [...new Set(symbols)];
  const quotes = new Map();
  await mapLimit(unique, 2, async (symbol, index) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        if (attempt > 0) await delay(200 * attempt + (index % 2) * 80);
        const secid = symbol.replace(/^em_/, "");
        const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secid)}&fields=f43,f57,f58,f60,f86,f152`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "Referer": "https://quote.eastmoney.com"
          }
        });
        if (!res.ok) throw new Error(`东方财富指数 HTTP ${res.status}`);
        const json = await res.json();
        const data = json.data;
        if (!data) return;
        const scale = 10 ** (toNumber(data.f152) ?? 2);
        const price = toNumber(data.f43) / scale;
        const previous = toNumber(data.f60) / scale;
        if (!price || !previous) return;
        const stamp = data.f86 ? formatEastmoneyTimestamp(Number(data.f86)) : { date: "", time: "" };
        quotes.set(symbol, {
          symbol,
          price,
          previous,
          date: stamp.date,
          time: stamp.time
        });
        return;
      } catch {
        // Keep the rest of the quote batch usable if one Eastmoney symbol hiccups.
      }
    }
  });
  return quotes;
}

async function fetchMarketQuotes(symbols) {
  const sinaSymbols = symbols.filter((symbol) => !symbol.startsWith("em_"));
  const eastmoneySymbols = symbols.filter((symbol) => symbol.startsWith("em_"));
  const [sinaQuotes, eastmoneyQuotes] = await Promise.all([
    fetchSinaQuotes(sinaSymbols).catch(() => new Map()),
    fetchEastmoneyIndexQuotes(eastmoneySymbols).catch(() => new Map())
  ]);
  return new Map([...sinaQuotes, ...eastmoneyQuotes]);
}

async function enrichWithFutures(rows) {
  const mappedRows = rows.filter((row) => FUTURES_ESTIMATORS[row.code] && row.nav && row.price);
  if (!mappedRows.length) return rows;
  const symbols = [...new Set(mappedRows.flatMap((row) => {
    const config = FUTURES_ESTIMATORS[row.code];
    const components = config.components || [config];
    return components.flatMap((component) => {
      if (component.flat) return [];
      return component.includeFx ? [component.symbol, component.fxSymbol || "USDCNY"] : [component.symbol];
    });
  }))];
  let quotes = new Map();
  try {
    quotes = await fetchMarketQuotes(symbols);
  } catch {
    return rows;
  }

  return rows.map((row) => {
    const config = FUTURES_ESTIMATORS[row.code];
    if (!config || (row.realEstimate && !config.overrideExisting)) return row;
    const components = config.components || [config];
    let weightedReturn = 0;
    let quoteDate = "";
    let quoteTime = "";
    for (const component of components) {
      if (component.flat) continue;
      const quote = quotes.get(component.symbol);
      if (!quote?.price) return row;
      const base = toNumber(quote.previous);
      if (!base) return row;
      let componentFactor = quote.price / base;
      if (component.includeFx) {
        const fx = quotes.get(component.fxSymbol || "USDCNY");
        const fxBase = toNumber(fx?.previous);
        if (fx?.price && fxBase) componentFactor *= fx.price / fxBase;
      }
      weightedReturn += (component.weight ?? 1) * (componentFactor - 1);
      quoteDate = quote.date || quoteDate;
      quoteTime = quote.time || quoteTime;
    }
    const factor = 1 + weightedReturn;
    const baseValueSource = config.overrideExisting
      ? (config.useFundEstimate === false
        ? (row.realEstimate ?? row.latestEstimate ?? row.nav)
        : (row.fundEstimate ?? row.realEstimate ?? row.latestEstimate ?? row.nav))
      : row.nav;
    const baseFundValue = toNumber(baseValueSource);
    if (!baseFundValue) return row;
    const realEstimate = baseFundValue * factor;
    const realPremium = calcPremium(row.price, realEstimate);
    const change = (factor - 1) * 100;
    const t1IndexChange = row.t1IndexChange ?? row.indexChange ?? row.fundEstimateChange ?? null;
    return {
      ...row,
      realEstimate,
      realPremium,
      t1IndexChange,
      indexChange: config.overrideExisting ? change : row.indexChange ?? change,
      benchmarkChange: config.overrideExisting ? change : (row.benchmarkChange ?? row.indexChange ?? change),
      estimateDate: quoteDate && quoteTime ? `${quoteDate} ${quoteTime}` : row.estimateDate,
      estimateSource: config.components
        ? `基准估算：${config.label}`
        : `${config.sourcePrefix || "期货估算"}：${config.label}${config.includeFx ? ` + ${formatFxSymbol(config.fxSymbol || "USDCNY")}` : ""}`
    };
  });
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await mapper(items[index], index);
      } catch {
        results[index] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function enrichWithEastmoney(rows) {
  if (!ENABLE_EASTMONEY || rows.length === 0) return rows;
  const estimates = await mapLimit(rows, 8, (row) => fetchEastmoneyEstimate(row.code));
  return rows.map((row, index) => {
    const live = estimates[index];
    if (!live) return row;
    return {
      ...row,
      fundEstimate: live.estimate,
      fundEstimateTime: live.time,
      fundEstimateChange: live.change,
      t1IndexChange: row.t1IndexChange ?? row.indexChange ?? live.change,
      indexChange: row.indexChange ?? live.change
    };
  });
}

function mergeRows(groups) {
  const byCode = new Map();
  for (const row of groups.flat()) {
    if (!row.code || !isLofRow(row)) continue;
    const existing = byCode.get(row.code);
    if (!existing) {
      byCode.set(row.code, row);
      continue;
    }
    const merged = { ...row, ...existing };
    for (const [key, value] of Object.entries(row)) {
      if (existing[key] === null || existing[key] === "" || existing[key] === undefined) {
        merged[key] = value;
      }
    }
    if (existing.isOpen === false || row.isOpen === false) {
      merged.isOpen = false;
      if (row.isOpen === false && row.purchaseLimit) merged.purchaseLimit = row.purchaseLimit;
    } else if (existing.isOpen === true || row.isOpen === true) {
      merged.isOpen = true;
    }
    if (existing.isTradable === false || row.isTradable === false) {
      merged.isTradable = false;
      if (row.isTradable === false && row.purchaseLimit) merged.purchaseLimit = row.purchaseLimit;
    } else if (existing.isTradable === true || row.isTradable === true) {
      merged.isTradable = true;
    }
    merged.source = existing.source === row.source ? existing.source : `${existing.source}+${row.source}`;
    byCode.set(row.code, merged);
  }
  return [...byCode.values()].sort((a, b) => {
    const ap = a.realPremium ?? a.latestPremium ?? -Infinity;
    const bp = b.realPremium ?? b.latestPremium ?? -Infinity;
    return bp - ap;
  });
}

function finalizeRows(rows) {
  return rows
    .filter(isLofRow)
    .map((row) => {
      const categoryKey = row.categoryKey || classifyMarket(row);
      const hasBenchmark = Boolean(FUTURES_ESTIMATORS[row.code]);
      const t2Estimate = categoryKey === "europe-us" ? (row.nav ?? null) : null;
      const t1Estimate = hasBenchmark
        ? (row.fundEstimate ?? row.latestEstimate ?? estimateByChange(row.nav, row.t1IndexChange ?? row.indexChange))
        : null;
      const realEstimate = hasBenchmark ? (row.realEstimate ?? null) : null;
      return {
        ...row,
        categoryKey,
        hasBenchmark,
        t2Estimate,
        t2Premium: calcPremium(row.price, t2Estimate),
        t1Estimate,
        t1Premium: calcPremium(row.price, t1Estimate),
        realEstimate,
        realPremium: calcPremium(row.price, realEstimate)
      };
    });
}

async function refreshData() {
  if (cache.refreshing) return cache;
  cache.refreshing = true;
  const warnings = [];
  const sources = [];
  try {
    const jobs = await Promise.allSettled([
      fetchJisiluList("/data/lof/index_lof_list/", "指数LOF"),
      fetchJisiluList("/data/lof/stock_lof_list/", "股票LOF"),
      fetchJisiluList("/data/lof/arb_list/", "套利列表"),
      fetchLof8(),
      fetchJinkuaicha(),
      fetchFallbackLofs(),
      fetchEastmoneyLofList(),
      fetchEastmoneyFundSearchLofs()
    ]);

    const jisiluGroups = [];
    for (const result of jobs.slice(0, 3)) {
      if (result.status === "fulfilled") {
        jisiluGroups.push(result.value.rows);
        if (result.value.warning) warnings.push(result.value.warning);
      } else {
        warnings.push(`集思录接口失败：${result.reason.message}`);
      }
    }

    const lof8Rows = jobs[3].status === "fulfilled" ? jobs[3].value : [];
    if (jobs[3].status === "rejected") warnings.push(`lof8 接口失败：${jobs[3].reason.message}`);
    const jinkuaichaRows = jobs[4].status === "fulfilled" ? jobs[4].value : [];
    if (jobs[4].status === "rejected") warnings.push(`金快查接口失败：${jobs[4].reason.message}`);
    const fallbackRows = jobs[5].status === "fulfilled" ? jobs[5].value : [];
    if (jobs[5].status === "rejected") warnings.push(`补充基金清单失败：${jobs[5].reason.message}`);
    const eastmoneyLofRows = jobs[6].status === "fulfilled" ? jobs[6].value : [];
    if (jobs[6].status === "rejected") warnings.push(`天天基金 LOF 清单失败：${jobs[6].reason.message}`);
    const eastmoneySearchRows = jobs[7].status === "fulfilled" ? jobs[7].value : [];
    if (jobs[7].status === "rejected") warnings.push(`天天基金代码库失败：${jobs[7].reason.message}`);

    if (jisiluGroups.flat().length) sources.push("集思录 LOF 列表");
    if (lof8Rows.length) sources.push("lof8.cn LOF monitor");
    if (jinkuaichaRows.length) sources.push("金快查");
    if (fallbackRows.length) sources.push("补充基金清单");
    if (eastmoneyLofRows.length) sources.push("天天基金 LOF 完整清单");
    if (eastmoneySearchRows.length) sources.push("天天基金代码库");
    if (ENABLE_EASTMONEY) sources.push("天天基金实时估值");

    const merged = mergeRows([...jisiluGroups, lof8Rows, jinkuaichaRows, fallbackRows, eastmoneyLofRows, eastmoneySearchRows]);
    const rows = finalizeRows(await enrichWithFutures(await enrichWithEastmoney(await enrichWithListedQuotes(merged))));
    if (rows.some((row) => /^(期货估算|指数估算|基准估算)/.test(row.estimateSource || ""))) {
      sources.push("新浪/东方财富期货、指数、汇率");
    }
    cache = {
      ok: rows.length > 0,
      rows,
      columns,
      sources,
      warnings: [...new Set(warnings)],
      refreshedAt: new Date().toISOString(),
      refreshing: false,
      error: null
    };
  } catch (error) {
    cache = {
      ...cache,
      ok: false,
      refreshing: false,
      error: error.message,
      refreshedAt: new Date().toISOString()
    };
  }
  return cache;
}

function getMemoryCache() {
  return cache;
}

module.exports = { columns, getMemoryCache, refreshData, REFRESH_MS };
