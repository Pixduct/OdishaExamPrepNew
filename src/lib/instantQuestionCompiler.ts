export interface CompiledQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

/** Pre-compiled high-yield questions for instant drill launching (<10ms latency) */
const INSTANT_TOPIC_QUESTIONS: Record<string, CompiledQuestion[]> = {
  'Fundamentals of Nursing': [
    {
      id: 'fn-1',
      questionText: 'What is the normal physiological range for adult blood pressure according to standard clinical guidelines?',
      options: ['140/90 mmHg', '120/80 mmHg', '90/60 mmHg', '150/95 mmHg'],
      correctAnswerIndex: 1,
      explanation: 'Normal blood pressure for a healthy adult is defined as systolic < 120 mmHg and diastolic < 80 mmHg.'
    },
    {
      id: 'fn-2',
      questionText: 'Which position is recommended for administering an enema to an adult patient?',
      options: ['Fowler position', 'Left Sims position', 'Trendelenburg position', 'Prone position'],
      correctAnswerIndex: 1,
      explanation: 'Left Sims position facilitates fluid flow by gravity into the sigmoid colon along anatomical curves.'
    },
    {
      id: 'fn-3',
      questionText: 'What is the primary purpose of performing surgical hand scrubbing before a sterile procedure?',
      options: ['To sterilize the skin completely', 'To reduce resident flora and eliminate transient microorganisms', 'To moisturize hands', 'To substitute for sterile gloves'],
      correctAnswerIndex: 1,
      explanation: 'Surgical hand scrubbing significantly reduces transient and resident microbial counts on skin surfaces.'
    },
    {
      id: 'fn-4',
      questionText: 'Which needle gauge is standard for intramuscular (IM) injections in adult gluteal muscles?',
      options: ['27 to 30 Gauge', '21 to 23 Gauge', '14 to 16 Gauge', '31 Gauge'],
      correctAnswerIndex: 1,
      explanation: '21 to 23 gauge needles (1 to 1.5 inches) are appropriate for deep intramuscular injections in adults.'
    },
    {
      id: 'fn-5',
      questionText: 'What is the recommended rate of chest compressions during adult Cardiopulmonary Resuscitation (CPR)?',
      options: ['60-80 compressions/min', '100-120 compressions/min', '140-160 compressions/min', '40-60 compressions/min'],
      correctAnswerIndex: 1,
      explanation: 'AHA guidelines mandate a compression rate of 100 to 120 compressions per minute for high-quality CPR.'
    },
    {
      id: 'fn-6',
      questionText: 'Which pulse site is routinely used to assess circulation in lower extremities?',
      options: ['Carotid pulse', 'Dorsalis pedis pulse', 'Temporal pulse', 'Brachial pulse'],
      correctAnswerIndex: 1,
      explanation: 'Dorsalis pedis and posterior tibial pulses assess distal arterial perfusion in lower limbs.'
    },
    {
      id: 'fn-7',
      questionText: 'What is the primary indicator of adequate fluid resuscitation in a patient receiving IV fluid therapy?',
      options: ['Urine output of 0.5 to 1.0 mL/kg/hour', 'Increased heart rate', 'Weight loss', 'Dry mucous membranes'],
      correctAnswerIndex: 0,
      explanation: 'Urine output >= 0.5 mL/kg/hr is the most reliable clinical indicator of renal tissue perfusion.'
    },
    {
      id: 'fn-8',
      questionText: 'Which stage of pressure injury involves full-thickness skin loss with exposed subcutaneous fat but no exposed bone or muscle?',
      options: ['Stage I', 'Stage II', 'Stage III', 'Stage IV'],
      correctAnswerIndex: 2,
      explanation: 'Stage III pressure injury involves full-thickness tissue loss with subcutaneous fat visible.'
    },
    {
      id: 'fn-9',
      questionText: 'What is the proper technique for opening a sterile package on a bedside table?',
      options: ['Open the closest flap first', 'Open the top flap away from the body first', 'Open left flap first', 'Touch inside of package'],
      correctAnswerIndex: 1,
      explanation: 'Opening the outermost flap away from the body prevents unsterile arm movements over sterile fields.'
    },
    {
      id: 'fn-10',
      questionText: 'Which electrolyte imbalance is characterized by a positive Chvostek sign and carpopedal spasms?',
      options: ['Hyperkalemia', 'Hypocalcemia', 'Hypernatremia', 'Hypomagnesemia'],
      correctAnswerIndex: 1,
      explanation: 'Hypocalcemia increases neuromuscular excitability causing positive Chvostek and Trousseau signs.'
    },
    {
      id: 'fn-11',
      questionText: 'When administering parenteral medication via the Z-track method, what is the primary objective?',
      options: ['To speed up drug absorption', 'To prevent leakage of irritating drug into subcutaneous tissue', 'To reduce injection pain', 'To inject into intravenous vessel'],
      correctAnswerIndex: 1,
      explanation: 'The Z-track method seals medication deep in muscle tissue and prevents cutaneous staining or irritation.'
    },
    {
      id: 'fn-12',
      questionText: 'Which nursing intervention prevents atelectasis in post-operative surgical patients?',
      options: ['Encouraging use of incentive spirometry and deep breathing exercises', 'Strict bed rest', 'Restricting oral fluids', 'Administering sedatives'],
      correctAnswerIndex: 0,
      explanation: 'Incentive spirometry expands alveoli and mobilizes secretions, preventing alveolar collapse (atelectasis).'
    },
    {
      id: 'fn-13',
      questionText: 'What is the normal blood pH range for arterial blood gas (ABG) analysis?',
      options: ['7.15 - 7.25', '7.35 - 7.45', '7.50 - 7.60', '6.80 - 7.00'],
      correctAnswerIndex: 1,
      explanation: 'Normal arterial blood pH ranges strictly between 7.35 and 7.45.'
    },
    {
      id: 'fn-14',
      questionText: 'Which route of drug administration provides 100% systemic bioavailability immediately?',
      options: ['Oral route', 'Intravenous (IV) route', 'Subcutaneous route', 'Intramuscular route'],
      correctAnswerIndex: 1,
      explanation: 'Intravenous administration introduces drugs directly into venous circulation with 100% bioavailability.'
    },
    {
      id: 'fn-15',
      questionText: 'What is the primary action when a nurse notices IV site phlebitis (redness, warmth, vein cord)?',
      options: ['Slow down IV flow rate', 'Stop IV infusion immediately and remove cannula', 'Apply ice pack', 'Flush cannula with saline'],
      correctAnswerIndex: 1,
      explanation: 'Signs of phlebitis require immediate cessation of infusion and cannula removal to prevent embolus.'
    }
  ],

  'Community Health Nursing': [
    {
      id: 'chn-1',
      questionText: 'What is the primary objective of the Sub-Centre in the rural healthcare delivery system in India?',
      options: [
        'Providing tertiary specialized surgical care',
        'Providing primary healthcare services at the village/community level',
        'Conducting advanced medical research',
        'Managing district-level referral hospitals'
      ],
      correctAnswerIndex: 1,
      explanation: 'Sub-centres are the most peripheral contact point between the primary healthcare system and the community.'
    },
    {
      id: 'chn-2',
      questionText: 'According to Indian Public Health Standards (IPHS), one Primary Health Centre (PHC) in plain areas covers a population of:',
      options: [
        '5,000 population',
        '10,000 population',
        '30,000 population',
        '100,000 population'
      ],
      correctAnswerIndex: 2,
      explanation: 'In plain areas, a Primary Health Centre covers 30,000 population, whereas in hilly/tribal areas it covers 20,000 population.'
    },
    {
      id: 'chn-3',
      questionText: 'Which of the following vaccines is given at birth under the Universal Immunization Program (UIP) in India?',
      options: [
        'BCG, OPV-0, and Hepatitis B-0',
        'Measles and Rubella',
        'DPT and TT Booster',
        'Rotavirus and PCV'
      ],
      correctAnswerIndex: 0,
      explanation: 'At birth, BCG, Zero dose OPV, and birth dose Hepatitis B are administered.'
    },
    {
      id: 'chn-4',
      questionText: 'What is the ideal cold chain storage temperature for oral polio vaccine (OPV)?',
      options: [
        '2°C to 8°C',
        '-20°C to -15°C',
        '15°C to 25°C',
        '0°C to 4°C'
      ],
      correctAnswerIndex: 1,
      explanation: 'OPV is heat-sensitive and stored in deep freezers at -20°C to -15°C for long term preservation.'
    },
    {
      id: 'chn-5',
      questionText: 'Under Janani Suraksha Yojana (JSY), what is the primary incentive provided to pregnant women?',
      options: [
        'Free higher education for the child',
        'Cash assistance to promote institutional delivery',
        'Free housing subsidies',
        'Job reservation in government offices'
      ],
      correctAnswerIndex: 1,
      explanation: 'JSY is a safe motherhood intervention under NRHM promoting institutional delivery among poor pregnant women through direct cash transfers.'
    },
    {
      id: 'chn-6',
      questionText: 'What is the vector responsible for transmitting Dengue fever?',
      options: ['Anopheles mosquito', 'Aedes aegypti mosquito', 'Culex mosquito', 'Mansonia mosquito'],
      correctAnswerIndex: 1,
      explanation: 'Aedes aegypti (daytime biter) transmits Dengue virus, Chikungunya, and Zika.'
    },
    {
      id: 'chn-7',
      questionText: 'Which indicator measures overall maternal mortality per 100,000 live births in a population?',
      options: ['Infant Mortality Rate (IMR)', 'Maternal Mortality Ratio (MMR)', 'Crude Birth Rate (CBR)', 'Total Fertility Rate (TFR)'],
      correctAnswerIndex: 1,
      explanation: 'Maternal Mortality Ratio (MMR) expresses maternal deaths per 100,000 live births.'
    },
    {
      id: 'chn-8',
      questionText: 'Which food fortification initiative in India adds Iodine and Iron to common table salt?',
      options: ['Double Fortified Salt (DFS)', 'Vitamin A Sugar', 'Zinc Wheat', 'Calcium Flour'],
      correctAnswerIndex: 0,
      explanation: 'Double Fortified Salt (DFS) delivers both Iodine and Iron to combat anemia and goiter.'
    },
    {
      id: 'chn-9',
      questionText: 'What is the primary role of an ASHA worker in a rural village under NRHM?',
      options: ['Performing major surgeries', 'Health activism, community mobilization, and maternal care support', 'Running pharmacy store', 'Formulating national health budget'],
      correctAnswerIndex: 1,
      explanation: 'Accredited Social Health Activist (ASHA) acts as a bridge between community and healthcare facilities.'
    },
    {
      id: 'chn-10',
      questionText: 'Which water purification method is effective at killing waterborne pathogens at household levels?',
      options: ['Boiling water for at least 10-15 minutes', 'Simple cloth filtration', 'Sedimentation alone', 'Cooling in earthen pots'],
      correctAnswerIndex: 0,
      explanation: 'Rolling boiling for 10-15 minutes kills all vegetative bacteria, viruses, and cysts.'
    },
    {
      id: 'chn-11',
      questionText: 'What is the target target ratio for Mid-Day Meal Scheme (PM POSHAN) in primary schools?',
      options: ['Providing 450 calories and 12g protein daily', '100 calories daily', '2000 calories daily', '50 calories daily'],
      correctAnswerIndex: 0,
      explanation: 'PM POSHAN provides 450 calories and 12 grams of protein per primary school child daily.'
    },
    {
      id: 'chn-12',
      questionText: 'Which disease is targeted for elimination under the National Vector Borne Disease Control Programme (NVBDCP)?',
      options: ['Lymphatic Filariasis & Kala-azar', 'Tuberculosis', 'Diabetes Mellitus', 'Hypertension'],
      correctAnswerIndex: 0,
      explanation: 'NVBDCP targets Malaria, Dengue, Chikungunya, Japanese Encephalitis, Kala-azar, and Filariasis.'
    },
    {
      id: 'chn-13',
      questionText: 'What is the recommended interval between two doses of Tetanus Toxoid (TT) for a pregnant woman?',
      options: ['At least 4 weeks apart', '1 day apart', '6 months apart', '1 year apart'],
      correctAnswerIndex: 0,
      explanation: 'The second TT dose is administered at least 4 weeks after the first dose during pregnancy.'
    },
    {
      id: 'chn-14',
      questionText: 'Which epidemiological triad component represents the environmental conditions favoring pathogen survival?',
      options: ['Agent', 'Host', 'Environment', 'Vector'],
      correctAnswerIndex: 2,
      explanation: 'The Epidemiological Triad comprises Agent, Host, and Environment.'
    },
    {
      id: 'chn-15',
      questionText: 'What is the color of the bio-medical waste bin designated for contaminated recyclable plastic waste (gloves, IV tubes)?',
      options: ['Yellow bin', 'Red bin', 'Blue bin', 'Black bin'],
      correctAnswerIndex: 1,
      explanation: 'Red bins receive contaminated recyclable plastic items like gloves, IV bottles, tubing, and catheters.'
    }
  ],

  'Medical Surgical Nursing': [
    {
      id: 'msn-1',
      questionText: 'A patient undergoing post-thyroidectomy exhibits positive Chvostek and Trousseau signs. What acute complication does the nurse suspect?',
      options: [
        'Hyperkalemia',
        'Hypocalcemia due to accidental parathyroid gland removal',
        'Thyrotoxic crisis',
        'Laryngeal nerve damage'
      ],
      correctAnswerIndex: 1,
      explanation: 'Accidental trauma/removal of parathyroid glands during thyroidectomy causes acute hypocalcemia leading to tetany (Chvostek & Trousseau signs).'
    },
    {
      id: 'msn-2',
      questionText: 'In Parkland formula for fluid resuscitation in 2nd/3rd degree burn management, what fluid volume is administered in the first 8 hours?',
      options: [
        '100% of total calculated fluid volume',
        '50% of total calculated fluid volume',
        '25% of total calculated fluid volume',
        '75% of total calculated fluid volume'
      ],
      correctAnswerIndex: 1,
      explanation: 'Parkland Formula: 4 mL x kg body weight x % TBSA burn. 50% given in first 8 hours, remaining 50% given over next 16 hours.'
    },
    {
      id: 'msn-3',
      questionText: 'What is the initial priority nursing intervention for a patient experiencing acute chest pain radiating to the left jaw (suspected MI)?',
      options: [
        'Administer supplemental Oxygen, Morphine, Nitroglycerin, and Aspirin (MONA protocol)',
        'Send patient for immediate brain CT scan',
        'Encourage deep breathing exercises',
        'Place patient in Trendelenburg position'
      ],
      correctAnswerIndex: 0,
      explanation: 'MONA protocol (Morphine, Oxygen, Nitroglycerin, Aspirin) is the standard urgent management for acute coronary syndrome.'
    },
    {
      id: 'msn-4',
      questionText: 'Which clinical finding is considered a late sign of increased intracranial pressure (ICP)?',
      options: [
        'Restlessness and irritability',
        'Cushing\'s Triad (Bradycardia, Systolic Hypertension with widening pulse pressure, Irregular respiration)',
        'Slight headache',
        'Mild nausea'
      ],
      correctAnswerIndex: 1,
      explanation: 'Cushing\'s Triad indicates brainstem compression and is a critical late sign of elevated ICP.'
    },
    {
      id: 'msn-5',
      questionText: 'Which ECG alteration is characteristic of severe hyperkalemia?',
      options: ['Tall peaked T waves and widened QRS complexes', 'ST segment elevation', 'Inverted P waves', 'U waves'],
      correctAnswerIndex: 0,
      explanation: 'Hyperkalemia (> 5.5 mEq/L) typically manifests as tall, narrow, peaked T waves and QRS widening.'
    },
    {
      id: 'msn-6',
      questionText: 'What position should a patient be placed in following a lumbar puncture to prevent spinal headache?',
      options: ['Flat supine position for 4 to 8 hours', 'High Fowler position', 'Prone position', 'Side-lying knee chest position'],
      correctAnswerIndex: 0,
      explanation: 'Maintaining flat supine posture decreases CSF leakage rate through the dural puncture site.'
    },
    {
      id: 'msn-7',
      questionText: 'Which lab value is most specific for diagnosing acute myocardial infarction (MI)?',
      options: ['Troponin I and Troponin T', 'Serum amylase', 'BUN', 'Platelet count'],
      correctAnswerIndex: 0,
      explanation: 'Cardiac Troponin I and T are highly sensitive and specific biomarkers for cardiac muscle necrosis.'
    },
    {
      id: 'msn-8',
      questionText: 'What is the primary medication administered to reverse severe hypoglycemia in an unconscious diabetic patient without IV access?',
      options: ['Subcutaneous or IM Glucagon (1 mg)', 'Oral glucose gel', 'Regular insulin', 'Metformin'],
      correctAnswerIndex: 0,
      explanation: 'IM/SC Glucagon mobilizes hepatic glycogen stores to elevate blood glucose when oral intake is impossible.'
    },
    {
      id: 'msn-9',
      questionText: 'Which breath sound is heard over narrowed airways during an acute asthmatic attack?',
      options: ['High-pitched continuous wheezing', 'Coarse crackles', 'Pleural friction rub', 'Stridor'],
      correctAnswerIndex: 0,
      explanation: 'Wheezing results from bronchospasm and turbulent airflow through constricted lower airways.'
    },
    {
      id: 'msn-10',
      questionText: 'What is the primary sign of acute tension pneumothorax requiring emergency needle thoracostomy?',
      options: ['Tracheal deviation to contralateral side and absent breath sounds', 'Bradycardia', 'Fever', 'Productive cough'],
      correctAnswerIndex: 0,
      explanation: 'Tension pneumothorax shifts mediastinal structures away from the affected hemithorax, causing tracheal displacement.'
    },
    {
      id: 'msn-11',
      questionText: 'Which diet is recommended for a patient diagnosed with chronic kidney disease (CKD) on conservative management?',
      options: ['Low protein, low sodium, low potassium diet', 'High protein diet', 'High sodium diet', 'High potassium diet'],
      correctAnswerIndex: 0,
      explanation: 'Restricting protein, sodium, and potassium reduces nitrogenous waste buildup and electrolyte toxicities.'
    },
    {
      id: 'msn-12',
      questionText: 'Which medication is antidote for Heparin toxicity?',
      options: ['Protamine Sulfate', 'Vitamin K', 'Naloxone', 'Flumazenil'],
      correctAnswerIndex: 0,
      explanation: 'Protamine sulfate neutralizes heparin anticoagulation through ionic binding.'
    },
    {
      id: 'msn-13',
      questionText: 'Which clinical feature is characteristic of Graves disease (hyperthyroidism)?',
      options: ['Exophthalmos (bulging eyes), heat intolerance, and tachycardia', 'Weight gain and cold intolerance', 'Constipation', 'Lethargy'],
      correctAnswerIndex: 0,
      explanation: 'Graves disease hypermetabolism causes tachycardia, weight loss, heat intolerance, and exophthalmos.'
    },
    {
      id: 'msn-14',
      questionText: 'What is the primary cause of hypovolemic shock in acute severe pancreatitis?',
      options: ['Massive third-spacing of fluid into peritoneal cavity', 'Severe external blood loss', 'Allergic reaction', 'Heart failure'],
      correctAnswerIndex: 0,
      explanation: 'Pancreatic enzyme retroperitoneal destruction leads to extensive capillary leak and third-space fluid sequestration.'
    },
    {
      id: 'msn-15',
      questionText: 'Which diagnostic test is definitive for diagnosing Pulmonary Embolism (PE)?',
      options: ['CT Pulmonary Angiography (CTPA)', 'Chest X-ray', 'ECG', 'Sputum culture'],
      correctAnswerIndex: 0,
      explanation: 'CTPA visualizes intraluminal pulmonary arterial thrombi with high sensitivity and specificity.'
    }
  ],

  'General Studies & Odisha GK': [
    {
      id: 'ogk-1',
      questionText: 'Who was the first Chief Minister of Odisha after Indian Independence?',
      options: ['Harekrushna Mahatab', 'Biju Patnaik', 'Nabakrushna Choudhury', 'Gopabandhu Das'],
      correctAnswerIndex: 0,
      explanation: 'Dr. Harekrushna Mahatab served as the first Chief Minister of independent Odisha from 1946 to 1950 and again from 1956 to 1961.'
    },
    {
      id: 'ogk-2',
      questionText: 'The famous Sun Temple at Konark was built during the reign of which Ganga dynasty ruler?',
      options: ['Anantavarman Chodaganga', 'Narasimhadeva I', 'Kapilendradeva', 'Purushottamadeva'],
      correctAnswerIndex: 1,
      explanation: 'The Konark Sun Temple was constructed in the 13th century (circa 1250 CE) by King Narasimhadeva I of the Eastern Ganga Dynasty.'
    },
    {
      id: 'ogk-3',
      questionText: 'Hirakud Dam, one of the longest earthen dams in the world, is built across which river?',
      options: ['Brahmani River', 'Baitarani River', 'Mahanadi River', 'Subarnarekha River'],
      correctAnswerIndex: 2,
      explanation: 'Hirakud Dam is built across the Mahanadi River near Sambalpur in Odisha and began operations in 1957.'
    },
    {
      id: 'ogk-4',
      questionText: 'Which wetland in Odisha is designated as the first Ramsar site in India?',
      options: ['Chilika Lake', 'Ansupa Lake', 'Tampara Lake', 'Kanjia Lake'],
      correctAnswerIndex: 0,
      explanation: 'Chilika Lake was designated as the first Indian wetland of international importance under the Ramsar Convention in 1981.'
    },
    {
      id: 'ogk-5',
      questionText: 'In which year did the historic Paika Rebellion (Paika Bidroha) against British colonial rule take place in Odisha?',
      options: ['1804', '1817', '1857', '1866'],
      correctAnswerIndex: 1,
      explanation: 'The Paika Rebellion of 1817, led by Bakshi Jagabandhu Bidyadhar in Khordha, was a major armed uprising against British rule in Odisha.'
    },
    {
      id: 'ogk-6',
      questionText: 'Which national park in Odisha is renowned worldwide for the mass nesting of Olive Ridley sea turtles (Arribada)?',
      options: ['Similipal National Park', 'Bhitarkanika National Park (Gahirmatha)', 'Karlapat Wildlife Sanctuary', 'Debrigarh Sanctuary'],
      correctAnswerIndex: 1,
      explanation: 'Gahirmatha Marine Sanctuary adjacent to Bhitarkanika National Park is the world\'s largest nesting beach for Olive Ridley turtles.'
    },
    {
      id: 'ogk-7',
      questionText: 'The capital of Odisha was officially shifted from Cuttack to Bhubaneswar in which year?',
      options: ['1936', '1947', '1949', '1956'],
      correctAnswerIndex: 2,
      explanation: 'Odisha\'s capital was officially shifted from the historic city of Cuttack to the newly planned city of Bhubaneswar on 19 August 1949.'
    },
    {
      id: 'ogk-8',
      questionText: 'Which article of the Indian Constitution guarantees the Right to Constitutional Remedies?',
      options: ['Article 19', 'Article 21', 'Article 32', 'Article 44'],
      correctAnswerIndex: 2,
      explanation: 'Article 32 provides the Right to Constitutional Remedies, famously described by Dr. B.R. Ambedkar as the "Heart and Soul of the Constitution".'
    },
    {
      id: 'ogk-9',
      questionText: 'Which mountain peak is the highest point in the state of Odisha?',
      options: ['Mahendragiri', 'Deomali', 'Malayagiri', 'Gandhamardan'],
      correctAnswerIndex: 1,
      explanation: 'Deomali Peak in the Koraput district is the highest mountain peak in Odisha, standing at an elevation of 1,672 meters.'
    },
    {
      id: 'ogk-10',
      questionText: 'Who founded the weekly newspaper "The Samaja" in Odisha in 1919?',
      options: ['Utkalmani Gopabandhu Das', 'Gourishankar Ray', 'Madhusudan Das', 'Fakir Mohan Senapati'],
      correctAnswerIndex: 0,
      explanation: 'Utkalmani Pandit Gopabandhu Das founded "The Samaja" at Satyabadi in Puri district on 4 October 1919.'
    }
  ],

  'Quantitative Aptitude': [
    {
      id: 'qa-1',
      questionText: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
      options: ['65 seconds', '89 seconds', '100 seconds', '75 seconds'],
      correctAnswerIndex: 1,
      explanation: 'Speed = 240/24 = 10 m/s. Total distance for platform = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds.'
    },
    {
      id: 'qa-2',
      questionText: 'If the selling price of 12 articles is equal to the cost price of 15 articles, find the profit percentage.',
      options: ['20%', '25%', '30%', '15%'],
      correctAnswerIndex: 1,
      explanation: 'Profit = (15 - 12) / 12 * 100 = 3/12 * 100 = 25% profit.'
    },
    {
      id: 'qa-3',
      questionText: 'A and B can do a work in 12 days and 18 days respectively. In how many days can they complete the work together?',
      options: ['7.2 days', '6.5 days', '8 days', '10 days'],
      correctAnswerIndex: 0,
      explanation: '1/12 + 1/18 = (3 + 2)/36 = 5/36. Combined time = 36/5 = 7.2 days.'
    },
    {
      id: 'qa-4',
      questionText: 'Find the compound interest on ₹10,000 at 10% per annum for 2 years compounded annually.',
      options: ['₹2,000', '₹2,100', '₹2,200', '₹1,900'],
      correctAnswerIndex: 1,
      explanation: 'Amount = 10,000 * (1 + 10/100)^2 = 10,000 * 1.21 = ₹12,100. CI = ₹12,100 - ₹10,000 = ₹2,100.'
    },
    {
      id: 'qa-5',
      questionText: 'The average of 5 consecutive odd numbers is 27. What is the product of the first and fifth numbers?',
      options: ['705', '713', '675', '725'],
      correctAnswerIndex: 1,
      explanation: 'The 5 numbers centered at 27 are: 23, 25, 27, 29, 31. Product of 1st and 5th = 23 * 31 = 713.'
    }
  ],

  'Reasoning & Mental Ability': [
    {
      id: 'rs-1',
      questionText: 'In a certain code, TEACHER is written as VGCEJGT. How is CHILDREN written in that code?',
      options: ['EJKNFTGP', 'EJKNFITP', 'EJKNFGTO', 'EJKNFTPO'],
      correctAnswerIndex: 0,
      explanation: 'Each letter is shifted forward by +2 positions in alphabetical order: C+2=E, H+2=J, I+2=K, L+2=N, D+2=F, R+2=T, E+2=G, N+2=P.'
    },
    {
      id: 'rs-2',
      questionText: 'Find the next number in the series: 4, 9, 19, 39, 79, ?',
      options: ['119', '139', '159', '149'],
      correctAnswerIndex: 2,
      explanation: 'Pattern: (previous * 2) + 1. 79 * 2 + 1 = 158 + 1 = 159.'
    },
    {
      id: 'rs-3',
      questionText: 'Pointing to a photograph, a woman says: "He is the only son of the wife of my brother\'s father." How is the person in the photograph related to the woman?',
      options: ['Father', 'Brother', 'Uncle', 'Cousin'],
      correctAnswerIndex: 1,
      explanation: 'Brother\'s father = woman\'s father. Wife of father = woman\'s mother. Only son of mother = woman\'s brother.'
    }
  ]
};

/** Get instant compiled questions matching topic & requested question count (<10ms response) */
export const getInstantQuestionsForTopic = (topicName: string, targetCount: number = 15): CompiledQuestion[] => {
  let matchedQuestions: CompiledQuestion[] = [];

  if (topicName) {
    for (const [key, questions] of Object.entries(INSTANT_TOPIC_QUESTIONS)) {
      if (topicName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(topicName.toLowerCase())) {
        matchedQuestions = questions;
        break;
      }
    }
  }

  // Fallback to General Studies & Odisha GK instead of medical nursing
  if (matchedQuestions.length === 0) {
    matchedQuestions = INSTANT_TOPIC_QUESTIONS['General Studies & Odisha GK'] || INSTANT_TOPIC_QUESTIONS['Fundamentals of Nursing'];
  }

  // Ensure EXACT targetCount questions are returned without clipping or shortage
  const result: CompiledQuestion[] = [];
  const pool = matchedQuestions;

  for (let i = 0; i < targetCount; i++) {
    const base = pool[i % pool.length];
    result.push({
      id: `${base.id}-${i + 1}`,
      questionText: base.questionText,
      options: base.options,
      correctAnswerIndex: base.correctAnswerIndex,
      explanation: base.explanation
    });
  }

  return result;
};
