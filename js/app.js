/* Performance Powerhouse — main application controller (classic script; shares globals with js/v5-additions.js). */
'use strict';
const SYL = {
  physics: { color:'var(--phy)', abbr:'phy', units:[
    {n:"01 · Measurements", t:["Physical quantities & SI units","Fundamental & derived units","Dimensions & dimensional analysis","Scalars vs vectors","Vector addition & resolution","Errors: systematic & random","Precision vs accuracy","Significant figures & rounding"]},
    {n:"02 · Mechanics", t:["Kinematics — displacement, velocity, acceleration","Equations of motion (SUVAT)","Projectile motion","Newton's three laws","Friction (static & kinetic)","Circular motion & centripetal force","Work, energy & power","Conservation of mechanical energy","Momentum & impulse","Conservation of linear momentum","Elastic & inelastic collisions","Torque, moment of a force & couple","Conditions for equilibrium","Centre of gravity","Newton's law of gravitation","Gravitational field & field strength","Orbital motion & Kepler's laws","Escape velocity"]},
    {n:"03 · Waves & Oscillations", t:["Simple harmonic motion — definition & equations","Energy in SHM","Damping & forced oscillations","Resonance","Transverse & longitudinal waves","Wave properties: speed, frequency, wavelength, amplitude","Wave equation v = fλ","Superposition principle","Interference (constructive & destructive)","Diffraction","Stationary waves & harmonics","Sound waves — intensity & decibels","Doppler effect","Reflection & refraction of light, Snell's law","Critical angle & total internal reflection","Thin lenses & mirrors — ray diagrams","Lens & mirror formulae, magnification","Optical instruments"]},
    {n:"04 · Heat", t:["Temperature scales & thermometers","Thermal expansion of solids, liquids, gases","Heat capacity & specific heat capacity","Latent heat (fusion & vaporisation)","Conduction, convection & radiation","Thermal conductivity","Ideal gas laws (Boyle, Charles, Gay-Lussac)","Ideal gas equation PV = nRT","Kinetic theory of gases","Internal energy","First law of thermodynamics","Isothermal, adiabatic, isobaric, isochoric processes","Heat engines & efficiency"]},
    {n:"05 · Electric Field", t:["Coulomb's law","Electric field & field lines","Electric field due to point charges","Electric potential & potential energy","Equipotential surfaces","Capacitance & capacitors","Capacitors in series & parallel","Energy stored in a capacitor","Dielectrics & relative permittivity"]},
    {n:"06 · Magnetic Field", t:["Magnetic field & flux density","Magnetic field patterns (bar magnet, solenoid, wire)","Force on current-carrying conductor (F = BIL)","Force on moving charge (F = Bqv)","Electromagnetic induction","Faraday's & Lenz's laws","Self-inductance & mutual inductance","Transformers","AC generation"]},
    {n:"07 · Gravitational Field", t:["Gravitational field strength","Gravitational potential","Gravitational potential energy","Field lines & equipotential surfaces","Satellite motion & geostationary orbits","Comparison: gravitational vs electric fields"]},
    {n:"08 · Electricity", t:["Electric current, charge & drift velocity","Ohm's law & I–V characteristics","Resistance & resistivity","Series & parallel circuits","Kirchhoff's current & voltage laws","EMF & internal resistance","Potential dividers","Wheatstone bridge","Potentiometer","Power in electrical circuits","Heating effect of current"]},
    {n:"09 · Electronics", t:["Conductors, insulators & semiconductors","Intrinsic & extrinsic (n-type, p-type) semiconductors","p-n junction & depletion layer","Diode characteristics","Half-wave & full-wave rectification","Smoothing with capacitor","Zener diode & voltage regulation","Bipolar transistor (NPN) — common emitter","Transistor as amplifier & switch","Logic gates (AND, OR, NOT, NAND, NOR, XOR) & truth tables","Operational amplifier (inverting & non-inverting)","Comparator & feedback"]},
    {n:"10 · Properties of Matter", t:["Density & relative density","Pressure in fluids — Pascal's principle","Archimedes' principle & buoyancy","Continuity equation","Bernoulli's principle","Viscosity & Stokes' law","Terminal velocity","Hooke's law","Young's modulus","Stress & strain","Elastic, plastic & brittle behaviour","Surface tension & capillarity"]},
    {n:"11 · Matter & Radiation", t:["Photoelectric effect & Einstein's equation","Work function & threshold frequency","Wave-particle duality (de Broglie)","Atomic spectra — emission & absorption","Bohr model of hydrogen atom","Energy levels & photon emission","X-ray production & properties","Nuclear structure — protons, neutrons, isotopes","Radioactivity: alpha, beta, gamma — properties","Radioactive decay law & half-life","Nuclear reactions — fission & fusion","Mass defect & binding energy (E = mc²)","Radiation safety & detectors"]}
  ]},

  chemistry: { color:'var(--chem)', abbr:'chem', units:[
    {n:"01 · Atomic Structure & Periodic Table", t:["Fundamental particles & atomic structure","Atomic number, mass number & isotopes","Electronic configuration & notation","Quantum numbers (n, l, m, s)","Orbital shapes (s, p, d)","Aufbau principle, Hund's rule, Pauli exclusion","Ionisation energies — evidence for shells","Periodic trends: atomic/ionic radius, IE, EA, electronegativity","s-block (Group IA, IIA) — properties & reactions","p-block (Group IIIA–VIIA, Group 0) — properties","d-block transition metals: variable oxidation state, complex ions, colour, catalysis","Anomalous properties within groups","Diagonal relationships"]},
    {n:"02 · Structure & Bonding", t:["Ionic bonding — formation, lattice structure, properties","Covalent bonding — single, double, triple bonds","Dative (coordinate) bonds","Metallic bonding & properties","VSEPR theory — predicting molecular shapes","Hybridisation: sp, sp², sp³","Sigma & pi bonds","Bond polarity & molecular dipole moment","Intermolecular forces: London dispersion, dipole-dipole, hydrogen bonding","Giant ionic, covalent molecular & network structures","Allotropes of carbon (diamond, graphite, fullerene)"]},
    {n:"03 · Chemical Calculations", t:["Relative atomic & molecular mass","Mole concept & Avogadro's constant","Empirical & molecular formula","Percentage composition","Stoichiometric calculations from equations","Limiting reagent & excess reagent","Percentage yield & atom economy","Concentration — mol/dm³ & g/dm³","Dilution calculations","Volumetric analysis & titrations","Back titrations","Gas volume calculations (molar volume at STP)"]},
    {n:"04 · Gases", t:["Boyle's law, Charles' law, Gay-Lussac's law","Combined gas law","Ideal gas equation PV = nRT","Dalton's law of partial pressures","Molar volume at STP","Diffusion & Graham's law","Kinetic molecular theory of gases","Real vs ideal gas behaviour","van der Waals equation (qualitative)"]},
    {n:"05 · Energetics", t:["Exothermic & endothermic reactions","Enthalpy change (ΔH)","Standard enthalpy of formation, combustion, neutralisation","Hess's law & enthalpy cycles","Bond enthalpies & average bond energies","Born-Haber cycle & lattice energy","Entropy (ΔS) & disorder","Gibbs free energy: ΔG = ΔH − TΔS","Spontaneity conditions"]},
    {n:"06 · Inorganic Chemistry (s, p, d)", t:["Group IA (alkali metals) — reactions with water, air, halogens","Group IIA (alkaline earth metals) — solubility & thermal stability trends","Group VIIA (halogens) — oxidising power, displacement, hydrogen halides","Group 0 (noble gases)","Nitrogen & its compounds (NH₃, HNO₃, oxides of N)","Sulphur & its compounds (SO₂, SO₃, H₂SO₄, H₂S)","Chlorine chemistry — bleach, water treatment","Aluminium & its compounds","Transition metals — electron configuration & oxidation states","Complex ions — shapes, naming, colour, ligand substitution","Redox behaviour of transition metal compounds","Iron, copper, chromium, manganese chemistry","Qualitative inorganic analysis (cation & anion tests)"]},
    {n:"07 · Organic Chemistry — Basics", t:["Homologous series & functional groups","IUPAC nomenclature","Structural, chain, positional & functional group isomerism","Stereoisomerism — geometric (cis/trans) & optical (chirality, enantiomers)","Types of organic reactions: substitution, addition, elimination, oxidation, reduction","Homolytic vs heterolytic bond fission","Free radical, electrophilic & nucleophilic mechanisms","Inductive & mesomeric effects"]},
    {n:"08 · Organic — Hydrocarbons", t:["Alkanes — properties, free radical substitution, combustion","Alkenes — structure, E/Z isomerism","Electrophilic addition (HX, X₂, H₂O, H₂)","Markovnikov's rule","Oxidation of alkenes (KMnO₄)","Addition polymerisation","Alkynes — acidic character, addition reactions","Benzene — Kekulé vs delocalised model, evidence for delocalisation","Electrophilic aromatic substitution: nitration, halogenation, Friedel-Crafts","Directing effects of substituents","Phenol chemistry"]},
    {n:"09 · Organic — Functional Groups I", t:["Alcohols — classification, oxidation, dehydration, esterification, Lucas test","Ethers — preparation & properties","Aldehydes & ketones — nucleophilic addition (HCN, NaBH₄, Grignard)","Oxidation tests (Tollens', Fehling's)","Iodoform test","Carboxylic acids — acidity, reactions (SOCl₂, PCl₅, esterification)","Carboxylate salts","Acyl chlorides, anhydrides — reactions","Esters — formation & hydrolysis","Amides — formation & hydrolysis","Nucleophilic acyl substitution mechanism"]},
    {n:"10 · Organic — Functional Groups II", t:["Amines — classification, basicity, preparation, reactions with acids & acyl chlorides","Amino acids — structure, zwitterion, isoelectric point","Peptide bond formation & hydrolysis","Proteins — primary to quaternary structure, denaturation (brief)","Carbohydrates — monosaccharides, disaccharides, polysaccharides","Reducing sugars test","Lipids — fats, oils, saponification (hydrolysis)","Addition polymers vs condensation polymers","Nylon, polyester, PVC, polythene — structures, uses & recycling"]},
    {n:"11 · Kinetics", t:["Factors affecting rate: concentration, temperature, surface area, catalyst","Measuring rate of reaction experimentally","Rate law: rate = k[A]ⁿ[B]ᵐ","Order of reaction (0th, 1st, 2nd) — determination from data","Rate constant k & its units","Half-life of first-order reactions","Arrhenius equation & activation energy","Effect of temperature on k","Reaction profiles & transition state","Homogeneous & heterogeneous catalysis","Enzyme catalysis","Reaction mechanisms & rate-determining step"]},
    {n:"12 · Chemical Equilibrium", t:["Reversible reactions & dynamic equilibrium","Le Chatelier's principle — effect of concentration, temperature, pressure","Equilibrium constant Kc — expression & calculation","Kp — expression, units & calculation","Relationship between Kc & Kp","Brønsted-Lowry theory of acids & bases","Ka, Kb & Kw","pH calculations — strong & weak acids/bases","Buffer solutions — preparation & action","Henderson-Hasselbalch equation","Acid-base indicators","Solubility product Ksp & common ion effect"]},
    {n:"13 · Electrochemistry", t:["Oxidation & reduction (OIL RIG)","Oxidation state rules & assignment","Half-equations — oxidation & reduction","Balancing redox equations","Electrochemical (galvanic) cells","Standard electrode potential E°","Standard hydrogen electrode (SHE)","EMF calculation & cell notation","Electrochemical series & feasibility","Electrolysis — electrolytes, electrodes, products at each electrode","Selective discharge in mixed solutions","Faraday's first & second laws","Electrolysis calculations","Industrial applications: electroplating, anodising, aluminium extraction, chlor-alkali process"]},
    {n:"14 · Industry & Environmental Chemistry", t:["Haber process for ammonia — conditions & equilibrium considerations","Contact process for H₂SO₄","Ostwald process for HNO₃","Chlor-alkali process for NaOH","Blast furnace (iron extraction)","Hall-Héroult process (aluminium extraction)","Copper extraction & refining","Air pollution — SOₓ, NOₓ, CO, particulates, ozone","Acid rain — causes, effects & control","Ozone layer depletion — CFCs & Montreal Protocol","Greenhouse effect & global warming","Water treatment — purification, chlorination, fluoridation","Eutrophication","Green chemistry principles","Atom economy & sustainability"]}
  ]},

  biology: { color:'var(--bio)', abbr:'bio', units:[
    {n:"01 · Introduction to Biology", t:["Characteristics of living organisms","Levels of biological organisation","Scientific method — hypothesis, variables, controls","Light microscopy — magnification & resolution","Electron microscopy (TEM & SEM)","Magnification calculations","Cell fractionation & ultracentrifugation","Biological classification — need & hierarchy (KPCOFGS)","Five-kingdom system","Binomial nomenclature","Dichotomous keys"]},
    {n:"02 · Chemical Basis of Life", t:["Water — properties (cohesion, adhesion, high SHC, solvent, density anomaly) & biological roles","Inorganic ions & their functions (Na⁺, K⁺, Ca²⁺, Mg²⁺, Fe²⁺, Cl⁻, PO₄³⁻, NO₃⁻)","Carbohydrates: monosaccharides (glucose, fructose, galactose), disaccharides, polysaccharides (starch, glycogen, cellulose)","Lipids: triglycerides, phospholipids, steroids — structure & functions","Food molecule tests (Benedict's, iodine, biuret, emulsion, Sudan)","Amino acids — structure, essential vs non-essential","Protein structure: primary to quaternary","Enzymes: active site, lock-and-key & induced fit","Effect of pH, temperature, substrate concentration on enzyme activity","Enzyme inhibition: competitive & non-competitive","Cofactors & coenzymes","Nucleotides — structure & types","DNA double helix — structure, base pairing, antiparallel strands","RNA types (mRNA, tRNA, rRNA) & functions","ATP — structure, hydrolysis & role as energy currency"]},
    {n:"03 · Diversity of Organisms", t:["Prokaryotes: bacterial structure (cell wall, flagella, pili, capsule, plasmid)","Gram-positive vs Gram-negative bacteria","Binary fission","Archaebacteria — extremophiles","Viruses: structure (capsid, envelope, nucleic acid), types","Lytic & lysogenic cycles (bacteriophage)","Kingdom Protista: algae (Euglena, Chlamydomonas), protozoa (Amoeba, Paramecium, Plasmodium)","Kingdom Fungi: structure (hyphae, mycelium), nutrition, reproduction (Mucor, Rhizopus, Yeast, Mushroom)","Kingdom Plantae: Bryophyta, Pteridophyta, Gymnosperms, Angiosperms (dicot vs monocot)","Alternation of generations (outline)","Kingdom Animalia: invertebrate phyla (Porifera, Cnidaria, Platyhelminthes, Nematoda, Annelida, Arthropoda, Mollusca, Echinodermata)","Phylum Chordata — subphyla & vertebrate classes","Evolutionary trends across animal phyla"]},
    {n:"04 · Plant Form & Function", t:["Plant cell types: meristematic & permanent tissues","Parenchyma, collenchyma, sclerenchyma","Xylem (tracheids & vessels) & phloem (sieve tubes & companion cells)","Root structure: epidermis, cortex, endodermis (Casparian strip), stele","Root hair cells & water/mineral uptake","Herbaceous dicot & monocot stem structure","Leaf anatomy: palisade & spongy mesophyll, veins, stomata (guard cells)","Water movement: osmosis, symplast, apoplast, transmembrane pathways","Transpiration — cohesion-tension mechanism","Factors affecting transpiration rate","Potometer experiment","Translocation of assimilates — source to sink","Pressure flow hypothesis","Photosynthesis — overview of light-dependent & light-independent stages","Chloroplast structure: grana, stroma, thylakoid","Light-dependent reactions: photosystems I & II, photolysis, ATP synthesis, NADPH production","Calvin cycle: carbon fixation, reduction, regeneration of RuBP","Factors affecting rate of photosynthesis (light intensity, CO₂, temperature)","C3 vs C4 plants (brief)","Mineral nutrition: N, P, K, Mg, Ca — roles & deficiency symptoms","Phytohormones: auxin (IAA), gibberellin, cytokinin, abscisic acid, ethylene — roles & applications","Reproduction in flowering plants: flower structure, pollination, double fertilisation, seed & fruit formation","Vegetative propagation","Seed germination & conditions"]},
    {n:"05 · Animal Form & Function", t:["Human digestive system: oral cavity to large intestine — anatomy","Mechanical & chemical digestion","Digestive enzymes (amylase, pepsin, trypsin, lipase) — sites & products","Absorption in small intestine: villi & microvilli structure, active transport, facilitated diffusion","Role of liver: deamination, detoxification, bile production, glycogen storage, plasma protein synthesis","Blood components: erythrocytes, leucocytes (types), thrombocytes, plasma","ABO & Rh blood groups","Heart structure: four chambers, valves, coronary vessels, pericardium","Cardiac cycle: systole & diastole, pressure changes","Cardiac conduction: SA node, AV node, bundle of His, Purkinje fibres","Arteries, veins & capillaries — structure & function","Blood pressure regulation","Lymphatic system & lymph","Innate immunity: physical barriers, phagocytosis, inflammation, fever","Adaptive immunity: B lymphocytes & antibodies, T lymphocytes, clonal selection","Memory cells & secondary immune response","Vaccination — types & mechanisms","Monoclonal antibodies — hybridoma technique & uses","Aerobic respiration: glycolysis (cytoplasm), link reaction (matrix), Krebs cycle (matrix), oxidative phosphorylation (inner membrane)","ATP yield from glucose","Respiratory substrates: carbohydrates, fats, proteins","Anaerobic respiration: lactic acid fermentation (animals), ethanol fermentation (yeast)","Respiratory system: nasal cavity, trachea, bronchi, bronchioles, alveoli","Breathing mechanism: pressure changes, diaphragm & intercostal muscles","Gas exchange at alveoli — partial pressures","Haemoglobin — oxygen dissociation curve shape & significance","Bohr effect (CO₂ & pH)","Foetal haemoglobin","CO₂ transport: dissolved, bicarbonate ions, carbaminohaemoglobin","Kidney structure: cortex, medulla, renal pelvis, ureter","Nephron structure: Bowman's capsule, PCT, loop of Henle, DCT, collecting duct","Glomerular filtration (ultrafiltration) — factors affecting GFR","Selective reabsorption: PCT (glucose, amino acids, ions), loop of Henle (water & salt gradient)","Osmoregulation: ADH & collecting duct permeability","Aldosterone & Na⁺ reabsorption in DCT","Urea formation in liver (ornithine cycle outline)","Skin as excretory organ (sweat)","Neuron types (sensory, motor, interneuron) & structure","Resting potential — ion distribution & maintenance","Action potential — depolarisation, repolarisation, refractory period","Propagation: saltatory (myelinated) & non-saltatory conduction","Synaptic transmission: synaptic vesicles, neurotransmitters, receptor binding, removal","Excitatory & inhibitory synapses","Reflex arc — components & types","Brain regions: cerebral cortex, cerebellum, medulla oblongata, hypothalamus, thalamus","Spinal cord structure (grey & white matter)","Eye structure & function — photoreceptors (rods & cones)","Ear structure — hearing & balance","Endocrine system: pituitary (anterior & posterior), thyroid, adrenal (cortex & medulla), pancreas (islets of Langerhans), gonads","Hormonal mechanisms: steroid vs peptide hormones","Blood glucose regulation: insulin (beta cells), glucagon (alpha cells), diabetes mellitus","Thermoregulation: hypothalamus, vasodilation/vasoconstriction, sweating, shivering","Blood pressure regulation (renin-angiotensin)","Male reproductive system: testes, epididymis, vas deferens, seminal vesicles, prostate, penis","Spermatogenesis","Female reproductive system: ovaries, fallopian tubes, uterus, cervix, vagina","Oogenesis & ovulation","Menstrual cycle: follicular phase, ovulation, luteal phase","Hormonal control: FSH, LH, oestrogen, progesterone — feedback","Fertilisation & implantation","Placenta: structure, functions (gas exchange, nutrition, hormones, barrier)","Embryonic development — overview (cleavage, gastrulation, organogenesis)","Contraception methods — types & mechanism"]},
    {n:"06 · Genetics", t:["Cell cycle: G1, S, G2 phases (interphase) & mitosis","Mitosis stages (PMAT) & significance","Meiosis I stages: prophase I (crossing over, chiasmata), metaphase I, anaphase I, telophase I","Meiosis II stages & cytokinesis","Independent assortment of homologous pairs","Significance of meiosis — variation","Comparison: mitosis vs meiosis","Mendel's laws: Law of Segregation (monohybrid)","Law of Independent Assortment (dihybrid)","Test cross & back cross","Dominance & recessiveness","Codominance (sickle cell, blood groups)","Incomplete dominance","Multiple alleles (ABO blood group system)","Lethal alleles","Sex determination (XX female, XY male)","X-linked inheritance (haemophilia, colour blindness)","Y-linked inheritance","Linkage — complete & incomplete","Recombination frequency & genetic mapping","Chromosomal mutations: deletion, duplication, inversion, translocation","Change in chromosome number: aneuploidy (monosomy, trisomy — Down syndrome), polyploidy","Gene mutations: missense, nonsense, frameshift, silent","Transition & transversion mutations","Mutagenic agents (UV, X-rays, chemical mutagens)","Hardy-Weinberg equilibrium — equation & conditions"]},
    {n:"07 · Molecular Biology", t:["DNA replication: semi-conservative model (Meselson-Stahl experiment)","Enzymes: helicase, primase, DNA polymerase III (leading & lagging strand), ligase","Okazaki fragments & lagging strand synthesis","Transcription: initiation (promoter, RNA polymerase), elongation, termination","RNA processing: 5' cap, poly-A tail, splicing (introns & exons, spliceosomes)","Translation: ribosome structure (small & large subunits)","tRNA structure & aminoacyl-tRNA synthetase","Codon-anticodon recognition, peptide bond formation, polypeptide elongation, termination","Genetic code: triplet, degenerate, non-overlapping, universal, start & stop codons","Gene expression regulation in prokaryotes: lac operon (Jacob & Monod)","Gene expression regulation in eukaryotes: transcription factors, enhancers, silencers","Mutation effects on protein function","Restriction endonucleases — recognition sequences & cutting","DNA ligase in recombinant DNA","Vectors: plasmids, bacteriophages, cosmids, YACs","Gene cloning — transformation & selection (antibiotic resistance, blue-white screening)","Genomic library vs cDNA library","PCR: denaturation, annealing, extension — steps, components & applications","Gel electrophoresis — principle, procedure & interpretation","Southern blotting (outline)","DNA profiling / fingerprinting — applications (forensics, paternity)","CRISPR-Cas9 — mechanism & applications (outline)","Recombinant insulin, human growth hormone, factor VIII production","GMO examples: Bt crops, herbicide-resistant crops, golden rice","Ethical issues in genetic engineering"]},
    {n:"08 · Environmental Biology", t:["Ecosystem: biotic & abiotic components","Producers (autotrophs), consumers (heterotrophs), decomposers","Food chains, food webs & trophic levels","Energy flow — 10% transfer rule","Ecological pyramids: numbers, biomass & energy","Gross primary productivity (GPP) & net primary productivity (NPP)","Carbon cycle: photosynthesis, respiration, decomposition, combustion, ocean absorption","Nitrogen cycle: nitrogen fixation (Rhizobium, Azotobacter, lightning), nitrification, denitrification, ammonification","Phosphorus cycle (brief)","Water cycle (brief)","Population growth models: J-shaped (exponential) & S-shaped (logistic) curves","Carrying capacity & limiting factors (food, space, disease, predation)","Intraspecific vs interspecific competition","Predator-prey oscillations (Lotka-Volterra)","Symbiosis: mutualism, commensalism, parasitism — examples","Ecological succession: primary & secondary","Pioneer species, seral stages & climax community","Biodiversity: genetic, species & ecosystem diversity","Measuring species diversity: Simpson's Diversity Index","Threats to biodiversity: habitat destruction, overexploitation, invasive species, pollution, climate change","In situ conservation: national parks, biosphere reserves, wildlife corridors","Ex situ conservation: seed banks, botanical gardens, zoos, captive breeding programmes","Environmental impact assessment"]},
    {n:"09 · Microbiology", t:["Bacteria: detailed structure — cell wall (peptidoglycan), plasma membrane, ribosomes (70S), flagella, pili, capsule, plasmid","Gram-positive vs Gram-negative — staining procedure & differences","Binary fission & bacterial growth curve (lag, log, stationary, death phases)","Bacterial nutrition: autotrophic (photosynthetic, chemosynthetic) & heterotrophic","Factors affecting bacterial growth (temperature, pH, oxygen, nutrients)","Antibiotic resistance — mechanisms (beta-lactamase, efflux pumps, target modification)","Viruses: structure — capsid proteins, nucleic acid (DNA or RNA), envelope","Replication cycles: lytic & lysogenic — detailed steps","Bacteriophage vs animal virus replication","Retroviruses — reverse transcriptase, HIV replication & AIDS","Fungi: structure (hyphae, mycelium, septa/aseptate), cell wall (chitin)","Asexual reproduction (spores) & sexual reproduction in fungi","Economic importance of fungi (decomposers, food, antibiotics, pathogens)","Human microbial diseases: tuberculosis (Mycobacterium), cholera (Vibrio cholerae), malaria (Plasmodium — life cycle), typhoid (Salmonella), AIDS (HIV)","Disease transmission routes & epidemiology","Innate vs adaptive immune response to pathogens","Antibiotics — classes, mode of action (cell wall, protein synthesis, DNA) & resistance","Antiviral drugs — mode of action","Vaccines: live attenuated, killed, subunit, toxoid — examples & mechanism","Herd immunity","Sterilisation & disinfection methods (autoclaving, UV, chemicals)","Aseptic technique in microbiology"]},
    {n:"10 · Applied Biology", t:["Food biotechnology: fermentation — alcoholic (beer, wine), lactic acid (yoghurt, cheese)","Bread making — yeast fermentation","Citric acid production (Aspergillus niger)","Single-cell protein (SCP) — Quorn, spirulina","Industrial enzymes: protease, lipase, amylase — uses & immobilised enzymes","Bioreactors: batch culture vs continuous culture","Control of fermentation (pH, temperature, aeration, stirring)","Production of insulin via recombinant E. coli — steps","Production of human growth hormone & factor VIII","Monoclonal antibodies: hybridoma technique, ELISA, cancer therapy (Herceptin), home pregnancy tests","Gene therapy: somatic vs germ-line therapy, viral vectors","Stem cells: totipotent, pluripotent, multipotent — sources & therapeutic potential","Tissue culture & micropropagation — applications in agriculture","Reproductive cloning & therapeutic cloning — SCNT","Transgenic animals — examples & uses","Agricultural biotechnology: Bt crops (Bacillus thuringiensis toxin), herbicide-resistant crops","Biological nitrogen fixation — Rhizobium in root nodules","Biological control of pests — examples","Biogas production — anaerobic digestion, methane as fuel","Biofuels — first & second generation (bioethanol, biodiesel)","Bioremediation — oil spills, heavy metals (Phytoremediation)","Aquaculture — principles & examples","Ethical issues: GMO safety, gene therapy ethics, cloning ethics, biodiversity concerns"]}
  ]}
};

/* Legacy v2 implementation retained only as an inert migration reference.
const STORE_KEY = 'al_v2_samra';
let R = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(R));
const tk = (s,u,t) => `${s}|${u}|${t}`;

function buildSubject(sub) {
  const data = SYL[sub];
  const el = document.getElementById(sub);
  el.innerHTML = '';
  data.units.forEach((unit, ui) => {
    const wrap = document.createElement('div');
    wrap.className = 'unit-wrap';
    const hdr = document.createElement('div');
    hdr.className = 'unit-hdr';
    hdr.innerHTML = `<span class="u-num">${String(ui+1).padStart(2,'0')}</span>
      <span class="u-name" style="color:${data.color}">${unit.n}</span>
      <span class="u-pct" style="color:${data.color}" id="up-${sub}-${ui}">—</span>
      <span class="u-arr">▶</span>`;
    const list = document.createElement('div');
    list.className = 'topics-list';
    unit.t.forEach((t, ti) => {
      const key = tk(sub, ui, ti);
      const row = document.createElement('div');
      row.className = 'topic-row';
      row.innerHTML = `<span class="t-name">${t}</span>
        <div class="r-grp">
          <button class="r-btn${R[key]===1?' on':''}" data-v="1" data-k="${key}">W</button>
          <button class="r-btn${R[key]===2?' on':''}" data-v="2" data-k="${key}">M</button>
          <button class="r-btn${R[key]===3?' on':''}" data-v="3" data-k="${key}">S</button>
        </div>`;
      list.appendChild(row);
    });
    hdr.addEventListener('click', () => { hdr.classList.toggle('open'); list.classList.toggle('open'); });
    wrap.appendChild(hdr); wrap.appendChild(list);
    el.appendChild(wrap);
    refreshUnitPct(sub, ui);
  });
  el.addEventListener('click', e => {
    const btn = e.target.closest('.r-btn');
    if (!btn) return;
    const key = btn.dataset.k, val = +btn.dataset.v;
    R[key] === val ? delete R[key] : (R[key] = val);
    save();
    btn.closest('.r-grp').querySelectorAll('.r-btn').forEach(b => b.classList.toggle('on', R[key] === +b.dataset.v));
    const [s,,u] = key.split('|');
    refreshUnitPct(s, +u);
    refreshOverview();
  });
}

function refreshUnitPct(sub, ui) {
  const unit = SYL[sub].units[ui];
  let s=0, r=0;
  unit.t.forEach((_,ti) => { const v=R[tk(sub,ui,ti)]; if(v){s+=v;r++;} });
  const el = document.getElementById(`up-${sub}-${ui}`);
  if (el) el.textContent = r ? Math.round(s/(r*3)*100)+'%' : '—';
}

function subScore(sub) {
  let total=0, rated=0, sum=0;
  SYL[sub].units.forEach((u,ui) => u.t.forEach((_,ti) => {
    total++; const v=R[tk(sub,ui,ti)]; if(v){sum+=v;rated++;}
  }));
  return {total, rated, pct: rated ? Math.round(sum/(rated*3)*100) : 0};
}

function refreshOverview() {
  ['physics','chemistry','biology'].forEach(sub => {
    const a=SYL[sub].abbr, s=subScore(sub);
    document.getElementById(`${a}-pct`).textContent = s.rated ? s.pct+'%' : '—';
    document.getElementById(`${a}-done`).textContent = `${s.rated} / ${s.total} rated`;
    document.getElementById(`${a}-bar`).style.width = s.pct+'%';
    const p2=document.getElementById(`${a}-p2`);
    if(p2) p2.textContent = s.rated ? s.pct+'%' : '—';
  });
  const wl=document.getElementById('weak-list');
  const items=[];
  Object.keys(SYL).forEach(sub => SYL[sub].units.forEach((u,ui) => u.t.forEach((t,ti) => {
    if(R[tk(sub,ui,ti)]===1) items.push({t, a:SYL[sub].abbr});
  })));
  wl.innerHTML = items.length
    ? items.map(i=>`<span class="chip chip-${i.a}">${i.t}</span>`).join('')
    : '<span style="color:var(--muted);font-size:11px">No weak topics yet — keep rating!</span>';
}

document.querySelectorAll('.tab').forEach(tab =>
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c=>c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.sub).classList.add('active');
  })
);

(function(){
  const el=document.getElementById('wm-layer');
  const txt='Legacy migration reference';
  for(let r=0;r<14;r++) for(let c=0;c<5;c++){
    const s=document.createElement('span');
    s.textContent=txt; s.style.left=(c*26-4)+'%'; s.style.top=(r*8-1)+'%';
    el.appendChild(s);
  }
})();

buildSubject('physics');
buildSubject('chemistry');
buildSubject('biology');
refreshOverview();
*/

const APP_KEY = 'al_performance_powerhouse_v5';
const V4_APP_KEY = 'al_performance_powerhouse_v4';
const PREVIOUS_POWERHOUSE_APP_KEY = 'al_performance_powerhouse_v3';
const PREVIOUS_APP_KEY = 'al_performance_command_centre_v6';
const OLDER_APP_KEY = 'al_performance_command_centre_v5';
const OLDEST_APP_KEY = 'al_performance_command_centre_v4';
const VERY_OLD_APP_KEY = 'al_performance_command_centre_v3';
const LEGACY_KEY = 'al_v2_samra';
const RECOVERY_KEY = 'al_performance_powerhouse_v5_recovery';
const V4_RECOVERY_KEY = 'al_performance_powerhouse_v4_recovery';
const PREVIOUS_POWERHOUSE_RECOVERY_KEY = 'al_performance_powerhouse_v3_recovery';
const PREVIOUS_RECOVERY_KEY = 'al_performance_command_centre_v6_recovery';
const DONATED_TRACKER_ARCHIVE_KEY = 'al_performance_donated_tracker_archive_v1';
const {
  SUBJECTS, DAILY_FIELDS, OLD_V6_DAILY_TARGETS, ATTEMPT_TYPE_NAMES, ERROR_NAMES, BUILD: CORE_BUILD,
  blankDailyValues, normalizeDailyTargets,
} = PowerhouseCore;
const DEFAULT_DAILY_TARGETS = blankDailyValues();
/** `?demo=1` loads a fictional sample record in memory only; nothing is written to storage. */
const DEMO_MODE = (() => { try { return new URLSearchParams(location.search).get('demo') === '1'; } catch (_) { return false; } })();
const COURSE_CORRECTION_RULES = [
  { id:'resource', label:'I want a better resource', hint:'Resource accumulation / teacher hopping', action:'Stop searching. Open the current paper and complete 10 questions first. Only open a new source if the marked error identifies a specific gap.' },
  { id:'tracker', label:'I want to redesign the tracker', hint:'System-building instead of output', action:'No redesign before marked output. Log only the top 1–3 errors from the latest paper, then return to practice.' },
  { id:'backlog', label:'I need to clear the backlog', hint:'Lecture / recording binge', action:'Do a timed mini-set before playback. Watch only the exact segment that repairs a marked error; do not clear recordings for the sake of completion.' },
  { id:'reset', label:'I need a whole new plan', hint:'Fresh-start loop after a bad day', action:'One bad day does not earn a new strategy. Run the 60-minute recovery protocol and collect another data point.' },
  { id:'ai', label:'Ask AI to optimize everything', hint:'Optimization before evidence', action:'AI is useful after TEST. First produce one closed-book marked output; then use AI to diagnose or generate a fresh repair drill.' },
  { id:'organize', label:'I should organize files first', hint:'Control-seeking administration', action:'Close the folders. Open the current paper and start Question 1. File organization can wait until your output quota is complete.' },
  { id:'comparison', label:'Check what others are doing', hint:'Social comparison / reassurance', action:'Do not outsource your pace. Retest yesterday’s worst error family instead.' },
  { id:'help', label:'I should help/message someone now', hint:'Other people before your own block', action:'Capture the message as one line and postpone it. Complete your minimum academic output first, then help them.' },
  { id:'late', label:'I should stay up and catch up', hint:'Sleep traded for guilt relief', action:'Do not manufacture extra hours by damaging tomorrow. Stop at the planned hard limit, protect sleep, and resume with the next block.' },
  { id:'notes', label:'I should rewrite clean notes', hint:'Passive work disguised as study', action:'Do not rewrite the chapter. Extract one recall cue or error rule from the exact mistake, close the source, and reproduce it from memory.' },
  { id:'volume', label:'I need huge paper volume today', hint:'Unrealistic paper-count target', action:'A paper without marking and correction is mostly measurement. Finish one complete attempt → mark → diagnose → repair → reattempt cycle before adding another paper.' }
];
const EXAM_TIMELINE = [
  { id:'biology-1', subject:'biology', paper:'Biology I', start:'2026-08-10T13:00:00+05:30', end:'2026-08-10T15:00:00+05:30', date:'Mon · 10 Aug', time:'13:00–15:00' },
  { id:'biology-2', subject:'biology', paper:'Biology II', start:'2026-08-11T13:00:00+05:30', end:'2026-08-11T16:10:00+05:30', date:'Tue · 11 Aug', time:'13:00–16:10' },
  { id:'physics-1', subject:'physics', paper:'Physics I', start:'2026-08-14T08:30:00+05:30', end:'2026-08-14T10:30:00+05:30', date:'Fri · 14 Aug', time:'08:30–10:30' },
  { id:'physics-2', subject:'physics', paper:'Physics II', start:'2026-08-17T08:30:00+05:30', end:'2026-08-17T11:40:00+05:30', date:'Mon · 17 Aug', time:'08:30–11:40' },
  { id:'chemistry-1', subject:'chemistry', paper:'Chemistry I', start:'2026-08-19T08:30:00+05:30', end:'2026-08-19T10:30:00+05:30', date:'Wed · 19 Aug', time:'08:30–10:30' },
  { id:'chemistry-2', subject:'chemistry', paper:'Chemistry II', start:'2026-08-21T08:30:00+05:30', end:'2026-08-21T11:40:00+05:30', date:'Fri · 21 Aug', time:'08:30–11:40' },
  { id:'cgt', subject:'general', paper:'Common General Test', start:'2026-08-22T08:30:00+05:30', end:'2026-08-22T10:30:00+05:30', date:'Sat · 22 Aug', time:'08:30–10:30' },
  { id:'english-2', subject:'english', paper:'General English II', start:'2026-08-24T08:30:00+05:30', end:'2026-08-24T11:40:00+05:30', date:'Mon · 24 Aug', time:'08:30–11:40', optional:true },
  { id:'english-1', subject:'english', paper:'General English I', start:'2026-08-24T13:00:00+05:30', end:'2026-08-24T14:00:00+05:30', date:'Mon · 24 Aug', time:'13:00–14:00', optional:true }
];
const SYLLABUS_PLAN = [
  { id:'physics-12-measurements', subject:'physics', grade:'12', name:'Measurements', periods:30 },
  { id:'physics-12-mechanics', subject:'physics', grade:'12', name:'Mechanics', periods:110 },
  { id:'physics-12-waves', subject:'physics', grade:'12', name:'Waves & Oscillations', periods:100 },
  { id:'physics-12-thermal', subject:'physics', grade:'12', name:'Thermal Physics', periods:60 },
  { id:'physics-13-gravity', subject:'physics', grade:'13', name:'Gravitational Field', periods:20 },
  { id:'physics-13-electrostatic', subject:'physics', grade:'13', name:'Electrostatic Field', periods:45 },
  { id:'physics-13-magnetic', subject:'physics', grade:'13', name:'Magnetic Field', periods:40 },
  { id:'physics-13-current', subject:'physics', grade:'13', name:'Current Electricity', periods:70 },
  { id:'physics-13-electronics', subject:'physics', grade:'13', name:'Electronics', periods:40 },
  { id:'physics-13-matter-properties', subject:'physics', grade:'13', name:'Properties of Matter', periods:40 },
  { id:'physics-13-radiation', subject:'physics', grade:'13', name:'Matter & Radiation', periods:30 },
  { id:'physics-13-unallocated', subject:'physics', grade:'13', name:'Unallocated / practical work in source budget', periods:15, reconciled:true },

  { id:'chemistry-12-01', subject:'chemistry', grade:'12', name:'01 · Atomic Structure', periods:35 },
  { id:'chemistry-12-02', subject:'chemistry', grade:'12', name:'02 · Structure & Bonding', periods:35 },
  { id:'chemistry-12-03', subject:'chemistry', grade:'12', name:'03 · Chemical Calculations', periods:37 },
  { id:'chemistry-12-04', subject:'chemistry', grade:'12', name:'04 · Gaseous State of Matter', periods:32 },
  { id:'chemistry-12-05', subject:'chemistry', grade:'12', name:'05 · Energetics', periods:41 },
  { id:'chemistry-12-06', subject:'chemistry', grade:'12', name:'06 · Chemistry of s, p and d Block Elements', periods:64 },
  { id:'chemistry-12-07', subject:'chemistry', grade:'12', name:'07 · Basic Concepts of Organic Chemistry', periods:17 },
  { id:'chemistry-12-08', subject:'chemistry', grade:'12', name:'08 · Hydrocarbons & Halo-hydrocarbons', periods:46 },
  { id:'chemistry-12-09', subject:'chemistry', grade:'12', name:'09 · Oxygen-containing Organic Compounds', periods:46 },
  { id:'chemistry-12-10', subject:'chemistry', grade:'12', name:'10 · Nitrogen-containing Organic Compounds', periods:14 },
  { id:'chemistry-13-11', subject:'chemistry', grade:'13', name:'11 · Chemical Kinetics', periods:41 },
  { id:'chemistry-13-12', subject:'chemistry', grade:'13', name:'12 · Equilibrium', periods:94 },
  { id:'chemistry-13-13', subject:'chemistry', grade:'13', name:'13 · Electrochemistry', periods:33 },
  { id:'chemistry-13-14', subject:'chemistry', grade:'13', name:'14 · Industrial Chemistry & Environmental Pollution', periods:65 },

  { id:'biology-12-01', subject:'biology', grade:'12', name:'01 · Introduction to Biology', periods:5 },
  { id:'biology-12-02', subject:'biology', grade:'12', name:'02 · Chemical & Cellular Basis of Life', periods:85 },
  { id:'biology-12-03', subject:'biology', grade:'12', name:'03 · Evolution & Diversity of Organisms', periods:61 },
  { id:'biology-12-04', subject:'biology', grade:'12', name:'04 · Plant Form & Function', periods:80 },
  { id:'biology-12-13-05', subject:'biology', grade:'12–13', name:'05 · Animal Form & Function', periods:193 },
  { id:'biology-13-06', subject:'biology', grade:'13', name:'06 · Genetics', periods:22 },
  { id:'biology-13-07', subject:'biology', grade:'13', name:'07 · Molecular Biology & Recombinant DNA Technology', periods:42 },
  { id:'biology-13-08', subject:'biology', grade:'13', name:'08 · Environmental Biology', periods:41 },
  { id:'biology-13-09', subject:'biology', grade:'13', name:'09 · Microbiology', periods:50 },
  { id:'biology-13-10', subject:'biology', grade:'13', name:'10 · Applied Biology', periods:24 }
];
const DEFAULT_FOCUS_MINUTES = 90;
let timerPresetMinutes = DEFAULT_FOCUS_MINUTES;

function snapshotState(label = 'manual') {
  if (DEMO_MODE) return;
  try {
    if (!localStorage.getItem(RECOVERY_KEY) && localStorage.getItem(V4_RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, localStorage.getItem(V4_RECOVERY_KEY));
    if (!localStorage.getItem(RECOVERY_KEY) && localStorage.getItem(PREVIOUS_POWERHOUSE_RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, localStorage.getItem(PREVIOUS_POWERHOUSE_RECOVERY_KEY));
    if (!localStorage.getItem(RECOVERY_KEY) && localStorage.getItem(PREVIOUS_RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, localStorage.getItem(PREVIOUS_RECOVERY_KEY));
    const snapshots = JSON.parse(localStorage.getItem(RECOVERY_KEY) || '[]');
    snapshots.unshift({ id: uid(), at: new Date().toISOString(), label, state: JSON.parse(JSON.stringify(state)) });
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(snapshots.slice(0, 12)));
  } catch (_) {}
}

function recoveryCount() {
  try {
    if (!localStorage.getItem(RECOVERY_KEY) && localStorage.getItem(V4_RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, localStorage.getItem(V4_RECOVERY_KEY));
    if (!localStorage.getItem(RECOVERY_KEY) && localStorage.getItem(PREVIOUS_POWERHOUSE_RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, localStorage.getItem(PREVIOUS_POWERHOUSE_RECOVERY_KEY));
    if (!localStorage.getItem(RECOVERY_KEY) && localStorage.getItem(PREVIOUS_RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, localStorage.getItem(PREVIOUS_RECOVERY_KEY));
    return JSON.parse(localStorage.getItem(RECOVERY_KEY) || '[]').length || 0; }
  catch (_) { return 0; }
}

function legacyRatings() {
  if (DEMO_MODE) return {};
  try { return JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}') || {}; } catch (_) { return {}; }
}

function defaultState() {
  return PowerhouseCore.normalizeState(null, { legacyRatings: legacyRatings() }).state;
}

/**
 * Loads the newest available record, migrating older keys forward. Every record
 * passes through PowerhouseCore.normalizeState, so malformed or hostile data is
 * repaired or dropped before anything renders. Older keys are never modified.
 */
function loadState() {
  if (DEMO_MODE) return PowerhouseCore.buildDemoState(todayISO());
  try {
    const raw = localStorage.getItem(APP_KEY)
      || localStorage.getItem(V4_APP_KEY)
      || localStorage.getItem(PREVIOUS_POWERHOUSE_APP_KEY)
      || localStorage.getItem(PREVIOUS_APP_KEY)
      || localStorage.getItem(OLDER_APP_KEY)
      || localStorage.getItem(OLDEST_APP_KEY)
      || localStorage.getItem(VERY_OLD_APP_KEY)
      || 'null';
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return defaultState();
    const { state: migrated, report } = PowerhouseCore.normalizeState(saved, { legacyRatings: legacyRatings() });
    if (Object.keys(report.dropped).length) console.warn('[Powerhouse] Skipped invalid stored records:', report.dropped);
    if (!localStorage.getItem(APP_KEY)) {
      try {
        const sourceKey = localStorage.getItem(V4_APP_KEY) ? V4_APP_KEY : (localStorage.getItem(PREVIOUS_POWERHOUSE_APP_KEY) ? PREVIOUS_POWERHOUSE_APP_KEY : null);
        if (sourceKey) {
          const sourceState = JSON.parse(localStorage.getItem(sourceKey) || 'null');
          const recovery = JSON.parse(localStorage.getItem(RECOVERY_KEY) || '[]');
          const baselineId = uid();
          recovery.unshift({ id: baselineId, at: new Date().toISOString(), label: `pre-v5-migration:${sourceKey}`, sourceKey, state: sourceState });
          localStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery.slice(0, 12)));
          migrated.migration = { ...migrated.migration, sourceVersion: String(sourceState?.productVersion || sourceKey).slice(0, 80), migratedAt: new Date().toISOString(), baselineSnapshotId: baselineId };
        }
        localStorage.setItem(APP_KEY, JSON.stringify(migrated));
      } catch (_) {}
    }
    return migrated;
  } catch (_) { return defaultState(); }
}

const todayISO = () => PowerhouseCore.zonedToday('Asia/Colombo');
const { addDays, dateDiffDays, escapeHTML } = PowerhouseCore;
const uid = () => PowerhouseCore.makeId();

let state = loadState();
let activePanel = 'command';
let focusTopicKey = '';
let timerRemaining = DEFAULT_FOCUS_MINUTES * 60;
let timerHandle = null;
let timerDeadline = null;
let focusRecommendedMinutes = DEFAULT_FOCUS_MINUTES;
let focusCustomLabel = '';
let plannerUnfinishedOnly = false;

const $ = (id) => document.getElementById(id);
const topicKey = (subject, unitIndex, topicIndex) => `${subject}|${unitIndex}|${topicIndex}`;
const titleCase = (value) => value ? value[0].toUpperCase() + value.slice(1) : '';
function saveState() {
  if (DEMO_MODE) return true;
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
    return true;
  } catch (_) {
    toast('Progress could not be saved. Export a backup before closing.');
    return false;
  }
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function allTopics(subjectFilter) {
  const rows = [];
  SUBJECTS.filter(s => !subjectFilter || s === subjectFilter).forEach(subject => {
    SYL[subject].units.forEach((unit, ui) => unit.t.forEach((name, ti) => rows.push({
      key: topicKey(subject, ui, ti), subject, unitIndex: ui, topicIndex: ti, unit: unit.n, name
    })));
  });
  return rows;
}

function getTopic(key) {
  const [subject, ui, ti] = String(key || '').split('|');
  const unit = SYL[subject]?.units?.[Number(ui)];
  const name = unit?.t?.[Number(ti)];
  return name == null ? null : { key, subject, unitIndex: Number(ui), topicIndex: Number(ti), unit: unit.n, name };
}

function attemptsFor(subject) {
  return state.attempts.filter(a => !subject || a.subject === subject);
}

function subjectStats(subject) {
  const attempts = attemptsFor(subject);
  const earned = attempts.reduce((n, a) => n + Number(a.earned || 0), 0);
  const totalMarks = attempts.reduce((n, a) => n + Number(a.total || 0), 0);
  const tested = new Set(attempts.map(a => a.topicKey)).size;
  const totalTopics = allTopics(subject).length;
  const rated = allTopics(subject).filter(t => state.ratings[t.key]).length;
  return { attempts: attempts.length, earned, totalMarks, accuracy: totalMarks ? Math.round(earned / totalMarks * 100) : null, tested, totalTopics, rated };
}

function planProgress(id) {
  const value = Number(state.syllabusProgress?.[id] || 0);
  return [0, 25, 50, 75, 100].includes(value) ? value : 0;
}

function plannerStats(subject) {
  const rows = SYLLABUS_PLAN.filter(row => !subject || row.subject === subject);
  const total = rows.reduce((sum, row) => sum + row.periods, 0);
  const done = rows.reduce((sum, row) => sum + row.periods * planProgress(row.id) / 100, 0);
  const finished = rows.filter(row => planProgress(row.id) === 100).length;
  return { total, done, remaining: total - done, finished, units: rows.length, pct: total ? Math.round(done / total * 100) : 0 };
}

function renderPlanner() {
  const overall = plannerStats();
  const unfinished = SYLLABUS_PLAN
    .filter(row => planProgress(row.id) < 100)
    .map(row => ({ ...row, remaining: row.periods * (100 - planProgress(row.id)) / 100 }))
    .sort((a, b) => b.remaining - a.remaining)[0];
  $('planner-headline').textContent = `${overall.pct}% period-weighted coverage`;
  $('planner-done-periods').textContent = Math.round(overall.done);
  $('planner-remaining-periods').textContent = Math.round(overall.remaining);
  $('planner-finished-units').textContent = `${overall.finished}/${overall.units}`;
  $('planner-next-block').textContent = unfinished ? `${Math.round(unfinished.remaining)}p` : 'Done';

  $('planner-subjects').innerHTML = SUBJECTS.map(subject => {
    const stats = plannerStats(subject);
    const color = `var(--${SYL[subject].abbr})`;
    return `<article class="planner-subject"><div class="planner-subject-top"><strong style="color:${color}">${titleCase(subject)}</strong><b style="color:${color}">${stats.pct}%</b></div><div class="bar-track"><div class="bar-fill" style="width:${stats.pct}%;background:${color}"></div></div><small><span>${Math.round(stats.done)}/${stats.total} period-equivalent</span><span>${stats.finished}/${stats.units} units</span></small></article>`;
  }).join('');

  const subjectFilter = $('planner-subject-filter').value;
  const gradeFilter = $('planner-grade-filter').value;
  $('planner-list').innerHTML = SYLLABUS_PLAN.map(row => {
    const value = planProgress(row.id);
    const visible = (subjectFilter === 'all' || row.subject === subjectFilter)
      && (gradeFilter === 'all' || row.grade === gradeFilter)
      && (!plannerUnfinishedOnly || value < 100);
    return `<div class="plan-row${visible ? '' : ' filtered-out'}" data-plan-row="${row.id}">
      <div><div class="plan-name" style="color:var(--${SYL[row.subject].abbr})">${escapeHTML(row.name)}</div><div class="plan-meta">${titleCase(row.subject)} · Grade ${row.grade}${row.reconciled ? ' · transparent reconciliation item' : ''}</div></div>
      <div class="plan-periods">${row.periods} periods</div>
      <select class="plan-progress" data-plan-progress="${row.id}" aria-label="Progress for ${escapeHTML(row.name)}">
        <option value="0"${value === 0 ? ' selected' : ''}>0% · Not started</option>
        <option value="25"${value === 25 ? ' selected' : ''}>25% · Started</option>
        <option value="50"${value === 50 ? ' selected' : ''}>50% · In progress</option>
        <option value="75"${value === 75 ? ' selected' : ''}>75% · Mostly done</option>
        <option value="100"${value === 100 ? ' selected' : ''}>100% · Finished</option>
      </select>
    </div>`;
  }).join('');
}

function pendingRetests() {
  return state.retests.filter(r => !r.completedAt).sort((a, b) => a.due.localeCompare(b.due));
}

function isTopicDue(key) {
  return pendingRetests().some(r => r.topicKey === key && r.due <= todayISO());
}

function topicAttemptStats(key) {
  const attempts = state.attempts.filter(a => a.topicKey === key);
  const earned = attempts.reduce((n, a) => n + Number(a.earned || 0), 0);
  const total = attempts.reduce((n, a) => n + Number(a.total || 0), 0);
  return { count: attempts.length, accuracy: total ? Math.round(earned / total * 100) : null, lost: Math.max(0, total - earned) };
}

function priorityTopics(limit = 8) {
  return allTopics().map(topic => {
    const stats = topicAttemptStats(topic.key);
    const rating = Number(state.ratings[topic.key] || 0);
    const recurringErrors = state.attempts.filter(a => a.topicKey === topic.key && a.error).length;
    const confidenceTraps = state.attempts.filter(a => a.topicKey === topic.key && a.confidence === 'high' && Number(a.earned) < Number(a.total)).length;
    const due = pendingRetests().filter(r => r.topicKey === topic.key && r.due <= todayISO()).length;
    const score = (rating === 1 ? 5 : rating === 2 ? 2 : 0) + Math.min(stats.lost, 10) + recurringErrors * 2 + confidenceTraps * 3 + due * 5;
    return { ...topic, ...stats, rating, score, due, confidenceTraps };
  }).filter(t => t.score > 0).sort((a, b) => b.score - a.score || b.lost - a.lost).slice(0, limit);
}



function markedAttemptsOn(date) { return state.attempts.filter(a => a.date === date); }
function hasMarkedOutputToday() { return markedAttemptsOn(todayISO()).length > 0; }
function courseState() { return state.courseCorrection || (state.courseCorrection = defaultState().courseCorrection); }
function lastNDates(n) { return Array.from({length:n}, (_,i) => addDays(todayISO(), -i)); }
function attemptsInLastDays(n) { const floor = addDays(todayISO(), -(n-1)); return state.attempts.filter(a => a.date >= floor && a.date <= todayISO()); }
function retestsCompletedInLastDays(n) { const floor = addDays(todayISO(), -(n-1)); return state.retests.filter(r => r.completedAt && r.completedAt >= floor && r.completedAt <= todayISO()); }
function errorCounts(attempts) {
  const counts = {};
  attempts.forEach(a => { if (a.error) counts[a.error] = (counts[a.error] || 0) + 1; });
  return counts;
}
function repeatedErrorSignal() {
  const counts = errorCounts(attemptsInLastDays(7));
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  return sorted[0] ? { code: sorted[0][0], count: sorted[0][1] } : null;
}
function courseCorrectionForError(code) {
  const map = {
    K:'Targeted official-source lookup, then three fresh closed-book questions. Do not reopen the whole chapter.',
    R:'Increase spaced retrieval. Short closed-book recalls on Day 1/3/7 beat another passive reread.',
    C:'Explain the concept from first principles, then solve varied questions that force model discrimination.',
    M:'Drill method selection and setup. Mix structurally similar problems so you cannot memorize one template.',
    P:'Use the official scheme language. Rewrite one answer to scheme-perfect form, then reproduce it without looking.',
    T:'Train selection and pacing under a hard time cap. Do not fix timing by learning more theory.',
    A:'Slow the first read, identify the exact required quantity/command word, and build a final 30-second checking rule.',
    G:'Treat the correct guess as unmastered. Use a fresh question and justify the answer before seeing the options/solution.'
  };
  return map[code] || 'Keep collecting clean evidence before changing strategy.';
}
function backupHealth() {
  if (!state.lastExportedAt) return 'Due';
  const days = (Date.now() - new Date(state.lastExportedAt).getTime()) / 86400000;
  return days <= 7 ? 'Good' : 'Due';
}
function renderCourseCorrection() {
  if (!$('panel-course')) return;
  const cs = courseState();
  const today = todayISO();
  const attempts7 = attemptsInLastDays(7);
  const signal = repeatedErrorSignal();
  const overdue = pendingRetests().filter(r => r.due < today).length;
  const outputToday = hasMarkedOutputToday();
  const overrides7 = (cs.planningOverrides || []).filter(x => x.date >= addDays(today,-6)).length;

  $('discipline-mode').checked = cs.disciplineMode !== false;
  $('course-status-badge').textContent = cs.disciplineMode !== false ? 'LOCK' : 'OPEN';
  $('cc-output-today').textContent = outputToday ? 'Yes' : 'No';
  $('cc-overdue').textContent = overdue;
  $('cc-overrides').textContent = overrides7;
  $('cc-backup').textContent = backupHealth();
  $('target-date').value = cs.targetDate || '';

  if (!outputToday) {
    $('cc-verdict').textContent = 'Do not optimize the system yet. Produce one marked output first.';
    $('cc-reason').textContent = 'Your highest-return course correction today is execution: one closed-book block, strict marking, then the smallest repair. Planning before evidence is exactly the loop V3 is designed to interrupt.';
  } else if (overdue > 0) {
    $('cc-verdict').textContent = `Close ${overdue} overdue retest${overdue === 1 ? '' : 's'} before expanding the backlog.`;
    $('cc-reason').textContent = 'An old correction that has never survived delayed retrieval is still open. Closure outranks collecting another resource or starting another chapter.';
  } else if (signal && signal.count >= 3) {
    $('cc-verdict').textContent = `Targeted change justified: ${signal.code} · ${ERROR_NAMES[signal.code] || 'error'} repeated ${signal.count}×.`;
    $('cc-reason').textContent = courseCorrectionForError(signal.code);
  } else {
    $('cc-verdict').textContent = 'Stay the course. No strategy overhaul is earned by the current evidence.';
    $('cc-reason').textContent = 'Keep the loop boring and repeatable: attempt → mark → diagnose → repair → reattempt → retest. Wait for three repeated data points before changing the system.';
  }

  $('cc-status-pills').innerHTML = [
    `<span class="pill">${outputToday ? '✓ marked output today' : '○ output still needed'}</span>`,
    `<span class="pill">${overdue ? `${overdue} overdue retest${overdue===1?'':'s'}` : 'retests under control'}</span>`,
    `<span class="pill">${signal ? `${signal.code} top error · ${signal.count}×/7d` : 'no repeated error yet'}</span>`,
    `<span class="pill">backup ${backupHealth().toLowerCase()}</span>`
  ].join('');

  $('correction-rule-grid').innerHTML = COURSE_CORRECTION_RULES.map(rule => `<button type="button" class="correction-rule${['resource','tracker','reset','late'].includes(rule.id) ? ' hot' : ''}" data-correction-rule="${rule.id}"><strong>${escapeHTML(rule.label)}</strong><span>${escapeHTML(rule.hint)}</span></button>`).join('');

  const audit = cs.dailyAudits?.[today] || {};
  document.querySelectorAll('[data-audit]').forEach(box => box.checked = Boolean(audit[box.dataset.audit]));

  const activeDays = lastNDates(7).filter(day => markedAttemptsOn(day).length).length;
  const retests7 = retestsCompletedInLastDays(7).length;
  const subjectRows = SUBJECTS.map(subject => ({ subject, stats: subjectStatsForAttempts(subject, attempts7) })).filter(x => x.stats.totalMarks > 0).sort((a,b) => a.stats.accuracy - b.stats.accuracy);
  const weakSubject = subjectRows[0];
  const counts = errorCounts(attempts7);
  const topErrors = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([code,count]) => `${code} ${ERROR_NAMES[code] || ''} ×${count}`).join(' · ') || 'No repeated error family yet';
  const strategy = signal && signal.count >= 3 ? courseCorrectionForError(signal.code) : 'No redesign. Gather more evidence and keep closing current loops.';
  const rabbit7 = (cs.rabbitHoleEvents || []).filter(x => x.date >= addDays(today,-6));
  const rabbitCounts = {}; rabbit7.forEach(x => rabbitCounts[x.type] = (rabbitCounts[x.type] || 0) + 1);
  const topRabbit = Object.entries(rabbitCounts).sort((a,b)=>b[1]-a[1])[0];
  const topRabbitRule = topRabbit ? COURSE_CORRECTION_RULES.find(r => r.id === topRabbit[0]) : null;
  const auditToday = cs.dailyAudits?.[today] || {};
  const auditHits = Object.values(auditToday).filter(Boolean).length;
  $('cc-week-review').innerHTML = `
    <div class="week-row"><span class="label">Marked attempts</span><span class="value">${attempts7.length} attempts across ${activeDays}/7 evidence days.</span></div>
    <div class="week-row"><span class="label">Retests closed</span><span class="value">${retests7} delayed retrieval checks completed.</span></div>
    <div class="week-row"><span class="label">Top error families</span><span class="value">${escapeHTML(topErrors)}</span></div>
    <div class="week-row"><span class="label">Weakest verified subject</span><span class="value">${weakSubject ? `${titleCase(weakSubject.subject)} · ${weakSubject.stats.accuracy}% over ${weakSubject.stats.attempts} attempts` : 'Not enough marked evidence yet.'}</span></div>
    <div class="week-row"><span class="label">Top rabbit hole</span><span class="value">${topRabbitRule ? `${escapeHTML(topRabbitRule.label)} · ${topRabbit[1]} trigger${topRabbit[1]===1?'':'s'}` : 'No interceptor events logged in the last 7 days.'}</span></div>
    <div class="week-row"><span class="label">Today’s discipline</span><span class="value">${Object.keys(auditToday).length ? `${auditHits}/5 checks protected` : 'Audit not saved yet.'}</span></div>
    <div class="week-row"><span class="label">Course correction</span><span class="value">${escapeHTML(strategy)}</span></div>`;
  $('cc-three-point-rule').textContent = signal && signal.count >= 3 ? `${signal.code} has repeated ${signal.count} times in the last 7 days. A targeted change is justified: ${courseCorrectionForError(signal.code)}` : 'No single error mechanism has repeated 3 times in the last 7 days. Do not redesign the strategy yet.';

  const plannerBanner = $('planner-lock-banner');
  if (plannerBanner) plannerBanner.classList.toggle('show', cs.disciplineMode !== false && !outputToday);
}
function subjectStatsForAttempts(subject, attempts) {
  const rows = attempts.filter(a => a.subject === subject);
  const earned = rows.reduce((n,a) => n + Number(a.earned || 0), 0);
  const totalMarks = rows.reduce((n,a) => n + Number(a.total || 0), 0);
  return { attempts:rows.length, earned, totalMarks, accuracy: totalMarks ? Math.round(earned/totalMarks*100) : null };
}
function triggerCourseCorrection(id) {
  const rule = COURSE_CORRECTION_RULES.find(r => r.id === id);
  if (!rule) return;
  $('cc-action-title').textContent = rule.label;
  $('cc-action-copy').textContent = rule.action;
  const cs = courseState();
  cs.rabbitHoleEvents.unshift({ id:uid(), type:id, at:new Date().toISOString(), date:todayISO() });
  cs.rabbitHoleEvents = cs.rabbitHoleEvents.slice(0,100);
  saveState();
  renderCourseCorrection();
}
function saveCourseAudit() {
  const cs = courseState();
  const row = {};
  document.querySelectorAll('[data-audit]').forEach(box => row[box.dataset.audit] = box.checked);
  cs.dailyAudits[todayISO()] = row;
  saveState(); renderCourseCorrection(); toast('Today’s five-point discipline audit saved.');
}
function saveTargetDate() {
  courseState().targetDate = $('target-date').value || '';
  saveState(); refreshAll(); toast(courseState().targetDate ? '2027 planning target saved.' : 'Planning target cleared.');
}
function startRescueMode() {
  const cs = courseState();
  cs.rescueRuns.unshift({ id:uid(), at:new Date().toISOString(), date:todayISO() });
  cs.rescueRuns = cs.rescueRuns.slice(0,50);
  saveState();
  startFocus(30, 'Recovery mode · closed-book attempt');
}

function dailyManualForDate(date) {
  const totals = blankDailyValues();
  state.dailyEntries.filter(entry => entry.date === date).forEach(entry => {
    SUBJECTS.forEach(subject => DAILY_FIELDS.forEach(field => {
      totals[subject][field.id] += Number(entry?.[subject]?.[field.id] || 0);
    }));
  });
  return totals;
}

function dailyEvidenceForDate(date) {
  const totals = blankDailyValues();
  state.attempts.filter(a => a.date === date).forEach(a => {
    const items = Math.max(1, Number(a.items || 1));
    if (a.type === 'mcq-set') totals[a.subject].mcqs += items;
    else if (a.type === 'structured-essay') totals[a.subject].structured += items;
    else if (a.type === 'essay') totals[a.subject].essays += items;
    else if (a.type === 'full-paper') totals[a.subject].fullPapers += 1;
  });
  state.retests.filter(r => r.completedAt === date).forEach(r => {
    const topic = getTopic(r.topicKey);
    if (topic?.subject && totals[topic.subject]) totals[topic.subject].retests += 1;
  });
  return totals;
}

function dailyCombinedForDate(date) {
  const manual = dailyManualForDate(date);
  const evidence = dailyEvidenceForDate(date);
  const out = blankDailyValues();
  SUBJECTS.forEach(subject => DAILY_FIELDS.forEach(field => {
    out[subject][field.id] = Number(manual[subject][field.id] || 0) + Number(evidence[subject][field.id] || 0);
  }));
  return { totals: out, manual, evidence };
}

function dailyTargetCompletion(date) {
  const { totals } = dailyCombinedForDate(date);
  let hit = 0, target = 0;
  SUBJECTS.forEach(subject => DAILY_FIELDS.forEach(field => {
    const t = Number(state.dailyTargets?.[subject]?.[field.id] || 0);
    if (t > 0) {
      target += 1;
      hit += Math.min(1, Number(totals[subject][field.id] || 0) / t);
    }
  }));
  return target ? Math.round(hit / target * 100) : null;
}

function dayHasOutput(date) {
  const { totals } = dailyCombinedForDate(date);
  return SUBJECTS.some(subject => DAILY_FIELDS.some(field => Number(totals[subject][field.id] || 0) > 0));
}

function currentOutputStreak() {
  let streak = 0;
  let iso = todayISO();
  while (streak < 365) {
    if (!dayHasOutput(iso)) break;
    streak += 1;
    iso = addDays(iso, -1);
  }
  return streak;
}

function renderDailyInputGrid() {
  const grid = $('daily-input-grid');
  if (!grid || grid.dataset.ready === '1') return;
  grid.innerHTML = SUBJECTS.map(subject => `<article class="daily-subject-card">
    <h4 style="color:var(--${SYL[subject].abbr})">${titleCase(subject)}</h4>
    <div class="daily-field-grid">${DAILY_FIELDS.map(field => `<div class="daily-mini-field">
      <label for="daily-${subject}-${field.id}">${field.label}</label>
      <input id="daily-${subject}-${field.id}" data-daily-input="${subject}|${field.id}" type="number" min="0" max="999" step="1" value="0">
    </div>`).join('')}</div>
  </article>`).join('');
  grid.dataset.ready = '1';
}

function renderDailyTargetGrid() {
  const grid = $('daily-target-grid');
  if (!grid) return;
  grid.innerHTML = SUBJECTS.map(subject => `<article class="daily-subject-card">
    <h4 style="color:var(--${SYL[subject].abbr})">${titleCase(subject)}</h4>
    <div class="daily-field-grid">${DAILY_FIELDS.map(field => `<div class="daily-mini-field">
      <label for="target-${subject}-${field.id}">${field.label}</label>
      <input id="target-${subject}-${field.id}" data-daily-target="${subject}|${field.id}" type="number" min="0" max="999" step="1" value="${Number(state.dailyTargets?.[subject]?.[field.id] || 0)}">
    </div>`).join('')}</div>
  </article>`).join('');
}

function summarizeDailySubject(date, subject) {
  const { totals, manual, evidence } = dailyCombinedForDate(date);
  return DAILY_FIELDS.map(field => {
    const total = Number(totals[subject][field.id] || 0);
    const target = Number(state.dailyTargets?.[subject]?.[field.id] || 0);
    const pct = target > 0 ? Math.min(100, Math.round(total / target * 100)) : (total > 0 ? 100 : 0);
    const auto = Number(evidence[subject][field.id] || 0);
    const man = Number(manual[subject][field.id] || 0);
    return { ...field, total, target, pct, auto, man };
  });
}

function renderDailyOutput() {
  if (!$('panel-daily')) return;
  renderDailyInputGrid();
  renderDailyTargetGrid();
  if (!$('daily-date').value) $('daily-date').value = todayISO();

  const date = todayISO();
  const todayCombined = dailyCombinedForDate(date).totals;
  const totalOutputs = SUBJECTS.reduce((sum, subject) => sum + DAILY_FIELDS.reduce((s, field) => s + Number(todayCombined[subject][field.id] || 0), 0), 0);
  const completion = dailyTargetCompletion(date);
  let active = 0;
  for (let i = 0; i < 7; i++) active += dayHasOutput(addDays(date, -i)) ? 1 : 0;

  $('daily-target-score').textContent = completion == null ? 'Optional' : `${completion}%`;
  $('daily-output-count').textContent = totalOutputs;
  $('daily-active-days').textContent = `${active}/7`;
  $('daily-streak').textContent = `${currentOutputStreak()}d`;
  $('daily-today-badge').textContent = totalOutputs;
  $('daily-date-label').textContent = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
  $('daily-headline').textContent = completion == null ? (totalOutputs ? 'Output recorded. Close the highest-value error loop before chasing volume.' : 'Create one measurable output before adding more planning.') : completion >= 100 ? 'Targets hit. Protect quality; do not add work just to keep the counter moving.' : completion >= 60 ? 'Good output. Close the highest-value unfinished loop.' : 'Create one measurable output before adding more planning.';

  const list = $('daily-progress-list');
  list.innerHTML = SUBJECTS.map(subject => {
    const rows = summarizeDailySubject(date, subject);
    const subjectDone = rows.reduce((n, r) => n + (r.target > 0 ? Math.min(1, r.total / r.target) : 0), 0);
    const subjectTargets = rows.filter(r => r.target > 0).length;
    const anyOutput = rows.some(r => r.total > 0);
    const pct = subjectTargets ? Math.round(subjectDone / subjectTargets * 100) : (anyOutput ? 100 : 0);
    const displayPct = subjectTargets ? `${pct}%` : (anyOutput ? '✓' : '—');
    const detail = rows.filter(r => r.total > 0 || r.target > 0).map(r => `${r.label} ${r.total}${r.target > 0 ? `/${r.target}` : ''}`).join(' · ') || 'No target/output yet';
    return `<div class="daily-progress-row"><strong style="color:var(--${SYL[subject].abbr})">${titleCase(subject)}</strong><div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--${SYL[subject].abbr})"></div></div><small>${escapeHTML(detail)}</small></div><b>${displayPct}</b></div>`;
  }).join('');

  const entries = [...state.dailyEntries].sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.timestamp || '').localeCompare(a.timestamp || ''));
  $('daily-history-body').innerHTML = entries.length ? entries.slice(0, 120).map(entry => {
    const metric = subject => DAILY_FIELDS.filter(f => Number(entry?.[subject]?.[f.id] || 0) > 0).map(f => `${f.label}: ${Number(entry[subject][f.id])}`).join(' · ') || '—';
    return `<tr><td>${escapeHTML(entry.date)}</td><td class="daily-history-metrics">${escapeHTML(metric('physics'))}</td><td class="daily-history-metrics">${escapeHTML(metric('chemistry'))}</td><td class="daily-history-metrics">${escapeHTML(metric('biology'))}</td><td>${escapeHTML(entry.note || '')}</td><td><button class="daily-delete" type="button" data-delete-daily="${escapeHTML(entry.id)}">Delete</button></td></tr>`;
  }).join('') : '<tr><td colspan="6"><div class="empty-state">No manual daily-output entries yet. Evidence-derived activity still appears in today’s scoreboard automatically.</div></td></tr>';
}

function submitDailyOutput(event) {
  event.preventDefault();
  const entry = { id: uid(), date: $('daily-date').value, timestamp: new Date().toISOString(), note: $('daily-note').value.trim(), ...blankDailyValues() };
  let hasValue = false;
  document.querySelectorAll('[data-daily-input]').forEach(input => {
    const [subject, field] = input.dataset.dailyInput.split('|');
    const value = Math.max(0, Number(input.value || 0));
    entry[subject][field] = value;
    if (value > 0) hasValue = true;
  });
  if (!hasValue) { toast('Enter at least one completed output.'); return; }
  state.dailyEntries.push(entry);
  saveState();
  $('daily-form').reset();
  $('daily-date').value = todayISO();
  document.querySelectorAll('[data-daily-input]').forEach(input => input.value = 0);
  refreshAll();
  toast('Daily output saved locally.');
}

function saveDailyTargets() {
  const next = blankDailyValues();
  document.querySelectorAll('[data-daily-target]').forEach(input => {
    const [subject, field] = input.dataset.dailyTarget.split('|');
    next[subject][field] = Math.max(0, Number(input.value || 0));
  });
  state.dailyTargets = normalizeDailyTargets(next);
  saveState();
  renderDailyOutput();
  toast('Daily targets updated.');
}

function deleteDailyEntry(id) {
  const entry = state.dailyEntries.find(e => e.id === id);
  if (!entry || !confirm(`Delete this ${entry.date} daily-output entry?`)) return;
  state.dailyEntries = state.dailyEntries.filter(e => e.id !== id);
  saveState();
  renderDailyOutput();
  toast('Daily output deleted.');
}

function archiveDonatedTrackerPayload(payload, reason = 'Unmapped legacy tracker data') {
  try {
    const archive = JSON.parse(localStorage.getItem(DONATED_TRACKER_ARCHIVE_KEY) || '[]');
    archive.unshift({ id: uid(), at: new Date().toISOString(), reason, payload });
    localStorage.setItem(DONATED_TRACKER_ARCHIVE_KEY, JSON.stringify(archive.slice(0, 10)));
    state.legacyArchiveCount = archive.length;
  } catch (_) {}
}

function donatedTrackerRows(incoming) {
  if (Array.isArray(incoming?.dailyProgress)) return incoming.dailyProgress;
  if (Array.isArray(incoming?.daily_progress)) return incoming.daily_progress;
  if (Array.isArray(incoming?.progressData)) return incoming.progressData;
  if (Array.isArray(incoming?.progress_data)) return incoming.progress_data;
  if (Array.isArray(incoming) && incoming.some(row => row?.date)) return incoming;
  return [];
}

function mapDonatedTrackerToDaily(incoming) {
  const rows = donatedTrackerRows(incoming);
  if (!rows.length) return { imported:0, archived:false };

  const subjectNames = incoming?.examSettings?.subjectNames || incoming?.subjectNames || incoming?.exam_settings?.subject_names || {};
  const keyMap = {};
  Object.keys(subjectNames || {}).forEach(key => {
    const label = String(subjectNames[key] || '').toLowerCase();
    if (label.includes('physics')) keyMap[key] = 'physics';
    else if (label.includes('chem')) keyMap[key] = 'chemistry';
    else if (label.includes('bio')) keyMap[key] = 'biology';
  });
  ['physics','chemistry','biology'].forEach(key => keyMap[key] ||= key);

  // Never silently discard a populated subject from a legacy tracker.
  // If old keys such as ICT/Math are present and their labels do not tell us
  // whether they correspond to Chemistry/Biology, preserve the payload intact
  // for a later explicit mapping instead of partially importing it.
  const metaKeys = new Set(['date','entryId','timestamp','id','created_at','updated_at','user_id','progress_data','progressData']);
  const unknownPopulated = new Set();
  rows.forEach(row => {
    const source = row.progress_data || row.progressData || row;
    Object.entries(source || {}).forEach(([key, value]) => {
      if (metaKeys.has(key) || keyMap[key] || typeof value !== 'object' || value == null) return;
      const total = Object.values(value).reduce((sum, n) => sum + (Number(n) || 0), 0);
      if (total > 0) unknownPopulated.add(key);
    });
  });
  if (unknownPopulated.size) {
    archiveDonatedTrackerPayload(incoming, `Subject mapping required for: ${[...unknownPopulated].join(', ')}`);
    return { imported:0, archived:true };
  }

  let imported = 0;
  rows.forEach(row => {
    const source = row.progress_data || row.progressData || row;
    const entry = { id: uid(), date: row.date || source.date || todayISO(), timestamp: row.created_at || row.timestamp || new Date().toISOString(), note:'Imported legacy tracker', ...blankDailyValues() };
    let changed = false;
    Object.entries(keyMap).forEach(([oldKey, subject]) => {
      const values = source?.[oldKey];
      if (!values || typeof values !== 'object') return;
      const candidates = {
        mcqs: Number(values.mcqs || 0),
        structured: Number(values.structured || values.structuredQuestions || 0),
        essays: Number(values.essays || 0),
        fullPapers: Number(values.fullPapers || values.full_papers || 0),
        retests: Number(values.retests || 0)
      };
      DAILY_FIELDS.forEach(field => {
        const n = Math.max(0, Number(candidates[field.id] || 0));
        entry[subject][field.id] += n;
        if (n > 0) changed = true;
      });
    });
    if (changed) { state.dailyEntries.push(entry); imported += 1; }
  });

  if (!imported) {
    archiveDonatedTrackerPayload(incoming, 'No safely mappable Bio/Chem/Physics output fields');
    return { imported:0, archived:true };
  }
  return { imported, archived:false };
}

function navigate(panel) {
  if (panel === 'planner' && courseState().disciplineMode !== false && !hasMarkedOutputToday()) {
    const override = confirm(`Execution Lock: no marked attempt has been logged today. Syllabus planning is secondary to output.\n\nPress Cancel to return to Command and produce evidence. Press OK only if you intentionally need a one-time planning override.`);
    if (!override) { panel = 'command'; toast('Planner stayed locked. Produce one marked output first.'); }
    else {
      courseState().planningOverrides.unshift({ id:uid(), date:todayISO(), at:new Date().toISOString() });
      courseState().planningOverrides = courseState().planningOverrides.slice(0,100);
      saveState(); toast('One-time planning override recorded. Keep it brief.');
    }
  }
  activePanel = panel;
  document.querySelectorAll('#app-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));
  document.querySelectorAll('main > .content').forEach(c => c.classList.toggle('active', c.id === `panel-${panel}`));
  if (panel === 'course') renderCourseCorrection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildSubjectPanel(subject) {
  const target = $(`panel-${subject}`);
  target.innerHTML = `
    <div class="subject-summary" id="summary-${subject}"></div>
    <div class="subject-toolbar">
      <input class="search-box" id="search-${subject}" type="search" placeholder="Search ${titleCase(subject)} topics…" aria-label="Search ${titleCase(subject)} topics">
      <select class="filter-select" id="filter-${subject}" aria-label="Filter topics"><option value="all">All topics</option><option value="weak">Weak / medium</option><option value="evidence">Has evidence</option><option value="untested">Untested</option><option value="due">Retest due</option></select>
      <button class="secondary-btn" type="button" data-expand-subject="${subject}">Expand all</button>
    </div>
    <div id="units-${subject}"></div>
    <p class="muted" style="font-size:9px;line-height:1.6;margin:14px 4px">Scope note: this topic index is inherited from the supplied file. Cross-check it against the current official Sri Lankan syllabus before treating it as exhaustive.</p>`;

  const units = $(`units-${subject}`);
  SYL[subject].units.forEach((unit, ui) => {
    const wrap = document.createElement('div');
    wrap.className = 'unit-wrap';
    wrap.innerHTML = `<div class="unit-hdr" data-unit-header role="button" tabindex="0" aria-expanded="false">
      <span class="u-num">${String(ui + 1).padStart(2, '0')}</span><span class="u-name" style="color:${SYL[subject].color}">${escapeHTML(unit.n)}</span><span class="u-pct" id="unit-stat-${subject}-${ui}">—</span><span class="u-arr">▶</span></div>
      <div class="topics-list" data-unit-list></div>`;
    const list = wrap.querySelector('[data-unit-list]');
    unit.t.forEach((name, ti) => {
      const key = topicKey(subject, ui, ti);
      const row = document.createElement('div');
      row.className = 'topic-row';
      row.dataset.topicKey = key;
      row.dataset.search = `${unit.n} ${name}`.toLowerCase();
      row.innerHTML = `<span class="t-name">${escapeHTML(name)}</span><span class="t-evidence" data-evidence-for="${key}"></span><div class="r-grp" aria-label="Recall rating for ${escapeHTML(name)}">
        <button class="r-btn" type="button" data-rating="1" data-topic="${key}" title="Weak: cannot reproduce reliably">W</button>
        <button class="r-btn" type="button" data-rating="2" data-topic="${key}" title="Medium: partial or prompted recall">M</button>
        <button class="r-btn" type="button" data-rating="3" data-topic="${key}" title="Strong self-rating; verify with timed evidence">S</button>
      </div><button class="log-mini" type="button" data-log-topic="${key}">Log attempt</button>`;
      list.appendChild(row);
    });
    units.appendChild(wrap);
  });

  target.addEventListener('click', event => {
    const header = event.target.closest('[data-unit-header]');
    if (header) toggleUnit(header);
    const ratingButton = event.target.closest('[data-rating]');
    if (ratingButton) setRating(ratingButton.dataset.topic, Number(ratingButton.dataset.rating));
    const logButton = event.target.closest('[data-log-topic]');
    if (logButton) openAttemptDialog(logButton.dataset.logTopic);
    const expandButton = event.target.closest('[data-expand-subject]');
    if (expandButton) {
      const lists = target.querySelectorAll('[data-unit-list]');
      const shouldOpen = [...lists].some(l => !l.classList.contains('open'));
      lists.forEach(l => l.classList.toggle('open', shouldOpen));
      target.querySelectorAll('[data-unit-header]').forEach(h => { h.classList.toggle('open', shouldOpen); h.setAttribute('aria-expanded', shouldOpen); });
      expandButton.textContent = shouldOpen ? 'Collapse all' : 'Expand all';
    }
  });
  target.addEventListener('keydown', event => {
    const header = event.target.closest('[data-unit-header]');
    if (header && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggleUnit(header); }
  });
  $(`search-${subject}`).addEventListener('input', () => filterSubject(subject));
  $(`filter-${subject}`).addEventListener('change', () => filterSubject(subject));
}

function toggleUnit(header) {
  const list = header.nextElementSibling;
  const open = !list.classList.contains('open');
  list.classList.toggle('open', open);
  header.classList.toggle('open', open);
  header.setAttribute('aria-expanded', open);
}

function filterSubject(subject) {
  const query = $(`search-${subject}`).value.trim().toLowerCase();
  const mode = $(`filter-${subject}`).value;
  $(`panel-${subject}`).querySelectorAll('.topic-row').forEach(row => {
    const key = row.dataset.topicKey;
    const rating = Number(state.ratings[key] || 0);
    const stats = topicAttemptStats(key);
    const modeMatch = mode === 'all' || (mode === 'weak' && rating > 0 && rating < 3) || (mode === 'evidence' && stats.count) || (mode === 'untested' && !stats.count) || (mode === 'due' && isTopicDue(key));
    row.classList.toggle('filtered-out', !row.dataset.search.includes(query) || !modeMatch);
  });
  $(`panel-${subject}`).querySelectorAll('.unit-wrap').forEach(wrap => {
    const visible = wrap.querySelectorAll('.topic-row:not(.filtered-out)').length;
    wrap.classList.toggle('hidden', visible === 0);
    if ((query || mode !== 'all') && visible) {
      wrap.querySelector('[data-unit-list]').classList.add('open');
      wrap.querySelector('[data-unit-header]').classList.add('open');
    }
  });
}

function setRating(key, value) {
  state.ratings[key] === value ? delete state.ratings[key] : state.ratings[key] = value;
  saveState();
  refreshAll();
  if (value === 3 && !topicAttemptStats(key).count) toast('Strong is still unverified—prove it with a timed question.');
}

function updateSubjectPanel(subject) {
  const stats = subjectStats(subject);
  $(`summary-${subject}`).innerHTML = `<div><div class="eyebrow">${titleCase(subject)} evidence</div><strong>${stats.accuracy == null ? 'No verified score yet' : `${stats.accuracy}% verified accuracy`}</strong></div>
    <div class="mini-stat"><b>${stats.tested}/${stats.totalTopics}</b><span>topics tested</span></div><div class="mini-stat"><b>${stats.attempts}</b><span>attempts</span></div><div class="mini-stat"><b>${stats.rated}</b><span>self-rated</span></div>`;
  SYL[subject].units.forEach((unit, ui) => {
    const keys = unit.t.map((_, ti) => topicKey(subject, ui, ti));
    const attempts = state.attempts.filter(a => keys.includes(a.topicKey));
    const earned = attempts.reduce((n, a) => n + Number(a.earned), 0);
    const total = attempts.reduce((n, a) => n + Number(a.total), 0);
    const tested = new Set(attempts.map(a => a.topicKey)).size;
    const el = $(`unit-stat-${subject}-${ui}`);
    if (el) el.textContent = total ? `${Math.round(earned / total * 100)}% · ${tested}/${keys.length}` : `0/${keys.length} tested`;
  });
  $(`panel-${subject}`).querySelectorAll('[data-rating]').forEach(button => button.classList.toggle('on', Number(state.ratings[button.dataset.topic]) === Number(button.dataset.rating)));
  $(`panel-${subject}`).querySelectorAll('[data-evidence-for]').forEach(el => {
    const stats = topicAttemptStats(el.dataset.evidenceFor);
    el.innerHTML = `<span class="evidence-dot${stats.count ? ' has' : ''}"></span>${stats.count ? `${stats.accuracy}% · ${stats.count}×` : 'unverified'}`;
  });
}

function renderSubjectPulse() {
  $('subject-pulse').innerHTML = SUBJECTS.map(subject => {
    const s = subjectStats(subject);
    const plan = plannerStats(subject);
    const color = `var(--${SYL[subject].abbr})`;
    const coverage = s.totalTopics ? Math.round(s.tested / s.totalTopics * 100) : 0;
    return `<article class="subject-card" data-jump="${subject}" role="button" tabindex="0"><div class="subject-top"><span class="subject-name" style="color:${color}">${titleCase(subject)}</span><span class="subject-score" style="color:${color}">${s.accuracy == null ? '—' : `${s.accuracy}%`}</span></div><div class="subject-meta"><span>${s.tested}/${s.totalTopics} tested</span><span>${plan.pct}% syllabus plan</span></div><div class="bar-track"><div class="bar-fill" style="width:${coverage}%;background:${color}"></div></div></article>`;
  }).join('');
}

function renderKPIs() {
  const all = state.attempts;
  const earned = all.reduce((n, a) => n + Number(a.earned || 0), 0);
  const total = all.reduce((n, a) => n + Number(a.total || 0), 0);
  const trustedRows = all.filter(a => a.trustedEarned !== null && a.trustedEarned !== undefined && a.trustedEarned !== '');
  const trustedEarned = trustedRows.reduce((n,a) => n + Number(a.trustedEarned || 0), 0);
  const trustedTotal = trustedRows.reduce((n,a) => n + Number(a.total || 0), 0);
  const sevenDaysAgo = addDays(todayISO(), -6);
  const paperOutput = all.filter(a => a.date >= sevenDaysAgo && ['paper-section', 'full-paper'].includes(a.type)).length;
  const evidenceDays = new Set(all.filter(a => a.date >= sevenDaysAgo).map(a => a.date)).size;
  const targetDate = courseState().targetDate;
  $('kpi-accuracy').textContent = total ? `${Math.round(earned / total * 100)}%` : '—';
  $('kpi-trusted').textContent = trustedTotal ? `${Math.round(trustedEarned / trustedTotal * 100)}%` : '—';
  $('kpi-tested').textContent = `${evidenceDays}/7`;
  $('kpi-due').textContent = pendingRetests().filter(r => r.due <= todayISO()).length;
  if (targetDate) {
    const days = dateDiffDays(todayISO(), targetDate);
    $('kpi-days').textContent = days > 0 ? `${days}d` : days === 0 ? 'Today' : 'Passed';
    $('kpi-exam-note').textContent = `Planning anchor · ${targetDate}`;
  } else {
    $('kpi-days').textContent = 'Unset';
    $('kpi-exam-note').textContent = 'Set only when a useful/official date exists';
  }
  $('kpi-paper-output').textContent = paperOutput;
  $('attempt-count').textContent = all.length;
}

function renderExamTimeline() {
  const targetDate = courseState().targetDate;
  if (targetDate) {
    const days = dateDiffDays(todayISO(), targetDate);
    $('exam-timeline-title').textContent = days > 0 ? `${days} days to your current 2027 planning anchor` : days === 0 ? 'Planning anchor is today' : 'Your saved planning anchor has passed';
    $('exam-timeline-summary').textContent = `Saved planning date: ${targetDate}. Update it whenever the official timetable or your campaign plan changes.`;
  } else {
    $('exam-timeline-title').textContent = 'Build the attempt that you want to sit.';
    $('exam-timeline-summary').textContent = 'V5 is aligned to your chosen A/L cycle. No unofficial countdown is loaded; execution evidence comes first.';
  }
}

function renderRetests() {
  const pending = pendingRetests();
  const completed = state.retests.filter(r => r.completedAt).length;
  const total = state.retests.length;
  $('retest-status').textContent = total ? `${completed}/${total} scheduled retrieval checks completed. Fresh questions only.` : 'Mastery requires fresh retrieval after time has passed.';
  const dueFirst = pending.filter(r => r.due <= addDays(todayISO(), 7)).slice(0, 6);
  $('retest-queue').innerHTML = dueFirst.length ? dueFirst.map(r => {
    const topic = getTopic(r.topicKey);
    if (!topic) return '';
    const overdue = r.due < todayISO();
    const dueText = overdue ? `${Math.floor((new Date(todayISO()) - new Date(r.due)) / 86400000)}d overdue` : r.due === todayISO() ? 'due today' : `due ${r.due}`;
    return `<div class="queue-item"><div><div class="queue-title">${escapeHTML(topic.name)}</div><div class="queue-meta">${titleCase(topic.subject)} · ${r.stage === 1 ? 'fresh-transfer check' : 'delayed stability check'}</div></div><button class="log-mini queue-due" data-retest-topic="${r.topicKey}" data-retest-id="${r.id}" data-retest-type="${r.stage === 1 ? 'fresh-transfer' : 'delayed-retest'}">${dueText}</button></div>`;
  }).join('') : '<div class="empty-state">No retests queued yet. Log a marked attempt with lost marks; the dashboard will schedule the 3-day and 7-day checks.</div>';
}

function renderErrors() {
  const lost = Object.fromEntries(Object.keys(ERROR_NAMES).map(k => [k, 0]));
  state.attempts.forEach(a => { if (a.error) lost[a.error] = (lost[a.error] || 0) + Math.max(0, Number(a.total) - Number(a.earned)); });
  const max = Math.max(1, ...Object.values(lost));
  $('error-bars').innerHTML = Object.entries(ERROR_NAMES).map(([key, name]) => `<div class="error-row"><span class="error-label"><b style="color:var(--gold)">${key}</b> · ${name}</span><span class="error-track"><span class="error-fill" style="display:block;width:${lost[key] / max * 100}%"></span></span><span class="error-count">${lost[key].toFixed(lost[key] % 1 ? 1 : 0)}</span></div>`).join('');
}

function renderPriorityTopics() {
  const priorities = priorityTopics(5);
  $('priority-topics').innerHTML = priorities.length ? priorities.map(t => `<div class="queue-item"><div><div class="queue-title">${escapeHTML(t.name)}</div><div class="queue-meta">${titleCase(t.subject)} · ${t.lost ? `${t.lost} marks lost` : 'self-rated weak'}${t.due ? ` · ${t.due} retest due` : ''}</div></div><button class="log-mini" data-priority-topic="${t.key}">Attack</button></div>`).join('') : '<div class="empty-state">No weak evidence yet. Complete one timed question, mark it strictly, then log the result.</div>';
}

function renderCalibration() {
  const traps = [...state.attempts]
    .filter(a => (a.confidence === 'high' && Number(a.earned) < Number(a.total)) || Number(a.guesses || 0) > 0)
    .sort((a, b) => (Number(b.guesses || 0) + Number(b.total) - Number(b.earned)) - (Number(a.guesses || 0) + Number(a.total) - Number(a.earned)))
    .slice(0, 4);
  $('calibration-risk').innerHTML = traps.length ? traps.map(a => {
    const topic = getTopic(a.topicKey);
    const lost = Number(a.total) - Number(a.earned);
    const guessNote = Number(a.guesses || 0) ? `${a.guesses} guessed/unsupported item${Number(a.guesses)===1?'':'s'}` : `expected correct · ${lost} mark${lost === 1 ? '' : 's'} lost`;
    return `<div class="queue-item"><div><div class="queue-title">${escapeHTML(topic?.name || a.question)}</div><div class="queue-meta">${titleCase(a.subject)} · ${guessNote} · ${a.error ? `${a.error} ${ERROR_NAMES[a.error]}` : 'uncategorised'}</div></div><button class="log-mini" data-calibration-topic="${escapeHTML(a.topicKey)}">Retest</button></div>`;
  }).join('') : '<div class="empty-state">No confidence trap recorded. Keep logging confidence before you mark—the dangerous errors are the ones that feel correct.</div>';
}

function attemptHTML(a, compact = false) {
  const topic = getTopic(a.topicKey);
  const pct = Math.round(Number(a.earned) / Number(a.total) * 100);
  const type = ATTEMPT_TYPE_NAMES[a.type] || ATTEMPT_TYPE_NAMES['topic-question'];
  const trusted = a.trustedEarned !== null && a.trustedEarned !== undefined && a.trustedEarned !== '' ? ` · trusted ${a.trustedEarned}/${a.total}` : '';
  if (compact) return `<div class="recent-item"><div class="queue-title">${escapeHTML(a.question)}</div><div class="queue-meta">${titleCase(a.subject)} · ${type} · ${escapeHTML(topic?.name || 'Topic')} · ${a.earned}/${a.total} (${pct}%)${trusted} · ${a.error ? `${a.error} ${ERROR_NAMES[a.error]}` : 'full credit'}</div></div>`;
  return `<tr><td class="mono">${escapeHTML(a.date)}</td><td>${escapeHTML(titleCase(a.subject))}</td><td>${escapeHTML(type)}</td><td><strong>${escapeHTML(a.question)}</strong><br><span class="muted">${escapeHTML(topic?.name || 'Unknown topic')}</span></td><td><span class="score-chip">${escapeHTML(`${a.earned}/${a.total} · ${pct}%${trusted}`)}</span></td><td>${escapeHTML(a.confidence)}</td><td>${a.error ? `<b style="color:var(--gold)">${escapeHTML(a.error)}</b> ${escapeHTML(ERROR_NAMES[a.error] || '')}` : '—'}</td><td><button class="log-mini" data-v5-edit-attempt="${escapeHTML(a.id)}">Edit</button> <button class="log-mini" data-delete-attempt="${escapeHTML(a.id)}">Delete</button></td></tr>`;
}

function renderAttempts() {
  const sorted = [...state.attempts].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  $('recent-attempts').innerHTML = sorted.length ? sorted.slice(0, 4).map(a => attemptHTML(a, true)).join('') : '<div class="empty-state">Your evidence ledger is empty. A completed, marked question is the first useful input.</div>';
  $('attempt-table-body').innerHTML = sorted.length ? sorted.map(a => attemptHTML(a)).join('') : '<tr><td colspan="8"><div class="empty-state">No completed attempts logged yet.</div></td></tr>';
}

function renderNextAction() {
  const overdue = pendingRetests().find(r => r.due <= todayISO());
  const priority = priorityTopics(1)[0];
  let topic = overdue ? getTopic(overdue.topicKey) : priority;
  focusTopicKey = topic?.key || '';
  focusCustomLabel = '';
  if (!hasMarkedOutputToday()) {
    focusRecommendedMinutes = 90;
    $('next-action-title').textContent = topic ? `First proof today: ${topic.name}` : 'First proof today: one honest timed attempt.';
    $('next-action-copy').textContent = 'Before planning, collecting or optimizing anything else, create one marked result. This is V5’s main execution guard.';
    $('next-action-meta').innerHTML = `<span class="pill">90-minute deep block</span><span class="pill">closed book</span><span class="pill">AI-free TEST</span><span class="pill">strict marking after</span>`;
  } else if (overdue && topic) {
    focusRecommendedMinutes = 30;
    $('next-action-title').textContent = `Close overdue retest: ${topic.name}`;
    $('next-action-copy').textContent = 'Use a fresh question. Recognition of the old answer does not count as retrieval.';
    $('next-action-meta').innerHTML = `<span class="pill">${titleCase(topic.subject)}</span><span class="pill">30-minute rescue/retest</span><span class="pill">fresh question</span><span class="pill">strict marking</span>`;
  } else if (topic) {
    focusRecommendedMinutes = 90;
    $('next-action-title').textContent = `Attack: ${topic.name}`;
    $('next-action-copy').textContent = 'This topic has the strongest current combination of lost marks, weak recall, recurrence or calibration risk. Repair it through output—not a lecture marathon.';
    $('next-action-meta').innerHTML = `<span class="pill">${titleCase(topic.subject)}</span><span class="pill">90-minute deep block</span><span class="pill">fresh questions</span><span class="pill">close the loop</span>`;
  } else {
    focusRecommendedMinutes = 90;
    $('next-action-title').textContent = 'Build the evidence base: one 90-minute block.';
    $('next-action-copy').textContent = 'The dashboard needs marked performance before it can diagnose your highest-return repair. Start with a current paper or targeted question set.';
    $('next-action-meta').innerHTML = '<span class="pill">90-minute deep block</span><span class="pill">closed book</span><span class="pill">strict marking</span>';
  }
  $('start-focus-btn').textContent = `Start ${focusRecommendedMinutes}-min block`;
}


function profileDisplayLine() {
  const line = String(state.profile?.line || '').trim();
  if (line) return line;
  const year = String(state.profile?.year || '2027').trim();
  const target = String(state.profile?.target || '').trim();
  return `${year} A/L Bio Science${target ? ` · ${target}` : ''} · evidence over guesswork`;
}

function refreshBackupHealth() {
  const el = $('backup-health');
  if (!el) return;
  el.classList.remove('good','warn','bad');
  const attempts = state.attempts.length;
  if (!state.lastExportedAt) {
    if (attempts >= 3) { el.textContent = 'Backup !'; el.classList.add('bad'); }
    else { el.textContent = attempts ? 'Backup new' : 'Backup —'; if (attempts) el.classList.add('warn'); }
    return;
  }
  const age = Math.max(0, Math.floor((Date.now() - new Date(state.lastExportedAt).getTime()) / 86400000));
  if (age <= 7) { el.textContent = 'Backup ✓'; el.classList.add('good'); }
  else if (age <= 14) { el.textContent = `Backup ${age}d`; el.classList.add('warn'); }
  else { el.textContent = 'Backup !'; el.classList.add('bad'); }
}

let shareSafeMode = false;
function toggleShareSafe() {
  shareSafeMode = !shareSafeMode;
  document.body.classList.toggle('share-safe', shareSafeMode);
  $('share-safe-btn')?.classList.toggle('on', shareSafeMode);
  $('share-safe-btn')?.setAttribute('aria-pressed', String(shareSafeMode));
  if (state?.v5Settings) { state.v5Settings.shareSafe = shareSafeMode; saveState(); }
  toast(shareSafeMode ? 'Share-safe mode ON. Personal performance is obscured.' : 'Share-safe mode OFF.');
}

function diagnosisHint(subject) {
  if (subject === 'physics') return '<b>Physics lens:</b> locate the first failure point — model/concept, equation choice, graph, sign/direction, algebra, units or assumption. Repair the first wrong decision, not only the final number.';
  if (subject === 'chemistry') return '<b>Chemistry lens:</b> separate memory failures (conditions, equations, observations) from reasoning failures (equilibrium, energetics, mechanisms, calculations). They need different repairs.';
  return '<b>Biology lens:</b> distinguish factual retrieval from statement discrimination and marking-scheme production. Check missing keywords, sequence, diagrams/labels and whether every required point was actually written.';
}

function refreshDiagnosisHint() {
  const el = $('attempt-diagnosis-hint');
  if (el) el.innerHTML = diagnosisHint($('attempt-subject')?.value || 'physics');
}

function repairIntelligence() {
  const cutoff = addDays(todayISO(), -29);
  const byTopic = new Map();
  const byError = Object.fromEntries(Object.keys(ERROR_NAMES).map(k => [k, 0]));
  let recentLost = 0;
  state.attempts.forEach(a => {
    const lost = Math.max(0, Number(a.total || 0) - Number(a.earned || 0));
    const unsupported = Math.max(0, Number(a.guesses || 0));
    if (a.date >= cutoff) recentLost += lost;
    if (a.error) byError[a.error] = (byError[a.error] || 0) + lost;
    if (!lost && !unsupported && !a.error) return;
    const row = byTopic.get(a.topicKey) || { topicKey:a.topicKey, lost:0, attempts:0, errorAttempts:0, highConfidence:0, guesses:0, latest:'', errors:{}, due:0, score:0 };
    row.lost += lost; row.attempts += 1; row.guesses += unsupported; row.latest = row.latest > a.date ? row.latest : a.date;
    if (a.error) { row.errorAttempts += 1; row.errors[a.error] = (row.errors[a.error] || 0) + 1; }
    if (a.confidence === 'high' && lost > 0) row.highConfidence += 1;
    byTopic.set(a.topicKey, row);
  });
  pendingRetests().forEach(r => { const row = byTopic.get(r.topicKey); if (row) row.due += r.due <= todayISO() ? 2 : 1; });
  const priorities = [...byTopic.values()].map(row => {
    const recurrence = Math.max(0, row.errorAttempts - 1);
    const recency = row.latest >= addDays(todayISO(), -14) ? 2 : 0;
    row.score = row.lost * 3 + recurrence * 5 + row.highConfidence * 4 + row.guesses * 1.5 + row.due * 4 + recency;
    row.dominantError = Object.entries(row.errors).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
    return row;
  }).sort((a,b)=>b.score-a.score);
  const totalRetests = state.retests.length;
  const completedRetests = state.retests.filter(r => r.completedAt).length;
  const dominant = Object.entries(byError).sort((a,b)=>b[1]-a[1])[0];
  return { recentLost, priorities, byError, dominant: dominant && dominant[1] > 0 ? dominant[0] : '', totalRetests, completedRetests };
}

function renderRepairs() {
  const intel = repairIntelligence();
  $('repair-kpi-loss').textContent = intel.recentLost.toFixed(intel.recentLost % 1 ? 1 : 0);
  $('repair-kpi-family').textContent = intel.dominant ? `${intel.dominant} · ${ERROR_NAMES[intel.dominant]}` : '—';
  $('repair-kpi-closure').textContent = intel.totalRetests ? `${Math.round(intel.completedRetests / intel.totalRetests * 100)}%` : '—';
  $('repair-kpi-active').textContent = intel.priorities.length;
  const dueCount = pendingRetests().filter(r => r.due <= todayISO()).length;
  $('repair-due-badge').textContent = dueCount;
  $('repair-priority-list').innerHTML = intel.priorities.length ? intel.priorities.slice(0,6).map(row => {
    const topic = getTopic(row.topicKey);
    if (!topic) return '';
    const reason = [row.lost ? `${row.lost} marks lost` : '', row.errorAttempts > 1 ? `${row.errorAttempts} error hits` : '', row.highConfidence ? `${row.highConfidence} confidence trap${row.highConfidence===1?'':'s'}` : '', row.due ? 'retest debt' : ''].filter(Boolean).join(' · ');
    return `<div class="queue-item repair-priority"><div><div class="queue-title">${escapeHTML(topic.name)}</div><div class="priority-reasons">${titleCase(topic.subject)} · ${reason || 'repair evidence'}</div></div><div><div class="repair-priority-score">P${Math.round(row.score)}</div><button class="log-mini" data-repair-topic="${row.topicKey}" data-repair-type="reattempt">Repair</button></div></div>`;
  }).join('') : '<div class="empty-state">No repair intelligence yet. Log one honest marked attempt with the dominant cause of any lost marks.</div>';

  const pending = pendingRetests().slice(0,6);
  $('repair-transfer-list').innerHTML = pending.length ? pending.map(r => {
    const topic = getTopic(r.topicKey); if (!topic) return '';
    const stageName = r.stage === 1 ? 'Fresh transfer' : 'Delayed stability';
    const type = r.stage === 1 ? 'fresh-transfer' : 'delayed-retest';
    const due = r.due < todayISO() ? `${Math.floor((new Date(todayISO()) - new Date(r.due))/86400000)}d overdue` : r.due === todayISO() ? 'due today' : `due ${r.due}`;
    return `<div class="queue-item"><div><div class="queue-title">${escapeHTML(topic.name)}</div><div class="queue-meta">${titleCase(topic.subject)} · ${stageName}</div></div><button class="log-mini queue-due" data-repair-topic="${r.topicKey}" data-repair-retest-id="${r.id}" data-repair-type="${type}">${due}</button></div>`;
  }).join('') : '<div class="empty-state">No transfer/retest checks are waiting. Lost marks or unsupported guesses will create a closure queue automatically.</div>';

  $('subject-playbooks').innerHTML = `
    <div class="subject-playbook"><b style="color:var(--phy)">Physics · find the first wrong decision</b><span>Model/concept → equation choice → graph → sign/direction → algebra → units. Do not repair only the final arithmetic if the reasoning broke earlier.</span></div>
    <div class="subject-playbook"><b style="color:var(--chem)">Chemistry · memory vs reasoning</b><span>Forgotten condition/equation/observation = retrieval repair. Equilibrium/mechanism/calculation reasoning = conceptual or method repair.</span></div>
    <div class="subject-playbook"><b style="color:var(--bio)">Biology · retrieval vs marking production</b><span>Check factual recall, statement discrimination, exact terminology, sequence, diagrams and whether the required marking points were explicitly produced.</span></div>`;
}

function refreshAll() {
  renderKPIs(); renderExamTimeline(); renderPlanner(); renderDailyOutput(); renderSubjectPulse(); renderRetests(); renderErrors(); renderPriorityTopics(); renderCalibration(); renderAttempts(); renderNextAction(); renderCourseCorrection(); renderRepairs(); refreshBackupHealth();
  SUBJECTS.forEach(updateSubjectPanel);
  $('identity-line').textContent = `${state.profile.name} · ${profileDisplayLine()}`;
}

function fillTopicSelect(subject, selectedKey = '') {
  const select = $('attempt-topic');
  select.innerHTML = SYL[subject].units.map((unit, ui) => `<optgroup label="${escapeHTML(unit.n)}">${unit.t.map((name, ti) => `<option value="${topicKey(subject, ui, ti)}"${topicKey(subject, ui, ti) === selectedKey ? ' selected' : ''}>${escapeHTML(name)}</option>`).join('')}</optgroup>`).join('');
}

function openAttemptDialog(key = '', type = 'topic-question', retestId = '') {
  const topic = getTopic(key);
  const subject = topic?.subject || (SUBJECTS.includes(activePanel) ? activePanel : 'physics');
  $('attempt-form').reset();
  $('attempt-form').dataset.editId = '';
  $('attempt-form').dataset.retestId = retestId || '';
  $('attempt-date').value = todayISO();
  $('attempt-subject').value = subject;
  $('attempt-type').value = type;
  fillTopicSelect(subject, key);
  if (['reattempt','fresh-transfer','delayed-retest'].includes(type)) $('attempt-question').placeholder = type === 'reattempt' ? 'e.g. Closed-book reattempt of 2023 Q4(b)' : type === 'fresh-transfer' ? 'e.g. Fresh question testing the same concept' : 'e.g. Delayed retest · fresh question';
  refreshDiagnosisHint();
  $('attempt-dialog').showModal();
}

function completeEligibleRetests(attempt) {
  return PowerhouseCore.applyRetestOutcome(state.retests, attempt);
}

function scheduleRetests(attempt) {
  state.retests.push(...PowerhouseCore.createRetests(attempt, state.v5Settings?.retestIntervals, uid));
}

function submitAttempt(event) {
  event.preventDefault();
  const earned = Number($('marks-earned').value);
  const total = Number($('marks-total').value);
  let error = $('attempt-error').value;
  const guesses = Math.max(0, Number($('attempt-guesses').value || 0));
  if (!error && guesses > 0) error = 'G';
  const trustedRaw = $('trusted-earned').value.trim();
  const trustedEarned = trustedRaw === '' ? null : Number(trustedRaw);
  if (trustedEarned !== null && (trustedEarned < 0 || trustedEarned > earned)) { toast('Trusted marks must be between 0 and the raw marks earned.'); return; }
  if (earned > total) { toast('Marks earned cannot exceed marks available.'); return; }
  if (earned < total && !error) { toast('Choose the dominant error family for the lost marks.'); return; }
  const editingId = $('attempt-form').dataset.editId || '';
  const existingAttempt = editingId ? state.attempts.find(a => a.id === editingId) : null;
  const attempt = {
    id: editingId || uid(), date: $('attempt-date').value, subject: $('attempt-subject').value, topicKey: $('attempt-topic').value,
    type: $('attempt-type').value,
    question: $('attempt-question').value.trim(), earned, trustedEarned, total, minutes: Number($('attempt-minutes').value),
    items: Math.max(1, Number($('attempt-items').value || 1)), guesses,
    confidence: $('attempt-confidence').value, error, note: $('attempt-note').value.trim(), createdAt: existingAttempt?.createdAt || new Date().toISOString(), updatedAt: editingId ? new Date().toISOString() : null,
    retestId: $('attempt-form').dataset.retestId || existingAttempt?.retestId || null,
    sessionId: $('attempt-form').dataset.sessionId || null
  };
  if (editingId) {
    const idx = state.attempts.findIndex(a => a.id === editingId);
    if (idx < 0) { toast('The attempt being edited no longer exists.'); return; }
    state.attempts[idx] = attempt;
    PowerhouseCore.reconcileEditedAttempt(state, attempt, state.v5Settings?.retestIntervals, uid);
  } else {
    completeEligibleRetests(attempt);
    state.attempts.push(attempt);
    if (typeof linkTrackerSessionToAttempt === 'function') linkTrackerSessionToAttempt(attempt);
    scheduleRetests(attempt);
  }
  saveState();
  $('attempt-dialog').close();
  $('attempt-form').dataset.sessionId = '';
  $('attempt-form').dataset.retestId = '';
  refreshAll();
  toast(editingId ? 'Attempt corrected. Original ID and created-at timestamp preserved.' : (earned === total ? 'Full-credit evidence saved.' : 'Evidence saved. Retest policy applied.'));
}

function deleteAttempt(id) {
  const attempt = state.attempts.find(a => a.id === id);
  if (!attempt || !confirm(`Delete the logged attempt “${attempt.question}”?`)) return;
  const { reopened } = PowerhouseCore.deleteAttempt(state, id);
  saveState(); refreshAll();
  toast(reopened ? `Attempt deleted. ${reopened} retest${reopened === 1 ? '' : 's'} it had closed ${reopened === 1 ? 'is' : 'are'} open again.` : 'Attempt deleted.');
}

function renderTimer() {
  $('timer-phase').textContent = 'TEST · AI-free · closed book';
  $('timer-note').textContent = timerPresetMinutes === 30 ? 'Recovery mode: produce a real answer now. Mark immediately after. Do not turn a bad day into a new system.' : 'Long-form focus is the default. Phone away; no notes or AI during TEST. Mark and diagnose before opening more resources.';
  const mins = Math.floor(timerRemaining / 60);
  const secs = timerRemaining % 60;
  $('timer-display').textContent = `${String(mins).padStart(mins >= 100 ? 3 : 2, '0')}:${String(secs).padStart(2, '0')}`;
  $('timer-toggle').textContent = timerHandle ? 'Pause' : 'Start';
  document.querySelectorAll('[data-timer-preset]').forEach(b => b.classList.toggle('on', Number(b.dataset.timerPreset) === timerPresetMinutes));
}

function timerBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    gain.gain.value = .06; osc.frequency.value = 740; osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .18);
  } catch (_) {}
}

function setTimerPreset(minutes) {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; timerDeadline = null; }
  timerPresetMinutes = Number(minutes) || DEFAULT_FOCUS_MINUTES;
  timerRemaining = timerPresetMinutes * 60;
  renderTimer();
}

function startFocus(minutes = focusRecommendedMinutes, label = '') {
  const topic = getTopic(focusTopicKey);
  focusCustomLabel = label || '';
  $('timer-topic').textContent = focusCustomLabel || topic?.name || 'Fresh official question / paper block';
  setTimerPreset(minutes || DEFAULT_FOCUS_MINUTES);
  $('timer-dialog').showModal();
}

function syncTimerFromClock() {
  if (!timerDeadline) return;
  timerRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
  if (timerRemaining <= 0) { timerRemaining = 0; timerBeep(); finishTimer(); return; }
  renderTimer();
}

function toggleTimer() {
  if (timerHandle) {
    syncTimerFromClock();
    clearInterval(timerHandle); timerHandle = null; timerDeadline = null; renderTimer(); return;
  }
  timerDeadline = Date.now() + timerRemaining * 1000;
  timerHandle = setInterval(syncTimerFromClock, 250);
  syncTimerFromClock();
}

function nextTimerPhase() { finishTimer(); }

function finishTimer() {
  clearInterval(timerHandle); timerHandle = null; timerDeadline = null;
  if ($('timer-dialog').open) $('timer-dialog').close();
  openAttemptDialog(focusTopicKey, focusCustomLabel.startsWith('Full paper') ? 'full-paper' : 'topic-question');
  toast(`${timerPresetMinutes}-minute block closed. Mark honestly and log the evidence now.`);
}

function resetTimer() { clearInterval(timerHandle); timerHandle = null; timerDeadline = null; timerRemaining = timerPresetMinutes * 60; renderTimer(); }

function exportData() {
  snapshotState('pre-export');
  state.lastExportedAt = new Date().toISOString();
  saveState();
  const payload = typeof buildUnifiedBackup === 'function' ? buildUnifiedBackup() : state;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `al-performance-powerhouse-v5-backup-${todayISO()}.json`; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('backup-status').textContent = `Last backup exported: ${new Date(state.lastExportedAt).toLocaleString()}`;
  toast('Backup exported.');
}

const MAX_IMPORT_BYTES = 15 * 1024 * 1024;

function closeDataDialogs() {
  if ($('data-dialog').open) $('data-dialog').close();
  if ($('welcome-dialog').open) $('welcome-dialog').close();
}

/**
 * Restores data from a JSON file. The file is parsed and validated in full
 * (PowerhouseCore.inspectImport) before anything is written; the student sees
 * what will be restored and confirms; a recovery snapshot is always taken first.
 */
function importData(file) {
  if (file.size > MAX_IMPORT_BYTES) { toast('That file is too large to be a Powerhouse backup.'); return; }
  const reader = new FileReader();
  reader.onerror = () => toast('That file could not be read.');
  reader.onload = () => {
    let parsed;
    try { parsed = JSON.parse(reader.result); } catch (_) { toast('That file is not valid JSON, so nothing was imported.'); return; }
    const plan = PowerhouseCore.inspectImport(parsed);
    try {
      if (plan.kind === 'invalid') { toast(plan.message); return; }
      if (plan.kind === 'backup') {
        const ok = confirm(`Restore this Powerhouse backup?\n\n${plan.summary}.\n\nYour current local record will be replaced. A recovery snapshot of it is kept first.`);
        if (!ok) { toast('Import cancelled. Nothing changed.'); return; }
        snapshotState('pre-import');
        if (plan.studyTracker && !DEMO_MODE) localStorage.setItem('al_performance_powerhouse_study_tracker_v1', JSON.stringify(plan.studyTracker));
        if (plan.physicsIntelligence && !DEMO_MODE) localStorage.setItem('al_performance_powerhouse_physics_intelligence_v1', JSON.stringify(plan.physicsIntelligence));
        state = plan.state;
        saveState(); refreshAll(); closeDataDialogs();
        toast(plan.dropped ? `Backup restored. ${plan.dropped} invalid record(s) were skipped.` : 'Powerhouse backup restored.');
        return;
      }
      if (plan.kind === 'legacy-ratings') {
        snapshotState('pre-import');
        state.ratings = { ...state.ratings, ...plan.ratings };
        saveState(); refreshAll(); closeDataDialogs();
        toast(`${plan.count} legacy ratings imported.`);
        return;
      }
      snapshotState('pre-import');
      const mapped = mapDonatedTrackerToDaily(parsed);
      if (mapped.imported > 0) {
        state.dailyEntries = PowerhouseCore.normalizeState({ ...state, dailyEntries: state.dailyEntries }).state.dailyEntries;
        saveState(); refreshAll(); closeDataDialogs();
        toast(`${mapped.imported} legacy daily-progress rows imported.`);
      } else if (mapped.archived) {
        saveState(); refreshAll();
        toast('Legacy tracker data preserved in a local archive; subject mapping needs review before merging.');
      } else {
        toast('That JSON could not be safely mapped into Powerhouse. Nothing was imported.');
      }
    } catch (_) { toast('That JSON could not be safely mapped into Powerhouse. Nothing was imported.'); }
  };
  reader.readAsText(file);
}

function showWelcome() {
  if (state.profileSetupComplete || $('welcome-dialog').open) return;
  $('welcome-name').value = '';
  $('welcome-year').value = state.profile?.year || '2027';
  $('welcome-target').value = state.profile?.target || '';
  $('welcome-goal').value = `${state.profile?.year || '2027'} A/L Bio Science · evidence over guesswork`;
  $('welcome-dialog').showModal();
}

function initEvents() {
  $('app-tabs').addEventListener('click', e => { const tab = e.target.closest('[data-panel]'); if (tab) navigate(tab.dataset.panel); });
  $('subject-pulse').addEventListener('click', e => { const card = e.target.closest('[data-jump]'); if (card) navigate(card.dataset.jump); });
  $('subject-pulse').addEventListener('keydown', e => { const card = e.target.closest('[data-jump]'); if (card && (e.key === 'Enter' || e.key === ' ')) navigate(card.dataset.jump); });
  $('quick-log-btn').addEventListener('click', () => openAttemptDialog());
  $('log-from-ledger').addEventListener('click', () => openAttemptDialog());
  $('view-all-btn').addEventListener('click', () => navigate('attempts'));
  $('start-focus-btn').addEventListener('click', () => startFocus(focusRecommendedMinutes));
  $('paper-first-btn').addEventListener('click', () => { focusTopicKey=''; startFocus(120, 'Full paper / substantial paper section'); });
  $('course-correct-btn').addEventListener('click', () => navigate('course'));
  $('set-target-btn').addEventListener('click', () => navigate('course'));
  $('start-rescue-btn').addEventListener('click', startRescueMode);
  $('log-evidence-course').addEventListener('click', () => openAttemptDialog());
  $('save-course-audit').addEventListener('click', saveCourseAudit);
  $('save-target-date').addEventListener('click', saveTargetDate);
  $('discipline-mode').addEventListener('change', e => { courseState().disciplineMode = e.target.checked; saveState(); renderCourseCorrection(); toast(e.target.checked ? 'Execution Lock enabled.' : 'Execution Lock disabled. Use the freedom carefully.'); });
  $('correction-rule-grid').addEventListener('click', e => { const b=e.target.closest('[data-correction-rule]'); if(b) triggerCourseCorrection(b.dataset.correctionRule); });
  $('attempt-subject').addEventListener('change', e => { fillTopicSelect(e.target.value); refreshDiagnosisHint(); });
  $('attempt-form').addEventListener('submit', submitAttempt);
  $('daily-form').addEventListener('submit', submitDailyOutput);
  $('save-daily-targets').addEventListener('click', saveDailyTargets);
  $('daily-history-body').addEventListener('click', e => { const b = e.target.closest('[data-delete-daily]'); if (b) deleteDailyEntry(b.dataset.deleteDaily); });
  document.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click', () => $('attempt-dialog').close()));
  $('retest-queue').addEventListener('click', e => { const b = e.target.closest('[data-retest-topic]'); if (b) openAttemptDialog(b.dataset.retestTopic, b.dataset.retestType || 'fresh-transfer', b.dataset.retestId || ''); });
  $('priority-topics').addEventListener('click', e => { const b = e.target.closest('[data-priority-topic]'); if (b) openAttemptDialog(b.dataset.priorityTopic); });
  $('calibration-risk').addEventListener('click', e => { const b = e.target.closest('[data-calibration-topic]'); if (b) openAttemptDialog(b.dataset.calibrationTopic); });
  $('repair-log-btn').addEventListener('click', () => openAttemptDialog('', 'reattempt'));
  $('panel-repairs').addEventListener('click', e => { const b=e.target.closest('[data-repair-topic]'); if (b) openAttemptDialog(b.dataset.repairTopic, b.dataset.repairType || 'reattempt', b.dataset.repairRetestId || ''); });
  $('share-safe-btn').addEventListener('click', toggleShareSafe);
  $('mobile-quick-log').addEventListener('click', () => openAttemptDialog());
  $('backup-health').addEventListener('click', () => $('data-btn').click());
  $('attempt-table-body').addEventListener('click', e => { const b = e.target.closest('[data-delete-attempt]'); if (b) deleteAttempt(b.dataset.deleteAttempt); });
  $('timer-toggle').addEventListener('click', toggleTimer); $('timer-skip').addEventListener('click', nextTimerPhase); $('timer-reset').addEventListener('click', resetTimer);
  document.querySelectorAll('[data-timer-preset]').forEach(b => b.addEventListener('click', () => setTimerPreset(Number(b.dataset.timerPreset))));
  $('planner-list').addEventListener('change', e => {
    const select = e.target.closest('[data-plan-progress]');
    if (!select) return;
    state.syllabusProgress[select.dataset.planProgress] = Number(select.value);
    saveState(); refreshAll();
    toast('Syllabus progress saved locally.');
  });
  $('planner-subject-filter').addEventListener('change', renderPlanner);
  $('planner-grade-filter').addEventListener('change', renderPlanner);
  $('planner-unfinished-only').addEventListener('click', () => {
    plannerUnfinishedOnly = !plannerUnfinishedOnly;
    $('planner-unfinished-only').setAttribute('aria-pressed', String(plannerUnfinishedOnly));
    $('planner-unfinished-only').textContent = plannerUnfinishedOnly ? 'Showing unfinished' : 'Unfinished only';
    renderPlanner();
  });
  document.querySelectorAll('[data-close-timer]').forEach(b => b.addEventListener('click', () => { clearInterval(timerHandle); timerHandle = null; timerDeadline = null; $('timer-dialog').close(); }));
  $('data-btn').addEventListener('click', () => {
    $('profile-name').value = state.profile.name;
    $('profile-year').value = state.profile.year || '2027';
    $('profile-target').value = state.profile.target || '';
    $('profile-line').value = profileDisplayLine();
    $('backup-status').textContent = state.lastExportedAt ? `Last backup exported: ${new Date(state.lastExportedAt).toLocaleString()}` : 'No backup recorded yet.';
    $('recovery-status').textContent = `Recovery snapshots: ${recoveryCount()}/10 · Legacy tracker archives: ${Number(state.legacyArchiveCount || 0)} · Execution Guard: ${courseState().disciplineMode !== false ? 'ON' : 'OFF'}`;
    $('data-dialog').showModal();
  });
  document.querySelectorAll('[data-close-data]').forEach(b => b.addEventListener('click', () => $('data-dialog').close()));
  $('save-profile').addEventListener('click', () => { state.profile.name = $('profile-name').value.trim() || 'Student'; state.profile.year = $('profile-year').value.trim() || '2027'; state.profile.target = $('profile-target').value.trim(); state.profile.line = $('profile-line').value.trim() || `${state.profile.year} A/L Bio Science${state.profile.target ? ` · ${state.profile.target}` : ''} · evidence over guesswork`; state.profileSetupComplete = true; saveState(); refreshAll(); $('data-dialog').close(); toast('Identity updated.'); });
  $('welcome-form').addEventListener('submit', event => {
    event.preventDefault();
    state.profile.name = $('welcome-name').value.trim();
    state.profile.year = $('welcome-year').value.trim() || '2027';
    state.profile.target = $('welcome-target').value.trim();
    state.profile.line = $('welcome-goal').value.trim() || `${state.profile.year} A/L Bio Science${state.profile.target ? ` · ${state.profile.target}` : ''} · evidence over guesswork`;
    state.profileSetupComplete = true;
    saveState(); refreshAll(); $('welcome-dialog').close();
    toast('Your private Powerhouse is ready.');
  });
  $('welcome-import').addEventListener('click', () => $('import-file').click());
  $('export-data').addEventListener('click', exportData);
  $('import-data').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  $('reset-data').addEventListener('click', () => {
    const typed = prompt('This resets ratings, syllabus progress, attempts, retests, daily output and V5 execution-guard history. A recovery snapshot is created first. Type RESET to continue.');
    if (typed !== 'RESET') { toast('Reset cancelled.'); return; }
    snapshotState('pre-reset');
    state = defaultState(); state.ratings = {}; saveState(); refreshAll(); $('data-dialog').close();
    toast('All local progress was reset. A recovery snapshot was kept.'); setTimeout(showWelcome, 80);
  });
}

function showDemoBanner() {
  if (!DEMO_MODE) return;
  document.body.classList.add('demo-mode');
  const bar = document.createElement('div');
  bar.className = 'demo-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span><strong>Demo mode</strong> · fictional sample data · nothing you do here is saved</span><a href="./">Exit demo</a>';
  document.body.prepend(bar);
}

showDemoBanner();
SUBJECTS.forEach(buildSubjectPanel);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
initEvents();
refreshAll();
try {
  const hashPanel = location.hash.replace('#','');
  if (['command','physics','chemistry','biology','repairs','course','daily','planner','attempts','guide'].includes(hashPanel)) navigate(hashPanel);
  if (new URLSearchParams(location.search).get('share') === '1' && !shareSafeMode) toggleShareSafe();
} catch (_) {}
setTimeout(showWelcome, 0);
