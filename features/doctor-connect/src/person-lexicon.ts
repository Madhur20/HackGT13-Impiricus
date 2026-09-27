// Word lists for the Doctor Connect person-reference detector. Every list is lowercase.
// These are review aids, not a de-identification guarantee: see docs/doctor-connect-input-pipeline.md.

const words = (list: string) => new Set(list.trim().split(/\s+/));

/** Given names and surnames that are rarely ordinary English or clinical words. Flagged in any position or case. */
export const PERSON_NAMES = words(`
  aaron abby abdul abigail adam adeline adrian ahmed aisha alan albert alejandro alex alexa alexander alexandra alexis alfred ali alice alicia alina alison allison alyssa amanda amelia amir amit amy ana andre andrea andres andrew andy angela angelica anil anita ann anna anne annie anthony antonio anya arjun arnold arthur arun ashley audrey ava barbara beatrice ben benjamin bernard beth betty beverly bianca bob bobby bonnie brandon brenda brian brittany bruce bryan caleb camila carl carla carlos carmen carol caroline carolyn catherine cathy chad charles charlie charlotte chen cheryl chloe christina christine christopher cindy claire clara claudia colin connor craig cristina crystal cynthia daisy dale dan dana daniel daniela danielle darius darren dave david debbie deborah debra deepak denise dennis derek devon diana diane diego dmitri dolores donald donna doris dorothy douglas dylan eddie edgar edith edward eileen elaine eleanor elena eli elijah elizabeth ella ellen elliot emily emma eric erica erik erin esther ethan eugene evan evelyn fatima felicia felix fernando fiona francesca francis francisco fred freddie gabriel gabriela gary geoffrey george gerald geraldine gloria gordon greg gregory hannah harold harry hassan heather hector heidi helen henry hiroshi howard hugo ian igor imran irene isaac isabel isabella isaiah ivan jack jackie jacob jacqueline jake james jamal jamie janet janice jared jasmine jason javier jeff jeffrey jennifer jenny jeremy jerry jesse jessica jesus jill jim jimmy joan joanna joe joel john johnny jon jonathan jorge jose joseph josephine josh joshua joyce juan judith judy julia julian julie justin kamala karen karl kate katherine kathleen kathryn kathy katie kayla keith kelly ken kenneth kevin kim kimberly kristen kyle lakshmi larry laura lauren leah leo leon leonard leslie liam lillian linda lindsay lisa lois lorraine louis louise lucas lucy luis luke lydia lynn madeline madison mahmoud manuel marcus margaret maria mariana marie marilyn mario marisol marjorie martha martin marvin mary matthew maureen maya megan melanie melissa mia michael michelle miguel mike mildred mohammed monica muhammad nadia nancy naomi natalie nathan neha neil nicholas nicole nikhil nina noah noel norma olga oliver olivia omar oscar pablo pamela patricia patrick paula pauline pedro peggy peter philip phyllis pooja priya priyanka rachel rafael rahul raj rajesh ralph ramon randy raul rebecca reggie renee ricardo richard rick rita robert roberto robin rodney roger ronald rosa rosemary roy ruth ryan sally samantha samuel sandra sanjay sara sarah scott sean sergei shannon sharon shawn sheila shirley simon simone sofia sonia sophia stanley stephanie stephen steve steven susan suzanne sylvia tamara tanya teresa terry thomas tiffany timothy tina todd tom tommy tony tracy travis tyler valerie vanessa vera veronica victor victoria vijay vincent vivian walter wanda warren wayne wei wendy william willie xavier yasmin yolanda yusuf yvonne zachary zoe
  adams ahmed alvarez anderson bailey baker banerjee brooks campbell castillo castro chang chavez chowdhury clark collins cruz davis diaz edwards evans flores fernandez garcia gomez gonzalez gupta gutierrez hernandez herrera huang hughes jackson jenkins jimenez johnson jones kaur kelly khan kowalski kumar lee lewis lin liu lopez martinez mehta mendoza miller mitchell morales moreno morgan murphy nakamura nguyen nelson okafor okonkwo ortiz patel perez peterson phillips ramirez reddy reyes richardson rivera roberts robinson rodriguez rogers ruiz sanchez sanders santos shah sharma singh smith sullivan tanaka thompson torres tran vasquez wang watson williams wilson wong wu yamamoto yang zhang zhao
`);

/** Names that are also common words ("Will the dose change", "Mark the trend"). Flagged only with capitalization or person context. */
export const AMBIGUOUS_NAMES = words(`
  angel art austin bell bill buck carter chance christian georgia jan jordan virginia chase cole dawn dean don drew faith frank gene grace hope hunter iris ivy jade joy king lily mark max miles pat penny ray rich rose ruby sandy sue summer will young
`);

/** Words that introduce a person; the next capitalized or name-like word is treated as their name. */
export const ROLE_NOUNS = words(`patient patients pt pts member client resident person individual gentleman lady man woman boy girl child infant baby`);
export const TITLES = words(`mr mrs ms miss mx dr doctor prof nurse`);
export const RELATIONS = words(`mother father mom dad wife husband son daughter sister brother partner spouse aunt uncle grandmother grandfather grandma grandpa grandson granddaughter cousin niece nephew friend neighbor neighbour caregiver roommate fiance fiancee boyfriend girlfriend`);
export const NAMING_WORDS = words(`named called nicknamed aka`);

/** Prepositions that commonly precede a person ("for Priya", "regarding Bob"). */
export const PERSON_PREPOSITIONS = words(`for about regarding concerning re with`);

/** Verbs and connectors that commonly follow a person subject ("Priya has", "Bob takes", "Maya, who"). */
export const PERSON_FOLLOWERS = words(`
  has had is was needs needed with who whose aged age takes took reports reported presents presented complains complained denies denied feels felt says said states stated told tells lives lived works worked visited visits came comes went wants wanted prefers preferred refuses refused declined tolerates tolerated experiences experienced developed started stopped missed called asked admitted returned noticed lost gained underwent uses used gets got saw sees weighs weighed drinks smokes eats sleeps
`);

/** Next words that make a capitalized name an eponym rather than a person ("Wilson disease", "Stevens-Johnson syndrome"). */
export const EPONYM_FOLLOWERS = words(`disease syndrome palsy gangrene thyroiditis sign phenomenon lymphoma sarcoma ulcer esophagus encephalopathy dementia chorea triad criteria classification equation formula score class test maneuver reflex`);

/** Ordinary words that may be capitalized or possessive in clinical text and are never treated as names. */
export const KNOWN_WORDS = words(`
  a an the and or but if then so as at by for from in into of on onto to with without within about after before during over under since until per via vs versus
  is are was were be been being am has have had do does did will would shall should can could may might must not no yes
  this that these those it its it's they them their theirs he him his she her hers we us our you your i me my mine who whom whose which what when where why how
  all any each every some many most more less few other another such only also just very too than there here now still even both either neither nor else
  one two three four five first second third new old same different good bad high low next last best better well much own again once
  however therefore thus although though because while whether please thanks thank hi hello dear regards sincerely ok okay often usually typically generally sometimes always never rarely
  consider review check monitor start stop switch continue increase decrease reduce adjust avoid use add hold recheck repeat follow ask discuss recommend suggest prefer need want think see find note keep watch try give make take get go let help helps
  adult adults older elderly senior seniors children adolescent adolescents pediatric kids teen teens peer peers colleague colleagues specialist provider providers physician physicians clinician clinicians pharmacist dietitian educator team staff
  kidney kidneys renal liver hepatic heart cardiac cardiovascular blood pressure sugar glucose weight diabetes obesity type stage grade dose doses dosage drug drugs medicine medicines medication medications therapy therapies treatment insulin
  labs lab test tests result results trend trends level levels function failure disease syndrome disorder condition conditions symptom symptoms sign signs side effect effects risk risks benefit benefits history baseline follow-up visit visits clinic hospital practice care plan goal goals target targets
  nausea vomiting diarrhea constipation fatigue edema pain rash fever cough dizziness headache gout stroke angina injury yeast gangrene potassium sodium creatinine egfr gfr uacr a1c hba1c ldl bmi
  day days week weeks month months year years today tomorrow yesterday morning evening night time times dose meal meals diet food exercise lifestyle sleep alcohol smoking tobacco pregnancy lactation
  male female men women body mass index ratio rate volume status fluid fluids protein albumin urine serum plasma cholesterol triglycerides lipids receptor receptors agonist agonists inhibitor inhibitors blocker blockers
  dialysis transplant eye eyes foot feet skin bone bones lung lungs brain thyroid stomach gut bowel bladder prostate breast cancer tumor nodule surgery procedure imaging scan ultrasound
  medicare medicaid insurance coverage cost copay prior formulary label labeling guideline guidelines standards evidence study studies trial trials data literature experience approach question answer
  referral consult chart record note notes message contact family home work school job community rural urban hispanic latino asian native american americans african european english spanish veteran veterans
  relevant general overall typical common rare mild moderate severe acute chronic stable unstable controlled uncontrolled elevated normal abnormal frequent daily weekly monthly yearly annual quarterly
  education portal safety population preference compliance outcome outcomes satisfaction selection counseling assistance program access group groups cohort case cases load mix panel age
  heart-failure follow-ups self-monitoring
`);

/** Brand medicines that look like proper nouns. Generic names are mostly covered by suffix shape in the detector. */
export const DRUG_BRANDS = words(`
  jardiance farxiga invokana steglatro brenzavvy inpefa ozempic wegovy rybelsus mounjaro zepbound trulicity victoza saxenda byetta bydureon adlyxin soliqua xultophy januvia janumet tradjenta jentadueto onglyza nesina synjardy xigduo glucophage actos avandia amaryl glucotrol
  lantus levemir tresiba toujeo basaglar semglee humalog novolog admelog fiasp lyumjev apidra humulin novolin afrezza kerendia entresto eliquis xarelto pradaxa savaysa coumadin plavix brilinta effient
  lipitor crestor zocor pravachol livalo repatha praluent leqvio nexletol nexlizet zetia vascepa lasix bumex demadex aldactone inspra norvasc cozaar diovan benicar micardis avapro toprol lopressor coreg bystolic
  synthroid levoxyl unithroid tirosint humira enbrel keytruda opdivo dupixent stelara skyrizi rinvoq xeljanz otezla prolia forteo evenity fosamax boniva reclast biktarvy descovy truvada paxlovid lagevrio tamiflu
  zoloft lexapro prozac paxil celexa wellbutrin cymbalta effexor pristiq abilify seroquel zyprexa risperdal adderall ritalin vyvanse xanax ativan klonopin ambien neurontin lyrica tylenol advil motrin aleve
  nexium prilosec protonix pepcid flomax proscar viagra cialis spiriva symbicort advair breo trelegy singulair ventolin proair narcan suboxone chantix contrave qsymia xenical veozah nurtec ubrelvy aimovig emgality botox
  vraylar rexulti caplyta trintellix auvelity invega jynarque kayexalate lokelma veltassa renvela phoslo sensipar
`);

/** Eponyms used for conditions and scores rather than people. */
export const EPONYMS = words(`parkinson parkinson's alzheimer alzheimer's crohn crohn's hashimoto hashimoto's addison addison's cushing cushing's graves graves' raynaud raynaud's hodgkin hodgkin's fournier fournier's sjogren sjögren huntington tourette asperger meniere ménière kawasaki marfan paget wernicke korsakoff kaposi barrett whipple behcet behçet takayasu gaucher fabry pompe charcot brugada guillain barré barre cockcroft gault pugh child-pugh cockcroft-gault framingham kdigo`);

/** Upper-case abbreviations that must not be mistaken for patient initials. */
export const KNOWN_ACRONYMS = words(`
  bp hr rr gi ua uti aki ckd esrd hf chf cad mi dm htn copd osa pe dvt af tia cva ed er icu or pt ot slp np pa rn md do pcp gp ehr emr fda cdc cms nih ada aha acc kdigo
  glp sglt dpp tzd su ace arb arni mra bmi ldl hdl tg alt ast inr cbc cmp bmp tsh pth uacr acr egfr gfr scr bun iv im sc po prn bid tid qd qid qw hs am pm us uk eu no ok ai it hcp cgm smbg dka hhs
  nafld nash masld hcc cvd ascvd pad cv ra ms hiv hcv hbv tb ct mri ecg ekg cxr nsaid ppi ssri otc ae sae adr rems pi irb ob gyn ent hba ckd-epi ana
`);
