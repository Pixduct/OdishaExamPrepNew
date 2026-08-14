import { supabase } from '../lib/supabase';

export interface CurrentAffairsMCQ {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface CurrentAffairsItem {
  id: string;
  slug: string;
  title: string;
  category: 'Odisha' | 'National' | 'World' | string;
  event_date: string;
  summary: string;
  full_context: string;
  static_gk_pointers?: string;
  data_table_html?: string;
  mcqs?: CurrentAffairsMCQ[];
  sources?: string;
  image_url?: string;
  is_published?: boolean;
  created_at?: string;
}

export const FALLBACK_CURRENT_AFFAIRS: CurrentAffairsItem[] = [
  {
    id: "ca-odisha-01",
    slug: "odisha-subhadra-yojana-phase-3-disbursement",
    title: "Odisha Government Rolls Out Subhadra Yojana Phase 3 Financial Assistance for Women",
    category: "Odisha",
    event_date: "2026-08-14",
    summary: "• Over 25 lakh eligible women beneficiaries across 30 districts received ₹5,000 direct bank transfers in Phase 3.\n• Scheme aims to empower women economically by providing ₹10,000 annually over 5 years (total ₹50,000).\n• Nodal department executing the scheme is the Department of Women and Child Development, Odisha.",
    full_context: `<p>The Odisha State Government has officially initiated the third phase disbursement under its flagship <strong>Subhadra Yojana</strong> scheme. In this phase, direct financial assistance of ₹5,000 was credited into the Aadhaar-seeded bank accounts of over 25 lakh beneficiaries across urban and rural local bodies.</p>

<p>Subhadra Yojana is designed to promote economic independence, health awareness, and financial inclusion among women aged 21 to 60 years in Odisha. Under the scheme guidelines, each eligible beneficiary receives ₹10,000 per year in two equal installments of ₹5,000 on <em>Raksha Bandhan</em> and <em>International Women's Day (March 8)</em> over a total span of 5 fiscal years (cumulatively ₹50,000).</p>

<h3>Key Implementation Guidelines & Eligibility Metrics</h3>
<ul>
  <li><strong>Age Limits:</strong> Women aged 21 to 60 years residing in Odisha with valid Aadhaar & single-operated bank accounts.</li>
  <li><strong>Exclusions:</strong> Women or family members holding government jobs, paying income tax, or holding elected public offices (MP/MLA).</li>
  <li><strong>Subhadra Debit Card:</strong> Beneficiaries are issued co-branded NPCI Subhadra Debit Cards to encourage digital transaction adoption.</li>
</ul>`,
    static_gk_pointers: `<div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 18px; border-radius: 12px; margin: 20px 0;">
  <h4 style="color: #1e40af; font-weight: 800; margin-bottom: 8px;">🎯 Static GK & Exam Connection (OPSC / OSSC CGL / OSSSC)</h4>
  <ul style="color: #1e3a8a; font-size: 14px; margin: 0; padding-left: 18px;">
    <li><strong>Department in News:</strong> Women and Child Development Department, Govt of Odisha.</li>
    <li><strong>Key Scheme Portal:</strong> Direct Benefit Transfer (DBT) powered by NPCI Aadhaar Payment Bridge System (APBS).</li>
    <li><strong>Related Odisha Welfare Schemes:</strong> KALIA (Agriculture), BSUY (Health), Mamata Scheme (Maternity).</li>
  </ul>
</div>`,
    data_table_html: `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
  <thead>
    <tr style="background-color: #1e293b; color: #ffffff; text-align: left;">
      <th style="padding: 10px; border: 1px solid #cbd5e1;">Phase</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1;">Installment Amount</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1;">Beneficiaries Covered</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1;">Target Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Phase 1</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">₹5,000</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">25.1 Lakh Women</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">September 2024</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Phase 2</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">₹5,000</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">35.0 Lakh Women</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">March 2025</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Phase 3</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">₹5,000</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">25.5 Lakh Women</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">August 2026</td>
    </tr>
  </tbody>
</table>`,
    mcqs: [
      {
        question: "What is the total financial assistance provided to each eligible female beneficiary under Odisha's Subhadra Yojana over 5 years?",
        options: ["A) ₹25,000", "B) ₹35,000", "C) ₹50,000", "D) ₹60,000"],
        correct_answer: "C",
        explanation: "Eligible women receive ₹10,000 annually in two equal installments of ₹5,000 for 5 years, totaling ₹50,000."
      },
      {
        question: "Which age group of women is eligible to receive benefits under the Subhadra Scheme in Odisha?",
        options: ["A) 18 to 50 years", "B) 21 to 60 years", "C) 25 to 65 years", "D) 18 to 60 years"],
        correct_answer: "B",
        explanation: "Women aged between 21 and 60 years with valid Aadhaar-seeded bank accounts are eligible under Subhadra guidelines."
      }
    ],
    sources: "PIB Odisha / I&PR Department Odisha",
    image_url: "https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=1200",
    created_at: "2026-08-14T10:00:00Z"
  },
  {
    id: "ca-national-01",
    slug: "rbi-monetary-policy-committee-repo-rate-decision",
    title: "RBI Monetary Policy Committee Maintains Benchmark Repo Rate at 6.50%",
    category: "National",
    event_date: "2026-08-14",
    summary: "• RBI Governor announced MPC decision to keep the repo rate unchanged at 6.50% for the ninth consecutive meeting.\n• Real GDP growth forecast for FY27 projected at 7.2% with CPI inflation target projected at 4.5%.\n• Standing Deposit Facility (SDF) rate stands at 6.25% and Marginal Standing Facility (MSF) rate at 6.75%.",
    full_context: `<p>The Reserve Bank of India’s (RBI) Monetary Policy Committee (MPC) voted by a 5-1 majority to retain the key benchmark policy repo rate at <strong>6.50%</strong>. Consequently, the Standing Deposit Facility (SDF) rate remains at 6.25%, while the Marginal Standing Facility (MSF) rate and the Bank Rate stand at 6.75%.</p>

<p>RBI Governor emphasized that while disinflation is progressing smoothly towards the 4% target, persistent food inflation volatility warrants continued monetary vigilance. The MPC decided to remain focused on the <em>'withdrawal of accommodation'</em> stance to ensure inflation aligns with the target while supporting macroeconomic growth.</p>`,
    static_gk_pointers: `<div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #16a34a; padding: 18px; border-radius: 12px; margin: 20px 0;">
  <h4 style="color: #15803d; font-weight: 800; margin-bottom: 8px;">🎯 Static Banking & Economy Connection (SSC CGL / Railway / OSSC)</h4>
  <ul style="color: #166534; font-size: 14px; margin: 0; padding-left: 18px;">
    <li><strong>MPC Composition:</strong> 6 members (3 from RBI, 3 appointed by Central Govt). Statutory committee constituted under Section 45ZB of RBI Act, 1934.</li>
    <li><strong>Repo Rate:</strong> Rate at which RBI lends short-term liquidity to commercial banks against government securities.</li>
    <li><strong>Inflation Target Framework:</strong> 4% (+/- 2% tolerance band: 2% to 6%) under RBI Monetary Policy Framework Agreement.</li>
  </ul>
</div>`,
    data_table_html: `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
  <thead>
    <tr style="background-color: #0f172a; color: #ffffff;">
      <th style="padding: 10px; border: 1px solid #cbd5e1;">Policy Rate / Ratio</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1;">Current Rate (%)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Policy Repo Rate</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">6.50%</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Standing Deposit Facility (SDF)</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">6.25%</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Marginal Standing Facility (MSF)</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">6.75%</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Cash Reserve Ratio (CRR)</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">4.50%</td>
    </tr>
  </tbody>
</table>`,
    mcqs: [
      {
        question: "How many total members constitute the Reserve Bank of India Monetary Policy Committee (MPC)?",
        options: ["A) 4", "B) 5", "C) 6", "D) 8"],
        correct_answer: "C",
        explanation: "The MPC consists of 6 members: 3 from the Reserve Bank of India and 3 appointed by the Central Government of India."
      }
    ],
    sources: "Press Information Bureau (PIB) / RBI Release",
    image_url: "https://images.pexels.com/photos/5905712/pexels-photo-5905712.jpeg?auto=compress&cs=tinysrgb&w=1200",
    created_at: "2026-08-14T09:30:00Z"
  },
  {
    id: "ca-world-01",
    slug: "india-hosts-global-ai-summit-2026",
    title: "India Hosts 2026 Global AI Governance & Innovation Summit in New Delhi",
    category: "World",
    event_date: "2026-08-14",
    summary: "• Over 45 countries participated in the New Delhi Global AI Governance Summit to establish ethical AI guidelines.\n• Focus areas include global AI safety frameworks, open-source AI infrastructure, and cross-border digital public goods.\n• Declaration signed committing to equitable compute access for developing Global South economies.",
    full_context: `<p>India successfully inaugurated the 2026 <strong>Global AI Governance & Innovation Summit</strong> in New Delhi, hosting high-level ministerial delegations, AI research leaders, and international technology policy experts from over 45 nations.</p>

<p>The landmark <em>New Delhi Declaration on Responsible AI</em> unanimously adopted key principles regarding safety guardrails for frontier AI models, open-source technology sharing, and bridging the compute disparity between developed nations and the Global South.</p>`,
    static_gk_pointers: `<div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 4px solid #9333ea; padding: 18px; border-radius: 12px; margin: 20px 0;">
  <h4 style="color: #7e22ce; font-weight: 800; margin-bottom: 8px;">🎯 Static International Relations & Tech Connection (OPSC / SSC / Railway)</h4>
  <ul style="color: #6b21a8; font-size: 14px; margin: 0; padding-left: 18px;">
    <li><strong>GPAI Alliance:</strong> Global Partnership on Artificial Intelligence founded in 2020 with 29 member nations.</li>
    <li><strong>IndiaAI Mission:</strong> Approved by Union Cabinet with ₹10,372 crore budget to establish 10,000+ GPU supercomputing capacity.</li>
  </ul>
</div>`,
    data_table_html: ``,
    mcqs: [
      {
        question: "Which international declaration was adopted during the 2026 Global AI Governance Summit in New Delhi?",
        options: ["A) Bletchley Declaration", "B) New Delhi Declaration on Responsible AI", "C) Seoul Safety Agreement", "D) Paris Digital Charter"],
        correct_answer: "B",
        explanation: "Participating nations adopted the New Delhi Declaration on Responsible AI to promote equitable AI governance and Global South compute access."
      }
    ],
    sources: "Ministry of Electronics & IT (MeitY) / Diplomatic Dispatch",
    image_url: "https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1200",
    created_at: "2026-08-14T08:15:00Z"
  }
];

export async function fetchCurrentAffairsDigests(): Promise<CurrentAffairsItem[]> {
  try {
    const { data, error } = await supabase
      .from('current_affairs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn("ℹ️ Falling back to default Current Affairs digests dataset.");
      return FALLBACK_CURRENT_AFFAIRS;
    }

    return data as CurrentAffairsItem[];
  } catch (err) {
    console.error("Error fetching current affairs:", err);
    return FALLBACK_CURRENT_AFFAIRS;
  }
}
