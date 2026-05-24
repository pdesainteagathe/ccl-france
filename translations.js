// translations.js — ajoutez de nouvelles langues en copiant un bloc existant

const translations = {
  fr: {
    page_title: "Taxons le carbone, partageons les recettes !",
    page_description: "Analysez l'impact distributif de la tarification carbone à travers les groupes de revenus avec des mesures de compensation interactives et des visualisations détaillées.",
    mobile_hint: "Testez des valeurs de paramètres et observez leurs effets dans les graphiques plus bas",
    subsidies: [
  "Pompe à chaleur", "Géothermie", "Voiture électrique", "Vélo électrique",
  "Trains (Intercités/TER)", "Rénovation thermique", "Énergies renouvelables",
  "Énergie nucléaire", "Car express régionaux", "Fret ferroviaire",
  "Installation de bornes de recharge", "Prix des recharges",
  "Agriculture durable", "Industrie décarbonée", "Filière bois énergie", "Autres"
],
    // Sliders
    carbon_price_label: "Prix d'une taxe carbone",
    full_scope: "Couvrant toutes les émissions (théorique)",
    restricted_scope: "Transport routier et logement uniquement",
    redistribution_label: "Usage des recettes : revenu direct ou subventions ?",
    low_income_bonus: "Bonus bas revenus",
    rural_bonus: "Bonus zones rurales",
    rural_view: "Vue par ruralité (Rural / Banlieue / Centre)",

    // Tooltips
    redistribution_tooltip: "Une fois les recettes de la taxe carbone collectée, on peut décider du meilleur usage de cet argent. On peut le diviser par le nombre de citoyens et redistribuer à chacun une part (c'est le revenu carbone) ou bien financer des subventions vertes (voir panneau subventions), ou encore mixer les deux options. Ici, pour des raisons de données disponibles, nous modélisons une redistribution uniforme par ménages et non par citoyen, mais le mécanisme s'applique très bien par citoyen ou par résident dans le pays.",
    low_income_tooltip: "Avec une redistribution uniforme, les bas déciles de revenus sont déjà gagnants, car ils émettent moins en moyenne que les hauts déciles. Néanmoins, on peut vouloir accentuer cette répartition avec un bonus 'bas revenus'. Plus ce bonus est élevé, plus les ménages à bas revenus reçoivent une part importante de la redistribution. Le calcul utilise une pondération progressive qui favorise les déciles inférieurs.",
    rural_tooltip: "Compense le surcoût carbone des ménages ruraux (+50% d'émissions en moyenne). Le mécanisme effectue un transfert global depuis la redistribution des habitants des centres-villes (perte homogène) vers les habitants ruraux (gain uniforme par ménage). Comme les ménages ruraux sont plus nombreux dans les bas déciles, ce bonus renforce l'aspect redistributif pro-pauvre. Données : Pottier et al. (2020).",
    chart_tooltip: "Dans le graphique de base, les ménages en vert sont en moyenne gagnants avec le dispositif : ils touchent plus qu'ils ne paient. Dans la vue par ruralité, les couleurs distinguent cette fois les types de localisation.",

    // Slider percentage prefixes (used by app.js)
    sub_prefix: "Sub.",
    rev_prefix: "Revenu",

    // Vote button
    vote_main: "Je vote",
    vote_sub: "pour cette redistribution",
    vote_sending: "Envoi...",
    vote_success_main: "✓ Vote enregistré !",
    vote_success_sub: "Merci pour votre participation",
    vote_error_main: "⚠ Erreur",
    vote_error_sub: "Réessayez",

    // Links & buttons
    methodology: "📖 Méthodologie complète",
    export_btn: "📥 Exporter les données (.xlsx)",

    // Legend & chart
    legend_cost: "Coût de la taxe carbone",
    legend_after: "Coût après redistribution",
    legend_after_colon: "Coût après redistribution :",
    territory_rural: "Rural",
    territory_banlieue: "Banlieue",
    territory_centre: "Centre",
    chart_label: "Impact annuel par ménage (en €)",
    source: "Source: Pottier et al. (2020).",

    // Subsidies panel
    subsidies_title: "Choix des subventions",
    subsidies_subtitle: "Répartissez les subventions (Total: 100%)",

    // Chart axis / labels used in app.js — access via window.t('key')
    chart_axis_decile: "Déciles de niveau de vie",
    chart_decile_prefix: "D",
  },

  en: {
    page_title: "Tax carbon, share the revenue!",
    page_description: "Analyse the distributional impact of carbon pricing across income groups with interactive compensation measures and detailed visualisations.",
    mobile_hint: "Try different parameter values and observe their effects in the charts below",

    subsidies: [
  "Heat pump", "Geothermal", "Electric car", "Electric bike",
  "Trains (Intercity/Regional)", "Thermal renovation", "Renewable energy",
  "Nuclear energy", "Regional express coaches", "Rail freight",
  "Charging station installation", "Charging prices",
  "Sustainable agriculture", "Decarbonized industry", "Wood energy sector", "Other"
],
    // Sliders
    carbon_price_label: "Carbon tax price",
    full_scope: "Covering all emissions (theoretical)",
    restricted_scope: "Road transport and housing only",
    redistribution_label: "Revenue use: direct income or subsidies?",
    low_income_bonus: "Low-income bonus",
    rural_bonus: "Rural areas bonus",
    rural_view: "View by rurality (Rural / Suburb / City centre)",

    // Tooltips
    redistribution_tooltip: "Once carbon tax revenues are collected, we can decide the best use of that money. It can be divided by the number of citizens and redistributed as an equal share (the carbon dividend), used to fund green subsidies (see subsidies panel), or a mix of both. Here, due to data availability, we model a uniform redistribution per household rather than per citizen, but the mechanism works equally well per citizen or per resident.",
    low_income_tooltip: "With uniform redistribution, lower income deciles already benefit, as they emit less on average than higher deciles. However, one may wish to accentuate this distribution with a low-income bonus. The higher this bonus, the greater the share of redistribution received by lower-income households. The calculation uses progressive weighting that favours lower deciles.",
    rural_tooltip: "Compensates for the carbon surcharge on rural households (+50% emissions on average). The mechanism performs a global transfer from the redistribution of city-centre residents (uniform loss) to rural residents (uniform gain per household). As rural households are more numerous in lower deciles, this bonus reinforces the pro-poor redistributive aspect. Data: Pottier et al. (2020).",
    chart_tooltip: "In the base chart, green households are on average winners: they receive more than they pay. In the rurality view, colours distinguish location types instead.",

    // Slider percentage prefixes (used by app.js)
    sub_prefix: "Sub.",
    rev_prefix: "Income",

    // Vote button
    vote_main: "I vote",
    vote_sub: "for this redistribution",
    vote_sending: "Sending...",
    vote_success_main: "✓ Vote recorded!",
    vote_success_sub: "Thanks for taking part",
    vote_error_main: "⚠ Error",
    vote_error_sub: "Please try again",

    // Links & buttons
    methodology: "📖 Full methodology",
    export_btn: "📥 Export data (.xlsx)",

    // Legend & chart
    legend_cost: "Carbon tax cost",
    legend_after: "Cost after redistribution",
    legend_after_colon: "Cost after redistribution:",
    territory_rural: "Rural",
    territory_banlieue: "Suburb",
    territory_centre: "City centre",
    chart_label: "Annual impact per household (€)",
    source: "Source: Pottier et al. (2020).",

    // Subsidies panel
    subsidies_title: "Subsidy choices",
    subsidies_subtitle: "Allocate subsidies (Total: 100%)",

    // Chart axis / labels used in app.js — access via window.t('key')
    chart_axis_decile: "Standard-of-living deciles",
    chart_decile_prefix: "D",
  },
    de: {
    page_title: "Kohlenstoff besteuern, Einnahmen teilen!",
    page_description: "Analysieren Sie die Verteilungswirkung der CO₂-Bepreisung auf verschiedene Einkommensgruppen mit interaktiven Ausgleichsmaßnahmen und detaillierten Visualisierungen.",
    mobile_hint: "Testen Sie verschiedene Parameterwerte und beobachten Sie deren Auswirkungen in den Grafiken unten",
 
    subsidies: [
  "Wärmepumpe", "Geothermie", "Elektroauto", "E-Bike",
  "Züge (Intercity/Regional)", "Wärmedämmung", "Erneuerbare Energien",
  "Kernenergie", "Regionale Expressbusse", "Schienengüterverkehr",
  "Ladestation-Installation", "Ladepreise",
  "Nachhaltige Landwirtschaft", "Dekarbonisierte Industrie", "Holzenergie-Sektor", "Andere"
],
    // Sliders
    carbon_price_label: "CO₂-Steuerpreis",
    full_scope: "Alle Emissionen abgedeckt (theoretisch)",
    restricted_scope: "Nur Straßenverkehr und Wohnen",
    redistribution_label: "Verwendung der Einnahmen: direktes Einkommen oder Subventionen?",
    low_income_bonus: "Niedrigeinkommens-Bonus",
    rural_bonus: "Ländlicher Bonus",
    rural_view: "Ansicht nach Ländlichkeit (Ländlich / Vorstadt / Stadtzentrum)",
 
    // Tooltips
    redistribution_tooltip: "Sobald die CO₂-Steuereinnahmen eingezogen sind, kann über deren beste Verwendung entschieden werden. Sie können gleichmäßig auf alle Bürgerinnen und Bürger verteilt werden (Kohlenstoffdividende), für grüne Subventionen genutzt werden (siehe Subventionspanel) oder eine Kombination aus beidem darstellen. Hier modellieren wir aus Datengründen eine gleichmäßige Umverteilung pro Haushalt statt pro Person, aber der Mechanismus funktioniert ebenso gut pro Einwohner.",
    low_income_tooltip: "Bei einer gleichmäßigen Umverteilung profitieren niedrige Einkommensdezile bereits, da sie im Durchschnitt weniger emittieren als höhere Dezile. Dennoch kann man diese Verteilung mit einem Niedrigeinkommens-Bonus verstärken. Je höher dieser Bonus, desto größer der Anteil der Umverteilung für einkommensschwache Haushalte. Die Berechnung verwendet eine progressive Gewichtung zugunsten unterer Dezile.",
    rural_tooltip: "Gleicht den CO₂-Mehraufwand ländlicher Haushalte aus (+50 % Emissionen im Durchschnitt). Der Mechanismus bewirkt einen globalen Transfer aus der Umverteilung von Stadtbewohnern (gleichmäßiger Verlust) hin zu ländlichen Bewohnern (gleichmäßiger Gewinn pro Haushalt). Da ländliche Haushalte in unteren Dezilen häufiger vertreten sind, stärkt dieser Bonus den pro-armen Umverteilungseffekt. Daten: Pottier et al. (2020).",
    chart_tooltip: "Im Basisdiagramm sind grüne Haushalte im Durchschnitt Gewinner: Sie erhalten mehr, als sie zahlen. In der Ländlichkeitsansicht unterscheiden die Farben stattdessen die Standorttypen.",
 
    // Slider percentage prefixes (used by app.js)
    sub_prefix: "Sub.",
    rev_prefix: "Eink.",
 
    // Vote button
    vote_main: "Ich stimme",
    vote_sub: "für diese Umverteilung",
    vote_sending: "Senden...",
    vote_success_main: "✓ Stimme gezählt!",
    vote_success_sub: "Vielen Dank für Ihre Teilnahme",
    vote_error_main: "⚠ Fehler",
    vote_error_sub: "Bitte erneut versuchen",

    // Links & buttons
    methodology: "📖 Vollständige Methodik",
    export_btn: "📥 Daten exportieren (.xlsx)",

    // Legend & chart
    legend_cost: "Kosten der CO₂-Steuer",
    legend_after: "Kosten nach Umverteilung",
    legend_after_colon: "Kosten nach Umverteilung:",
    territory_rural: "Ländlich",
    territory_banlieue: "Vorstadt",
    territory_centre: "Stadtzentrum",
    chart_label: "Jährliche Auswirkung pro Haushalt (€)",
    source: "Quelle: Pottier et al. (2020).",

    // Subsidies panel
    subsidies_title: "Subventionsauswahl",
    subsidies_subtitle: "Subventionen aufteilen (Gesamt: 100%)",

    // Chart axis / labels used in app.js — access via window.t('key')
    chart_axis_decile: "Lebensstandard-Dezile",
    chart_decile_prefix: "D",
  }
};