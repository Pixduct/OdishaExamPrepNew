export interface SyllabusPreset {
  label: string;
  markdown: string;
}

export const SYLLABUS_PRESETS: Record<string, SyllabusPreset> = {
  'opsc-app-law': {
    label: 'OPSC APP (Assistant Public Prosecutor - Law & Evidence)',
    markdown: `### OPSC Assistant Public Prosecutor Examination Syllabus
- **Paper I: Criminal Law & Procedure**:
  - **Subject: Indian Penal Code (IPC)**:
    - Chapter: General Exceptions & Right of Private Defence
    - Chapter: Offences Against Human Body (Culpable Homicide & Murder)
    - Chapter: Offences Against Property (Theft, Extortion, Robbery & Dacoity)
    - Chapter: Offences Against Women (Dowry Death, Outraging Modesty, Rape)
    - Chapter: Criminal Conspiracy, Sedition & Defamation
  - **Subject: Code of Criminal Procedure (CrPC)**:
    - Chapter: Constitution & Jurisdiction of Criminal Courts
    - Chapter: Arrest of Persons & Statutory Rights of Accused
    - Chapter: Information to Police & Police Investigation Powers (FIR, Section 161, 164)
    - Chapter: Maintenance of Public Order & Tranquility (Section 144)
    - Chapter: Bail & Bonds Provisions (Regular Bail, Section 438 Anticipatory Bail)
    - Chapter: Framing of Charges & Trial Before Court of Session & Magistrates
    - Chapter: Appeals, Reference & Revision Powers of High Court
- **Paper II: Evidence & Special Criminal Statutes**:
  - **Subject: Indian Evidence Act**:
    - Chapter: Relevancy of Facts, Res Gestae & Facts Constituting Motive
    - Chapter: Admissions, Confessions & Section 27 Discovery of Fact
    - Chapter: Dying Declarations & Statements of Persons Who Cannot Be Called
    - Chapter: Opinion of Third Persons & Scientific Forensic Expert Evidence
    - Chapter: Burden of Proof, Estoppel & Statutory Presumptions
    - Chapter: Examination of Witnesses (Chief, Cross, Leading Questions, Section 145)
  - **Subject: Special & Local Laws of Odisha**:
    - Chapter: POCSO Act (Mandatory Reporting, Aggravated Offences, Special Courts)
    - Chapter: NDPS Act (Search, Seizure, Commercial Quantity, Section 37 Bail)
    - Chapter: SC and ST (Prevention of Atrocities) Act
    - Chapter: Odisha Special Courts Act & Anti-Corruption Statutes`
  },
  'opsc-cgl-prelims': {
    label: 'OPSC OAS / CGL (General Studies & Quantitative)',
    markdown: `### OPSC OAS / CGL Examination Syllabus & Standard
- **Level of Difficulty**: Advanced & Analytical (Graduate Standard). Multi-step reasoning required.
- **Section 1: Quantitative Aptitude & Arithmetic**:
  - Number Systems, HCF/LCM, Quadratic Equations, Percentage, Profit & Loss, Simple & Compound Interest.
  - Time & Work, Pipes & Cisterns, Speed Time & Distance, Boats & Streams.
  - Permutations & Combinations, Probability, Set Theory & Venn Diagrams.
  - Mensuration 2D & 3D (Triangles, Polygons, Cylinders, Cones, Spheres).
- **Section 2: Data Interpretation & Logical Reasoning**:
  - Tabular DI, Pie Charts, Bar Graphs, Caselets.
  - Syllogisms, Statement-Assumption, Statement-Conclusion, Seating Arrangement (Linear & Circular), Direction Sense, Blood Relations.
- **Section 3: General Studies & Odisha GK**:
  - Indian Polity & Constitution (Articles, Amendments, Panchayati Raj, Fundamental Rights).
  - Modern Indian History & Odisha Freedom Struggle (Paika Rebellion, Utkal Sammilani).
  - Geography of Odisha (Rivers, Minerals, Forests, Wildlife Sanctuaries, District boundaries).
  - Economy & Government Schemes (Kalia, BSKY, 5T Initiatives, Budget Trends).
- **PYQ Pattern Hints**:
  - Focus on multi-statement statements ("Consider the following statements... Which is/are correct?").
  - Provide complete step-by-step mathematical proofs with LaTeX formulas ($...$).`
  },
  'osssc-ri-amin': {
    label: 'OSSSC RI / AMIN / ICDS / PEO (Standard Pattern)',
    markdown: `### OSSSC RI / AMIN Combined Recruitment Syllabus
- **Level of Difficulty**: Moderate to Advanced (Higher Secondary / Matric Standard).
- **Section 1: Arithmetic & Mensuration**:
  - Ratio & Proportion, Partnership, Averages, Mixture & Alligation.
  - Geometry (Angles, Triangles, Quadrilaterals, Coordinate Geometry).
  - Practical Surveying Math: Area calculation of irregular land plots, polygons.
- **Section 2: General Knowledge & Odisha Special**:
  - Odisha History (Kalinga War, Ganga Dynasty, Gajapati Empire, Temple Architecture).
  - Odisha Geography & Climate, Mahanadi River System, Chilika Lake, Similipal.
  - Current Affairs & Odisha Awards/Personalities.
- **Section 3: English & Odia Language**:
  - Error Detection, Idioms & Phrases, Prepositions, Voice & Narration.
  - Odia Grammar (Sandhi, Samasa, Krudanta, Taddhita, Rudhi & Lokabani).`
  },
  'odisha-police-si': {
    label: 'Odisha Police Sub-Inspector (SI & Constable)',
    markdown: `### Odisha Police SI Examination Guidelines
- **Level of Difficulty**: Advanced Reasoning & State Law/Aptitude.
- **General Studies**: Indian Constitution, Criminal Law basics, Human Rights, Science & Technology.
- **Logical Reasoning**: Coding-Decoding, Number Series, Critical Thinking, Venn Diagrams, Clocks & Calendars.
- **Quantitative Aptitude**: High speed calculation, Profit & Loss, Time-Speed, Geometry formulas.
- **Odisha Heritage**: Festivals, Folk Dances (Chhau, Sambalpuri), Monuments, Tribal Culture.`
  },
  'osssc-nursing-officer': {
    label: 'OSSSC Nursing Officer, ANM & Pharmacist',
    markdown: `### OSSSC Nursing Officer & Medical Personnel Syllabus
- **Level of Difficulty**: Professional Diploma / B.Sc Nursing & Clinical Standard.
- **Section 1: Core Clinical Nursing**:
  - Anatomy & Physiology (Cardiovascular, Respiratory, Renal, Endocrine & Nervous Systems).
  - Medical-Surgical Nursing (Pre/Post-Operative Care, Oncology, Emergency & Triage).
  - Pharmacology (Dosages, Drug classifications, Contraindications, Adverse reactions, Antibiotics).
  - Community Health Nursing & Immunization Schedules (National Health Missions, Maternal & Child Health).
  - Pediatric & Obstetric/Gynecological Nursing (Antenatal care, Labor stages, Neonatal resuscitation).
- **Section 2: Professional Ethics, Nursing Administration & Patient Safety**:
  - Infection Control Protocols, Biomedical Waste Management (BMW rules).`
  }
};
