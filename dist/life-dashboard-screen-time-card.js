// Screen time for Home Assistant dashboards: today on one phone, the week, and the family.
// A single ES module with no dependencies and no build step. Three cards share the code;
// the pure data functions are exported so test/data.test.mjs can run them under Node.

export const VERSION = "0.1.0";

const TAG = {
  today: "life-dashboard-screen-time-card",
  week: "life-dashboard-screen-time-week-card",
  family: "life-dashboard-screen-time-family-card",
};
const PLATFORM = "life_dashboard";
// Parental control integrations whose screen time sensors the cards read as they are.
const PARENTAL = new Set(["familylink", "microsoft_family_safety"]);
const KEY = {
  today: "screen_time_today",
  yesterday: "screen_time_yesterday",
  app: "app_screen_time",
  sync: "last_screen_time_sync",
};
const DAY = 86400000;
const WEEK_DAYS = 7;
const STATS_TTL = 15 * 60000;

// Popular Android apps: package, name, brand color, icon. An app without an icon in
// Home Assistant's set gets its first letter on its color; any other app gets a color
// derived from its package name. Users override all three per app.
const CATALOG = new Map(
  [
    ["com.google.android.youtube", "YouTube", "#FF0033", "mdi:youtube"],
    ["com.google.android.apps.youtube.kids", "YouTube Kids", "#FF0033", "mdi:youtube"],
    ["com.google.android.apps.youtube.music", "YouTube Music", "#FF0033", null],
    ["com.android.chrome", "Chrome", "#1A73E8", "mdi:google-chrome"],
    ["com.google.android.gm", "Gmail", "#EA4335", "mdi:gmail"],
    ["com.google.android.apps.maps", "Maps", "#34A853", "mdi:google-maps"],
    ["com.google.android.apps.photos", "Photos", "#FBBC04", "mdi:image-multiple"],
    ["com.google.android.apps.docs", "Drive", "#1FA463", "mdi:google-drive"],
    ["com.google.android.calendar", "Calendar", "#4285F4", "mdi:calendar-month"],
    ["com.google.android.apps.messaging", "Messages", "#1A73E8", "mdi:message-text"],
    ["com.google.android.dialer", "Phone", "#34A853", "mdi:phone"],
    ["com.android.vending", "Play Store", "#01875F", "mdi:google-play"],
    ["com.google.android.googlequicksearchbox", "Google", "#4285F4", "mdi:google"],
    ["com.google.android.apps.nbu.files", "Files", "#1A73E8", "mdi:folder"],
    ["com.google.android.keep", "Keep", "#FBBC04", "mdi:lightbulb"],
    ["com.google.android.apps.translate", "Translate", "#4285F4", "mdi:translate"],
    ["com.google.android.apps.fitness", "Fit", "#EA4335", "mdi:google-fit"],
    ["com.google.android.apps.tachyon", "Meet", "#00897B", "mdi:video"],
    ["com.google.android.deskclock", "Clock", "#4285F4", "mdi:clock-outline"],
    ["com.google.android.GoogleCamera", "Camera", "#4285F4", "mdi:camera"],
    ["com.google.android.apps.walletnfcrel", "Wallet", "#4285F4", "mdi:wallet"],
    ["com.google.android.apps.googleassistant", "Assistant", "#4285F4", "mdi:google-assistant"],
    ["com.google.android.apps.chromecast.app", "Google Home", "#4285F4", "mdi:home-automation"],
    ["com.google.android.contacts", "Contacts", "#4285F4", "mdi:account-box"],
    ["com.google.android.apps.authenticator2", "Authenticator", "#4285F4", "mdi:shield-key"],
    ["com.google.android.apps.bard", "Gemini", "#4285F4", "mdi:star-four-points"],
    ["com.google.android.apps.nexuslauncher", "Pixel Launcher", "#5F6368", "mdi:home"],
    ["com.google.android.apps.recorder", "Recorder", "#EA4335", "mdi:microphone"],
    ["com.android.settings", "Settings", "#5F6368", "mdi:cog"],
    ["com.whatsapp", "WhatsApp", "#25D366", "mdi:whatsapp"],
    ["com.whatsapp.w4b", "WhatsApp Business", "#25D366", "mdi:whatsapp"],
    ["com.instagram.android", "Instagram", "linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 55%,#962FBF 80%,#4F5BD5 100%)", "mdi:instagram"],
    ["com.instagram.barcelona", "Threads", "#000000", null],
    ["com.facebook.katana", "Facebook", "#0866FF", "mdi:facebook"],
    ["com.facebook.lite", "Facebook Lite", "#0866FF", "mdi:facebook"],
    ["com.facebook.orca", "Messenger", "#0084FF", "mdi:facebook-messenger"],
    ["com.zhiliaoapp.musically", "TikTok", "#000000", null],
    ["com.ss.android.ugc.trill", "TikTok", "#000000", null],
    ["com.snapchat.android", "Snapchat", "#FFFC00", "mdi:snapchat"],
    ["com.twitter.android", "X", "#000000", null],
    ["com.reddit.frontpage", "Reddit", "#FF4500", "mdi:reddit"],
    ["com.pinterest", "Pinterest", "#E60023", "mdi:pinterest"],
    ["com.linkedin.android", "LinkedIn", "#0A66C2", "mdi:linkedin"],
    ["org.telegram.messenger", "Telegram", "#229ED9", null],
    ["org.thoughtcrime.securesms", "Signal", "#3A76F0", null],
    ["com.discord", "Discord", "#5865F2", null],
    ["com.tumblr", "Tumblr", "#001935", null],
    ["com.bereal.ft", "BeReal", "#000000", null],
    ["com.viber.voip", "Viber", "#7360F2", null],
    ["jp.naver.line.android", "LINE", "#06C755", null],
    ["com.tencent.mm", "WeChat", "#07C160", "mdi:wechat"],
    ["org.joinmastodon.android", "Mastodon", "#6364FF", "mdi:mastodon"],
    ["xyz.blueskyweb.app", "Bluesky", "#1185FE", null],
    ["com.kakao.talk", "KakaoTalk", "#FEE500", null],
    ["com.netflix.mediaclient", "Netflix", "#E50914", "mdi:netflix"],
    ["com.disney.disneyplus", "Disney+", "#113CCF", null],
    ["com.amazon.avod.thirdpartyclient", "Prime Video", "#00A8E1", null],
    ["tv.twitch.android.app", "Twitch", "#9146FF", "mdi:twitch"],
    ["com.spotify.music", "Spotify", "#1DB954", "mdi:spotify"],
    ["com.soundcloud.android", "SoundCloud", "#FF5500", "mdi:soundcloud"],
    ["com.apple.android.music", "Apple Music", "#FA243C", null],
    ["deezer.android.app", "Deezer", "#A238FF", null],
    ["com.shazam.android", "Shazam", "#0088FF", null],
    ["au.com.shiftyjelly.pocketcasts", "Pocket Casts", "#F43E37", "mdi:podcast"],
    ["com.audible.application", "Audible", "#F8991C", null],
    ["com.plexapp.android", "Plex", "#E5A00D", "mdi:plex"],
    ["org.videolan.vlc", "VLC", "#FF8800", "mdi:vlc"],
    ["com.roblox.client", "Roblox", "#232527", null],
    ["com.mojang.minecraftpe", "Minecraft", "#5B8C32", "mdi:minecraft"],
    ["com.supercell.clashofclans", "Clash of Clans", "#F3B814", null],
    ["com.supercell.clashroyale", "Clash Royale", "#2F6FD6", null],
    ["com.supercell.brawlstars", "Brawl Stars", "#FFC107", null],
    ["com.king.candycrushsaga", "Candy Crush", "#F06EAA", null],
    ["com.epicgames.fortnite", "Fortnite", "#1A1A2E", null],
    ["com.nianticlabs.pokemongo", "Pokémon GO", "#FFCB05", "mdi:pokeball"],
    ["com.innersloth.spacemafia", "Among Us", "#C51111", null],
    ["com.chess", "Chess.com", "#81B64C", "mdi:chess-pawn"],
    ["com.duolingo", "Duolingo", "#58CC02", null],
    ["com.microsoft.teams", "Teams", "#6264A7", "mdi:microsoft-teams"],
    ["com.microsoft.office.outlook", "Outlook", "#0078D4", "mdi:microsoft-outlook"],
    ["com.microsoft.office.word", "Word", "#2B579A", "mdi:microsoft-word"],
    ["com.microsoft.office.excel", "Excel", "#217346", "mdi:microsoft-excel"],
    ["com.microsoft.emmx", "Edge", "#0078D7", "mdi:microsoft-edge"],
    ["com.slack", "Slack", "#4A154B", "mdi:slack"],
    ["us.zoom.videomeetings", "Zoom", "#0B5CFF", null],
    ["org.mozilla.firefox", "Firefox", "#FF7139", "mdi:firefox"],
    ["com.brave.browser", "Brave", "#FB542B", null],
    ["com.opera.browser", "Opera", "#FF1B2D", "mdi:opera"],
    ["com.sec.android.app.sbrowser", "Samsung Internet", "#6F5BEB", null],
    ["com.duckduckgo.mobile.android", "DuckDuckGo", "#DE5833", null],
    ["com.notion.id", "Notion", "#000000", null],
    ["com.todoist", "Todoist", "#E44332", null],
    ["com.evernote", "Evernote", "#00A82D", "mdi:evernote"],
    ["com.dropbox.android", "Dropbox", "#0061FF", "mdi:dropbox"],
    ["com.amazon.mShop.android.shopping", "Amazon", "#FF9900", null],
    ["com.ebay.mobile", "eBay", "#E53238", null],
    ["com.paypal.android.p2pmobile", "PayPal", "#003087", null],
    ["com.ubercab", "Uber", "#000000", null],
    ["com.airbnb.android", "Airbnb", "#FF5A5F", null],
    ["com.openai.chatgpt", "ChatGPT", "#10A37F", null],
    ["com.anthropic.claude", "Claude", "#D97757", null],
    ["com.github.android", "GitHub", "#181717", "mdi:github"],
    ["io.homeassistant.companion.android", "Home Assistant", "#18BCF2", "mdi:home-assistant"],
    ["io.homeassistant.companion.android.minimal", "Home Assistant", "#18BCF2", "mdi:home-assistant"],
    ["com.owen282000.lifedashboard", "Life Dashboard", "#30B77E", "mdi:heart-pulse"],
    ["com.strava", "Strava", "#FC4C02", null],
    ["com.fitbit.FitbitMobile", "Fitbit", "#00B0B9", null],
    ["com.sec.android.app.shealth", "Samsung Health", "#1ABC9C", null],
    ["com.garmin.android.apps.connectmobile", "Garmin Connect", "#000000", null],
    ["com.sec.android.app.launcher", "One UI Home", "#5F6368", "mdi:home"],
    ["com.sec.android.gallery3d", "Gallery", "#E2445C", "mdi:image-multiple"],
    ["com.sec.android.app.camera", "Camera", "#5F6368", "mdi:camera"],
    ["com.samsung.android.messaging", "Messages", "#3C7BF0", "mdi:message-text"],
    ["com.samsung.android.dialer", "Phone", "#34A853", "mdi:phone"],
    ["com.android.camera2", "Camera", "#5F6368", "mdi:camera"],
    ["com.waze", "Waze", "#33CCFF", "mdi:waze"],
    ["com.booking", "Booking.com", "#003580", null],
    ["com.ing.mobile", "ING", "#FF6200", null],
    ["nl.rabomobiel", "Rabobank", "#000099", null],
    ["com.bunq.android", "bunq", "#2F3B4C", null],
    ["com.marktplaats.android", "Marktplaats", "#2D3C4D", null],
    ["com.bol.shop", "bol", "#0000A4", null],
    ["nl.nu.android", "NU.nl", "#002E54", null],
    ["nl.nos.app", "NOS", "#E61E14", null],
    ["com.revolut.revolut", "Revolut", "#191C1F", null],
    ["com.vinted", "Vinted", "#09B1BA", null],
  ].map(([pkg, name, color, icon]) => [pkg, { name, color, icon }]),
);
// For sources that only give a name, such as top_apps: the first package with that name.
const CATALOG_BY_NAME = new Map();
for (const entry of CATALOG.values()) {
  const key = entry.name.toLowerCase();
  if (!CATALOG_BY_NAME.has(key)) CATALOG_BY_NAME.set(key, entry);
}

const STRINGS = {
  en: {
    today: "Today",
    vsYesterday: "vs yesterday",
    vsAverage: "vs 7-day average",
    appsUsed: "Apps used",
    same: "same",
    of: "of {value}",
    avg: "avg {value}",
    left: "{value} left",
    over: "Over by {value}",
    noLimit: "No limit",
    noLimitShort: "no limit",
    more: "+ {n} more",
    less: "Show less",
    synced: "Synced {when}",
    thisWeek: "This week",
    perDay: "a day on average",
    overDays: "{n} of {total} over the limit",
    other: "Other",
    family: "Family",
    devices: "Today, {n} devices",
    dayApps: "Apps that day",
    noDayApps: "Switch on app sensors on the phone's device page to see the apps per day.",
    noStats: "No history yet: the week fills in as the days pass.",
    noApps: "No apps reported today yet.",
    pickTitle: "Choose a phone",
    pickBody: "Pick a screen time sensor in the card settings.",
    missingTitle: "Sensor not found",
    missingBody: "{entity} does not exist. Check the entity in the card settings.",
    unavailableTitle: "Screen time unavailable",
    unavailableBody: "{entity} is unavailable right now.",
    familyEmpty: "Add the family's phones in the card settings.",
    edEntity: "Screen time today",
    edTitle: "Title (optional)",
    edLimit: "Daily limit (optional)",
    edShown: "Apps before \"more\"",
    edPeople: "Phones",
    edPerson: "Person (optional, for the picture)",
    edName: "Name (optional)",
    edApps: "Apps",
    edAppsHint: "Rename an app, give it your own color, or hide it. Applies to this card.",
    edHide: "Hide {app}",
    edShow: "Show {app}",
    edColor: "Color for {app}",
    edReset: "Reset",
  },
  nl: {
    today: "Vandaag",
    vsYesterday: "t.o.v. gisteren",
    vsAverage: "t.o.v. gemiddelde 7 dagen",
    appsUsed: "Apps gebruikt",
    same: "gelijk",
    of: "van {value}",
    avg: "gem. {value}",
    left: "nog {value}",
    over: "{value} te veel",
    noLimit: "Geen limiet",
    noLimitShort: "geen limiet",
    more: "+ {n} meer",
    less: "Minder tonen",
    synced: "Gesynchroniseerd {when}",
    thisWeek: "Deze week",
    perDay: "per dag gemiddeld",
    overDays: "{n} van {total} boven de limiet",
    other: "Overig",
    family: "Gezin",
    devices: "Vandaag, {n} apparaten",
    dayApps: "Apps die dag",
    noDayApps: "Zet app-sensoren aan op de apparaatpagina van de telefoon om de apps per dag te zien.",
    noStats: "Nog geen geschiedenis: de week vult zich met de dagen.",
    noApps: "Vandaag nog geen apps doorgegeven.",
    pickTitle: "Kies een telefoon",
    pickBody: "Kies in de kaartinstellingen een schermtijdsensor.",
    missingTitle: "Sensor niet gevonden",
    missingBody: "{entity} bestaat niet. Controleer de entiteit in de kaartinstellingen.",
    unavailableTitle: "Schermtijd niet beschikbaar",
    unavailableBody: "{entity} is nu niet beschikbaar.",
    familyEmpty: "Voeg de telefoons van het gezin toe in de kaartinstellingen.",
    edEntity: "Schermtijd vandaag",
    edTitle: "Titel (optioneel)",
    edLimit: "Daglimiet (optioneel)",
    edShown: "Apps voor \"meer\"",
    edPeople: "Telefoons",
    edPerson: "Persoon (optioneel, voor de foto)",
    edName: "Naam (optioneel)",
    edApps: "Apps",
    edAppsHint: "Geef een app een andere naam of kleur, of verberg hem. Geldt voor deze kaart.",
    edHide: "{app} verbergen",
    edShow: "{app} tonen",
    edColor: "Kleur voor {app}",
    edReset: "Herstellen",
  },
  de: {
    today: "Heute",
    vsYesterday: "ggü. gestern",
    vsAverage: "ggü. 7-Tage-Schnitt",
    appsUsed: "Genutzte Apps",
    same: "gleich",
    of: "von {value}",
    avg: "Ø {value}",
    left: "noch {value}",
    over: "{value} drüber",
    noLimit: "Kein Limit",
    noLimitShort: "kein Limit",
    more: "+ {n} weitere",
    less: "Weniger",
    synced: "Synchronisiert {when}",
    thisWeek: "Diese Woche",
    perDay: "pro Tag im Schnitt",
    overDays: "{n} von {total} über dem Limit",
    other: "Sonstige",
    family: "Familie",
    devices: "Heute, {n} Geräte",
    dayApps: "Apps an dem Tag",
    noDayApps: "Schalte auf der Geräteseite des Telefons App-Sensoren ein, um die Apps pro Tag zu sehen.",
    noStats: "Noch kein Verlauf: die Woche füllt sich mit den Tagen.",
    noApps: "Heute noch keine Apps gemeldet.",
    pickTitle: "Telefon auswählen",
    pickBody: "Wähle in den Karteneinstellungen einen Bildschirmzeit-Sensor.",
    missingTitle: "Sensor nicht gefunden",
    missingBody: "{entity} gibt es nicht. Prüfe die Entität in den Karteneinstellungen.",
    unavailableTitle: "Bildschirmzeit nicht verfügbar",
    unavailableBody: "{entity} ist gerade nicht verfügbar.",
    familyEmpty: "Füge die Telefone der Familie in den Karteneinstellungen hinzu.",
    edEntity: "Bildschirmzeit heute",
    edTitle: "Titel (optional)",
    edLimit: "Tageslimit (optional)",
    edShown: "Apps vor \"weitere\"",
    edPeople: "Telefone",
    edPerson: "Person (optional, für das Bild)",
    edName: "Name (optional)",
    edApps: "Apps",
    edAppsHint: "Benenne eine App um, gib ihr eine eigene Farbe oder blende sie aus. Gilt für diese Karte.",
    edHide: "{app} ausblenden",
    edShow: "{app} einblenden",
    edColor: "Farbe für {app}",
    edReset: "Zurücksetzen",
  },
  es: {
    today: "Hoy",
    vsYesterday: "vs. ayer",
    vsAverage: "vs. media de 7 días",
    appsUsed: "Apps usadas",
    same: "igual",
    of: "de {value}",
    avg: "media {value}",
    left: "quedan {value}",
    over: "{value} de más",
    noLimit: "Sin límite",
    noLimitShort: "sin límite",
    more: "+ {n} más",
    less: "Mostrar menos",
    synced: "Sincronizado {when}",
    thisWeek: "Esta semana",
    perDay: "de media al día",
    overDays: "{n} de {total} por encima del límite",
    other: "Otras",
    family: "Familia",
    devices: "Hoy, {n} dispositivos",
    dayApps: "Apps de ese día",
    noDayApps: "Activa los sensores de apps en la página del dispositivo del teléfono para ver las apps por día.",
    noStats: "Aún no hay historial: la semana se completa con los días.",
    noApps: "Hoy aún no hay apps.",
    pickTitle: "Elige un teléfono",
    pickBody: "Elige un sensor de tiempo de pantalla en los ajustes de la tarjeta.",
    missingTitle: "Sensor no encontrado",
    missingBody: "{entity} no existe. Revisa la entidad en los ajustes de la tarjeta.",
    unavailableTitle: "Tiempo de pantalla no disponible",
    unavailableBody: "{entity} no está disponible ahora.",
    familyEmpty: "Añade los teléfonos de la familia en los ajustes de la tarjeta.",
    edEntity: "Tiempo de pantalla hoy",
    edTitle: "Título (opcional)",
    edLimit: "Límite diario (opcional)",
    edShown: "Apps antes de \"más\"",
    edPeople: "Teléfonos",
    edPerson: "Persona (opcional, para la foto)",
    edName: "Nombre (opcional)",
    edApps: "Apps",
    edAppsHint: "Cambia el nombre de una app, dale tu propio color u ocúltala. Solo en esta tarjeta.",
    edHide: "Ocultar {app}",
    edShow: "Mostrar {app}",
    edColor: "Color de {app}",
    edReset: "Restablecer",
  },
  fr: {
    today: "Aujourd'hui",
    vsYesterday: "vs hier",
    vsAverage: "vs moyenne sur 7 jours",
    appsUsed: "Apps utilisées",
    same: "pareil",
    of: "sur {value}",
    avg: "moy. {value}",
    left: "reste {value}",
    over: "{value} de trop",
    noLimit: "Sans limite",
    noLimitShort: "sans limite",
    more: "+ {n} de plus",
    less: "Afficher moins",
    synced: "Synchronisé {when}",
    thisWeek: "Cette semaine",
    perDay: "par jour en moyenne",
    overDays: "{n} sur {total} au-dessus de la limite",
    other: "Autres",
    family: "Famille",
    devices: "Aujourd'hui, {n} appareils",
    dayApps: "Apps de ce jour",
    noDayApps: "Activez les capteurs d'apps sur la page de l'appareil du téléphone pour voir les apps par jour.",
    noStats: "Pas encore d'historique : la semaine se remplit au fil des jours.",
    noApps: "Aucune app pour l'instant aujourd'hui.",
    pickTitle: "Choisissez un téléphone",
    pickBody: "Choisissez un capteur de temps d'écran dans les réglages de la carte.",
    missingTitle: "Capteur introuvable",
    missingBody: "{entity} n'existe pas. Vérifiez l'entité dans les réglages de la carte.",
    unavailableTitle: "Temps d'écran indisponible",
    unavailableBody: "{entity} est indisponible pour le moment.",
    familyEmpty: "Ajoutez les téléphones de la famille dans les réglages de la carte.",
    edEntity: "Temps d'écran aujourd'hui",
    edTitle: "Titre (facultatif)",
    edLimit: "Limite quotidienne (facultatif)",
    edShown: "Apps avant « de plus »",
    edPeople: "Téléphones",
    edPerson: "Personne (facultatif, pour la photo)",
    edName: "Nom (facultatif)",
    edApps: "Apps",
    edAppsHint: "Renommez une app, donnez-lui votre couleur ou masquez-la. Pour cette carte uniquement.",
    edHide: "Masquer {app}",
    edShow: "Afficher {app}",
    edColor: "Couleur de {app}",
    edReset: "Réinitialiser",
  },
  it: {
    today: "Oggi",
    vsYesterday: "rispetto a ieri",
    vsAverage: "rispetto alla media di 7 giorni",
    appsUsed: "App usate",
    same: "uguale",
    of: "di {value}",
    avg: "media {value}",
    left: "restano {value}",
    over: "{value} oltre",
    noLimit: "Nessun limite",
    noLimitShort: "nessun limite",
    more: "+ altre {n}",
    less: "Mostra meno",
    synced: "Sincronizzato {when}",
    thisWeek: "Questa settimana",
    perDay: "al giorno in media",
    overDays: "{n} su {total} oltre il limite",
    other: "Altre",
    family: "Famiglia",
    devices: "Oggi, {n} dispositivi",
    dayApps: "App di quel giorno",
    noDayApps: "Attiva i sensori delle app nella pagina del dispositivo del telefono per vedere le app per giorno.",
    noStats: "Ancora nessuna cronologia: la settimana si riempie con i giorni.",
    noApps: "Ancora nessuna app oggi.",
    pickTitle: "Scegli un telefono",
    pickBody: "Scegli un sensore del tempo di utilizzo nelle impostazioni della scheda.",
    missingTitle: "Sensore non trovato",
    missingBody: "{entity} non esiste. Controlla l'entità nelle impostazioni della scheda.",
    unavailableTitle: "Tempo di utilizzo non disponibile",
    unavailableBody: "{entity} non è disponibile al momento.",
    familyEmpty: "Aggiungi i telefoni della famiglia nelle impostazioni della scheda.",
    edEntity: "Tempo di utilizzo oggi",
    edTitle: "Titolo (facoltativo)",
    edLimit: "Limite giornaliero (facoltativo)",
    edShown: "App prima di \"altre\"",
    edPeople: "Telefoni",
    edPerson: "Persona (facoltativa, per la foto)",
    edName: "Nome (facoltativo)",
    edApps: "App",
    edAppsHint: "Rinomina un'app, dalle un tuo colore o nascondila. Solo in questa scheda.",
    edHide: "Nascondi {app}",
    edShow: "Mostra {app}",
    edColor: "Colore di {app}",
    edReset: "Ripristina",
  },
  pt: {
    today: "Hoje",
    vsYesterday: "vs. ontem",
    vsAverage: "vs. média de 7 dias",
    appsUsed: "Apps usados",
    same: "igual",
    of: "de {value}",
    avg: "média {value}",
    left: "faltam {value}",
    over: "{value} a mais",
    noLimit: "Sem limite",
    noLimitShort: "sem limite",
    more: "+ {n} mais",
    less: "Mostrar menos",
    synced: "Sincronizado {when}",
    thisWeek: "Esta semana",
    perDay: "por dia em média",
    overDays: "{n} de {total} acima do limite",
    other: "Outros",
    family: "Família",
    devices: "Hoje, {n} dispositivos",
    dayApps: "Apps naquele dia",
    noDayApps: "Ative os sensores de apps na página do dispositivo do celular para ver os apps por dia.",
    noStats: "Ainda sem histórico: a semana se completa com os dias.",
    noApps: "Nenhum app hoje ainda.",
    pickTitle: "Escolha um celular",
    pickBody: "Escolha um sensor de tempo de tela nas configurações do cartão.",
    missingTitle: "Sensor não encontrado",
    missingBody: "{entity} não existe. Confira a entidade nas configurações do cartão.",
    unavailableTitle: "Tempo de tela indisponível",
    unavailableBody: "{entity} está indisponível agora.",
    familyEmpty: "Adicione os celulares da família nas configurações do cartão.",
    edEntity: "Tempo de tela hoje",
    edTitle: "Título (opcional)",
    edLimit: "Limite diário (opcional)",
    edShown: "Apps antes de \"mais\"",
    edPeople: "Celulares",
    edPerson: "Pessoa (opcional, para a foto)",
    edName: "Nome (opcional)",
    edApps: "Apps",
    edAppsHint: "Renomeie um app, dê a ele sua própria cor ou oculte-o. Só neste cartão.",
    edHide: "Ocultar {app}",
    edShow: "Mostrar {app}",
    edColor: "Cor de {app}",
    edReset: "Redefinir",
  },
  ja: {
    today: "今日",
    vsYesterday: "昨日と比較",
    vsAverage: "7日間の平均と比較",
    appsUsed: "使用したアプリ",
    same: "同じ",
    of: "{value} 中",
    avg: "平均 {value}",
    left: "残り {value}",
    over: "{value} 超過",
    noLimit: "制限なし",
    noLimitShort: "制限なし",
    more: "+ ほか {n} 件",
    less: "表示を減らす",
    synced: "同期 {when}",
    thisWeek: "今週",
    perDay: "1日あたりの平均",
    overDays: "{total} 日中 {n} 日が制限超過",
    other: "その他",
    family: "家族",
    devices: "今日、{n} 台のデバイス",
    dayApps: "その日のアプリ",
    noDayApps: "日ごとのアプリを見るには、スマートフォンのデバイスページでアプリのセンサーを有効にしてください。",
    noStats: "まだ履歴がありません。日が経つにつれて週が埋まります。",
    noApps: "今日はまだアプリの記録がありません。",
    pickTitle: "スマートフォンを選択",
    pickBody: "カードの設定でスクリーンタイムのセンサーを選んでください。",
    missingTitle: "センサーが見つかりません",
    missingBody: "{entity} は存在しません。カードの設定でエンティティを確認してください。",
    unavailableTitle: "スクリーンタイムを利用できません",
    unavailableBody: "{entity} は現在利用できません。",
    familyEmpty: "カードの設定で家族のスマートフォンを追加してください。",
    edEntity: "今日のスクリーンタイム",
    edTitle: "タイトル (任意)",
    edLimit: "1日の制限 (任意)",
    edShown: "「ほか」の前に表示するアプリ数",
    edPeople: "スマートフォン",
    edPerson: "人物 (任意、写真用)",
    edName: "名前 (任意)",
    edApps: "アプリ",
    edAppsHint: "アプリの名前や色を変えたり、非表示にしたりできます。このカードにのみ適用されます。",
    edHide: "{app} を非表示",
    edShow: "{app} を表示",
    edColor: "{app} の色",
    edReset: "リセット",
  },
  zh: {
    today: "今天",
    vsYesterday: "与昨天相比",
    vsAverage: "与 7 天平均相比",
    appsUsed: "使用的应用",
    same: "相同",
    of: "共 {value}",
    avg: "平均 {value}",
    left: "剩余 {value}",
    over: "超出 {value}",
    noLimit: "无限制",
    noLimitShort: "无限制",
    more: "+ 另外 {n} 个",
    less: "收起",
    synced: "已同步 {when}",
    thisWeek: "本周",
    perDay: "每天平均",
    overDays: "{total} 天中有 {n} 天超出限制",
    other: "其他",
    family: "家庭",
    devices: "今天，{n} 台设备",
    dayApps: "当天的应用",
    noDayApps: "在手机的设备页面中启用应用传感器，即可查看每天的应用。",
    noStats: "还没有历史记录：一周会随着时间逐渐填满。",
    noApps: "今天还没有应用记录。",
    pickTitle: "选择手机",
    pickBody: "请在卡片设置中选择屏幕使用时间传感器。",
    missingTitle: "未找到传感器",
    missingBody: "{entity} 不存在。请在卡片设置中检查实体。",
    unavailableTitle: "屏幕使用时间不可用",
    unavailableBody: "{entity} 目前不可用。",
    familyEmpty: "请在卡片设置中添加家人的手机。",
    edEntity: "今天的屏幕使用时间",
    edTitle: "标题（可选）",
    edLimit: "每日限制（可选）",
    edShown: "“另外”之前显示的应用数",
    edPeople: "手机",
    edPerson: "人员（可选，用于照片）",
    edName: "名称（可选）",
    edApps: "应用",
    edAppsHint: "为应用重命名、设置颜色或隐藏它。仅对此卡片生效。",
    edHide: "隐藏 {app}",
    edShow: "显示 {app}",
    edColor: "{app} 的颜色",
    edReset: "重置",
  },
  hi: {
    today: "आज",
    vsYesterday: "कल की तुलना में",
    vsAverage: "7 दिन के औसत की तुलना में",
    appsUsed: "इस्तेमाल किए गए ऐप",
    same: "बराबर",
    of: "{value} में से",
    avg: "औसत {value}",
    left: "{value} बाकी",
    over: "{value} ज़्यादा",
    noLimit: "कोई सीमा नहीं",
    noLimitShort: "कोई सीमा नहीं",
    more: "+ {n} और",
    less: "कम दिखाएँ",
    synced: "सिंक हुआ {when}",
    thisWeek: "इस हफ़्ते",
    perDay: "प्रति दिन औसत",
    overDays: "{total} में से {n} दिन सीमा से ज़्यादा",
    other: "अन्य",
    family: "परिवार",
    devices: "आज, {n} डिवाइस",
    dayApps: "उस दिन के ऐप",
    noDayApps: "हर दिन के ऐप देखने के लिए फ़ोन के डिवाइस पेज पर ऐप सेंसर चालू करें।",
    noStats: "अभी कोई इतिहास नहीं: दिनों के साथ हफ़्ता भरता जाएगा।",
    noApps: "आज अभी तक कोई ऐप नहीं।",
    pickTitle: "फ़ोन चुनें",
    pickBody: "कार्ड की सेटिंग में स्क्रीन टाइम सेंसर चुनें।",
    missingTitle: "सेंसर नहीं मिला",
    missingBody: "{entity} मौजूद नहीं है। कार्ड की सेटिंग में एंटिटी जाँचें।",
    unavailableTitle: "स्क्रीन टाइम उपलब्ध नहीं",
    unavailableBody: "{entity} अभी उपलब्ध नहीं है।",
    familyEmpty: "कार्ड की सेटिंग में परिवार के फ़ोन जोड़ें।",
    edEntity: "आज का स्क्रीन टाइम",
    edTitle: "शीर्षक (वैकल्पिक)",
    edLimit: "दैनिक सीमा (वैकल्पिक)",
    edShown: "\"और\" से पहले ऐप",
    edPeople: "फ़ोन",
    edPerson: "व्यक्ति (वैकल्पिक, फ़ोटो के लिए)",
    edName: "नाम (वैकल्पिक)",
    edApps: "ऐप",
    edAppsHint: "किसी ऐप का नाम बदलें, उसे अपना रंग दें या छिपाएँ। सिर्फ़ इस कार्ड पर लागू।",
    edHide: "{app} छिपाएँ",
    edShow: "{app} दिखाएँ",
    edColor: "{app} का रंग",
    edReset: "रीसेट करें",
  },
  ar: {
    today: "اليوم",
    vsYesterday: "مقارنة بالأمس",
    vsAverage: "مقارنة بمتوسط 7 أيام",
    appsUsed: "التطبيقات المستخدمة",
    same: "نفسه",
    of: "من {value}",
    avg: "المتوسط {value}",
    left: "متبقٍ {value}",
    over: "تجاوز بمقدار {value}",
    noLimit: "بلا حد",
    noLimitShort: "بلا حد",
    more: "+ {n} أخرى",
    less: "عرض أقل",
    synced: "تمت المزامنة {when}",
    thisWeek: "هذا الأسبوع",
    perDay: "في اليوم في المتوسط",
    overDays: "{n} من {total} فوق الحد",
    other: "أخرى",
    family: "العائلة",
    devices: "اليوم، {n} أجهزة",
    dayApps: "تطبيقات ذلك اليوم",
    noDayApps: "فعّل مستشعرات التطبيقات في صفحة جهاز الهاتف لرؤية التطبيقات لكل يوم.",
    noStats: "لا يوجد سجل بعد: يمتلئ الأسبوع مع مرور الأيام.",
    noApps: "لا توجد تطبيقات اليوم بعد.",
    pickTitle: "اختر هاتفًا",
    pickBody: "اختر مستشعر وقت الشاشة في إعدادات البطاقة.",
    missingTitle: "لم يتم العثور على المستشعر",
    missingBody: "{entity} غير موجود. تحقق من الكيان في إعدادات البطاقة.",
    unavailableTitle: "وقت الشاشة غير متاح",
    unavailableBody: "{entity} غير متاح الآن.",
    familyEmpty: "أضف هواتف العائلة في إعدادات البطاقة.",
    edEntity: "وقت الشاشة اليوم",
    edTitle: "العنوان (اختياري)",
    edLimit: "الحد اليومي (اختياري)",
    edShown: "التطبيقات قبل \"أخرى\"",
    edPeople: "الهواتف",
    edPerson: "الشخص (اختياري، للصورة)",
    edName: "الاسم (اختياري)",
    edApps: "التطبيقات",
    edAppsHint: "غيّر اسم تطبيق أو امنحه لونك الخاص أو أخفه. ينطبق على هذه البطاقة فقط.",
    edHide: "إخفاء {app}",
    edShow: "إظهار {app}",
    edColor: "لون {app}",
    edReset: "إعادة التعيين",
  },
};

/** Every language that lacks a text English has, as [language, key]; the tests want none. */
export function missingStrings() {
  const keys = Object.keys(STRINGS.en);
  return Object.entries(STRINGS).flatMap(([language, table]) =>
    keys.filter((key) => typeof table[key] !== "string").map((key) => [language, key]));
}

export function translate(language, key, values = {}) {
  const base = String(language || "en").split("-")[0].toLowerCase();
  const template = STRINGS[base]?.[key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
}

// ---------------------------------------------------------------- data

const UNIT_MINUTES = { d: 1440, h: 60, min: 1, s: 1 / 60, ms: 1 / 60000 };

/** Minutes in a state, from its unit; a duration sensor without a unit counts in minutes. */
export function toMinutes(stateObj) {
  if (!stateObj || typeof stateObj.state !== "string" || stateObj.state.trim() === "") return null;
  const value = Number(stateObj.state);
  if (!Number.isFinite(value) || value < 0) return null;
  const factor = UNIT_MINUTES[stateObj.attributes?.unit_of_measurement] ?? 1;
  return value * factor;
}

/** "3:30", "3h30", 210, or { hours, minutes } from the duration selector, in minutes. */
export function parseLimit(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value === "object") {
    const total = (Number(value.days) || 0) * 1440 + (Number(value.hours) || 0) * 60 +
      (Number(value.minutes) || 0) + (Number(value.seconds) || 0) / 60;
    return total > 0 ? total : 0;
  }
  const text = String(value).trim().toLowerCase();
  let match = /^(\d+):(\d{1,2})$/.exec(text);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  match = /^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?$/.exec(text);
  if (match && (match[1] || match[2])) return (Number(match[1]) || 0) * 60 + (Number(match[2]) || 0);
  const minutes = Number(text);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

/** "YouTube (50 min), WhatsApp (33 min)" into rows, for sources without a list. */
export function parseTopApps(text) {
  if (typeof text !== "string") return [];
  // Each entry ends in "(N min)" followed by a comma or the end, so a name may hold both.
  return [...text.matchAll(/\s*(.+?)\s*\((\d+(?:\.\d+)?)\s*min\)\s*(?:,|$)/g)]
    .map((match) => ({ package: null, name: match[1], minutes: Number(match[2]) }));
}

function cleanRow(row, packageKey) {
  if (!row || typeof row !== "object") return null;
  const rawPkg = row.package ?? row.app_id ?? packageKey;
  const pkg = typeof rawPkg === "string" && rawPkg ? rawPkg : null;
  const minutes = Number(row.minutes ?? row.usage_minutes ?? row.total_minutes);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  const name = [row.name, row.app_name, row.app].find((value) => typeof value === "string" && value.trim())?.trim() ?? null;
  if (!pkg && !name) return null;
  return { package: pkg, name, minutes };
}

/** An `apps` attribute as a list of rows or an object keyed by package. */
export function readAppsAttribute(apps) {
  if (Array.isArray(apps)) return apps.map((row) => cleanRow(row)).filter(Boolean);
  if (apps && typeof apps === "object") {
    return Object.entries(apps).map(([pkg, row]) => cleanRow(row, pkg)).filter(Boolean);
  }
  return [];
}

/** The entity registry entries on the same device, by translation key. */
export function siblings(hass, entityId, key) {
  const entities = hass?.entities ?? {};
  const device = entities[entityId]?.device_id;
  if (!device) return [];
  return Object.values(entities).filter(
    (entry) => entry.device_id === device && entry.translation_key === key &&
      (!entry.platform || entry.platform === PLATFORM),
  ).map((entry) => entry.entity_id);
}

/** Every other entity on the same device, of any integration. */
export function deviceMates(hass, entityId) {
  const entities = hass?.entities ?? {};
  const device = entities[entityId]?.device_id;
  if (!device) return [];
  return Object.values(entities)
    .filter((entry) => entry.device_id === device && entry.entity_id !== entityId)
    .map((entry) => entry.entity_id);
}

/**
 * The entities a parental control integration keeps for the same child: on the same
 * device, or carrying the same `child_name` (Family Link puts the time limits on a device
 * of its own under the child).
 */
export function childMates(hass, entityId) {
  const mates = new Set(deviceMates(hass, entityId));
  const child = hass?.states?.[entityId]?.attributes?.child_name;
  if (typeof child === "string" && child) {
    for (const [id, stateObj] of Object.entries(hass?.states ?? {})) {
      if (id !== entityId && stateObj?.attributes?.child_name === child) mates.add(id);
    }
  }
  return [...mates];
}

/**
 * The daily limit the parental control app already has, in minutes: Family Link's
 * `daily_limit_minutes` when its limit is on, Family Safety's `allowance_minutes` when its
 * limits are on. 0 when there is none; a limit in the card's settings always wins.
 */
export function sourceLimit(hass, entityId) {
  let limit = 0;
  for (const id of childMates(hass, entityId)) {
    const attributes = hass.states?.[id]?.attributes ?? {};
    let minutes = 0;
    if (attributes.daily_limit_enabled === true) minutes = Number(attributes.daily_limit_minutes);
    else if (attributes.allowance_minutes !== undefined && attributes.limits_enabled !== false) {
      minutes = Number(attributes.allowance_minutes);
    }
    if (Number.isFinite(minutes) && minutes > limit) limit = minutes;
  }
  return limit;
}

/** Today's apps for a phone: the list attribute, else the app sensors, else top_apps. */
export function readApps(hass, entityId) {
  const stateObj = hass?.states?.[entityId];
  const attributes = stateObj?.attributes ?? {};
  const listed = readAppsAttribute(attributes.apps);
  if (listed.length) return merge(listed);
  // Family Safety keeps the apps of a child on a sensor of their own on the same device.
  for (const id of deviceMates(hass, entityId)) {
    const rows = readAppsAttribute(hass.states?.[id]?.attributes?.applications);
    if (rows.length) return merge(rows);
  }
  const fromSensors = [];
  for (const id of siblings(hass, entityId, KEY.app)) {
    const app = hass.states[id];
    if (!app) continue;
    const minutes = toMinutes(app);
    if (minutes === null) continue;
    // A sensor for another day (the phone did not send it today) reads 0 or yesterday.
    if (attributes.date && app.attributes?.date && app.attributes.date !== attributes.date) continue;
    fromSensors.push({ package: app.attributes?.package ?? null, name: app.attributes?.app ?? null, minutes });
  }
  const top = parseTopApps(attributes.top_apps);
  const known = new Set(fromSensors.map((row) => (row.name || "").toLowerCase()));
  for (const row of top) if (!known.has(row.name.toLowerCase())) fromSensors.push(row);
  return merge(fromSensors);
}

function merge(rows) {
  const byKey = new Map();
  for (const row of rows) {
    const key = row.package || `name:${(row.name || "").toLowerCase()}`;
    const held = byKey.get(key);
    if (!held || row.minutes > held.minutes) byKey.set(key, row);
  }
  return [...byKey.values()].filter((row) => row.minutes > 0).sort((a, b) => b.minutes - a.minutes);
}

/**
 * The screen time sensors the cards can read, for the pickers and the stubs: Life
 * Dashboard's "screen time today", then the daily screen time of Family Link and Family
 * Safety (in minutes, a duration, and not the time remaining or the formatted text).
 */
export function screenTimeEntities(hass) {
  const entries = Object.values(hass?.entities ?? {});
  const ours = entries
    .filter((entry) => entry.translation_key === KEY.today && (!entry.platform || entry.platform === PLATFORM))
    .map((entry) => entry.entity_id);
  const parental = entries
    .filter((entry) => PARENTAL.has(entry.platform) && entry.entity_id.startsWith("sensor.") &&
      /screen_time/.test(entry.entity_id) && !/remaining|formatted|policy/.test(entry.entity_id))
    .map((entry) => entry.entity_id)
    .filter((id) => {
      const attributes = hass.states?.[id]?.attributes ?? {};
      return attributes.device_class === "duration" && attributes.unit_of_measurement === "min";
    });
  const found = [...ours, ...parental].filter((id) => hass.states?.[id]);
  if (found.length) return found;
  return Object.keys(hass?.states ?? {}).filter((id) => id.startsWith("sensor.") && id.endsWith("_screen_time_today"));
}

export function statusOf(total, limit) {
  if (!limit) return { tone: "none", key: "noLimit", value: 0 };
  if (total > limit) return { tone: "over", key: "over", value: total - limit };
  if (total >= limit * 0.8) return { tone: "warn", key: "left", value: limit - total };
  return { tone: "ok", key: "left", value: limit - total };
}

/** Package names as long-term statistic ids: lowercase, every other character "_". */
export function appStatisticId(entryId, pkg) {
  return `${PLATFORM}:${String(entryId).toLowerCase()}_app_${String(pkg).toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
}

/** Day keys, oldest first, ending today, in the given time zone. */
export function dayKeys(now, count, timeZone) {
  const keys = [];
  for (let back = count - 1; back >= 0; back -= 1) keys.push(dayKey(now - back * DAY, timeZone));
  return [...new Set(keys)];
}

export function dayKey(instant, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(instant));
}

/** Statistics rows (change or max per day) into minutes per day key. */
export function perDay(rows, factor, timeZone, field = "change") {
  const out = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const value = Number(row?.[field]);
    const start = typeof row?.start === "number" ? row.start : Date.parse(row?.start);
    if (!Number.isFinite(value) || !Number.isFinite(start) || value < 0) continue;
    // Noon of the period, so a day that starts at 23:00 UTC still lands on its own date.
    const key = dayKey(start + DAY / 2, timeZone);
    out.set(key, (out.get(key) ?? 0) + value * factor);
  }
  return out;
}

export function mean(values) {
  const list = values.filter((value) => Number.isFinite(value) && value > 0);
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
}

// ---------------------------------------------------------------- formatting

const unitFormats = new Map();
function unitFormat(language, unit) {
  const key = `${language}|${unit}`;
  if (!unitFormats.has(key)) {
    unitFormats.set(key, new Intl.NumberFormat(language, { style: "unit", unit, unitDisplay: "narrow" }));
  }
  return unitFormats.get(key);
}

/** "3h 16m" in the user's language. */
export function formatDuration(minutes, language = "en") {
  if (!(minutes >= 0) || !Number.isFinite(minutes)) return "";
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours && rest) {
    return `${unitFormat(language, "hour").format(hours)} ${unitFormat(language, "minute").format(rest)}`;
  }
  return hours ? unitFormat(language, "hour").format(hours) : unitFormat(language, "minute").format(rest);
}

function relativeTime(instant, language) {
  const seconds = Math.round((instant - Date.now()) / 1000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return format.format(0, "minute");
  if (abs < 3600) return format.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return format.format(Math.round(seconds / 3600), "hour");
  return format.format(Math.round(seconds / 86400), "day");
}

export function localeSettings(hass) {
  const locale = hass?.locale ?? {};
  const language = locale.language || hass?.language || "en";
  const timeZone = locale.time_zone === "server" ? hass?.config?.time_zone || undefined : undefined;
  return { language, timeZone };
}

// ---------------------------------------------------------------- apps

/** Name, background, icon and glyph color of an app, after the card's own overrides. */
export function appLook(row, overrides = {}) {
  const own = (row.package && overrides[row.package]) || {};
  const known = (row.package && CATALOG.get(row.package)) ||
    (!row.package && row.name && CATALOG_BY_NAME.get(row.name.toLowerCase())) || {};
  const name = own.name || row.name || known.name || shortName(row.package) || "?";
  const color = own.color || known.color || hashColor(row.package || name);
  const icon = own.icon || known.icon || null;
  return { name, color, icon, glyph: readableOn(color), hidden: own.hidden === true };
}

function shortName(pkg) {
  if (typeof pkg !== "string") return null;
  const last = pkg.split(".").filter(Boolean).pop() || pkg;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export function hashColor(text) {
  let hash = 0;
  for (const ch of String(text)) hash = (hash * 31 + ch.codePointAt(0)) % 360;
  return `hsl(${hash} 45% 42%)`;
}

/** White on dark backgrounds, near-black on light ones such as Snapchat's yellow. */
export function readableOn(color) {
  const value = luminance(color);
  return value !== null && value > 0.45 ? "#111" : "#fff";
}

function luminance(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** A bar in the app's color; near-black brands (TikTok, X) get the text color instead. */
export function barColor(color) {
  if (color.startsWith("linear-gradient")) return "#D62976";
  return luminance(color) !== null && luminance(color) < 0.02 ? "var(--_ink)" : color;
}

export function catalogSize() {
  return CATALOG.size;
}

// ---------------------------------------------------------------- DOM

// DOM is only ever built through these helpers: values reach the page as text nodes and
// attribute values, never as markup.
function el(tag, attributes = {}, ...children) {
  return applyTo(document.createElement(tag), attributes, children);
}
function svg(tag, attributes = {}, ...children) {
  return applyTo(document.createElementNS("http://www.w3.org/2000/svg", tag), attributes, children);
}
function applyTo(node, attributes, children) {
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === "style" && typeof value === "object") {
      for (const [prop, v] of Object.entries(value)) if (v !== undefined && v !== null) node.style.setProperty(prop, String(v));
    } else node.setAttribute(name, String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function appIcon(look, small = false) {
  const tile = el("span", {
    class: small ? "ico sm" : "ico",
    style: { background: look.color, color: look.glyph },
    title: look.name,
    "aria-hidden": "true",
  });
  if (look.icon) tile.append(el("ha-icon", { icon: look.icon }));
  else tile.append(Array.from(look.name)[0]?.toUpperCase() ?? "?");
  return tile;
}

const STYLE = `
  :host {
    --_ok: var(--life-dashboard-screen-time-ok, var(--success-color, #43a047));
    --_warn: var(--life-dashboard-screen-time-warn, var(--warning-color, #ffa600));
    --_over: var(--life-dashboard-screen-time-over, var(--error-color, #db4437));
    --_ink: var(--primary-text-color, #1c1c1c);
    --_muted: var(--secondary-text-color, #5f6368);
    --_hairline: var(--divider-color, rgba(127, 127, 127, 0.25));
    --_track: color-mix(in srgb, var(--_ink) 9%, transparent);
    --_accent: var(--primary-color, #03a9f4);
    display: block;
    height: 100%;
  }
  ha-card { height: 100%; box-sizing: border-box; }
  .root { container-type: inline-size; padding: 16px; color: var(--_ink); }
  button { font: inherit; color: inherit; }
  button:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }

  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; min-height: 36px; }
  .chip { width: 36px; height: 36px; border-radius: var(--ha-tile-icon-border-radius, 12px); flex: none;
    display: grid; place-items: center; color: var(--_accent);
    background: color-mix(in srgb, var(--_accent) 18%, transparent); --mdc-icon-size: 20px; }
  .head .t { font-weight: 500; font-size: 15px; line-height: 1.3; }
  .head .s { color: var(--_muted); font-size: 12.5px; }

  .hero { display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 16px; align-items: center; margin-bottom: 14px; }
  .ring { position: relative; width: 116px; height: 116px; }
  .ring svg { width: 100%; height: 100%; transform: rotate(-90deg); display: block; }
  .ring .c { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
  .ring .v { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .ring .l { font-size: 11.5px; color: var(--_muted); margin-top: 2px; }
  .cmp { display: grid; gap: 7px; min-width: 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13px; }
  .row .k { color: var(--_muted); }
  .row .d { font-weight: 500; font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .row .d.down { color: var(--_ok); }
  .row .d ha-icon { --mdc-icon-size: 14px; }
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px;
    font-weight: 600; width: fit-content; white-space: nowrap; }
  .pill.ok { color: var(--_ok); background: color-mix(in srgb, var(--_ok) 16%, transparent); }
  .pill.warn { color: var(--_warn); background: color-mix(in srgb, var(--_warn) 18%, transparent); }
  .pill.over { color: var(--_over); background: color-mix(in srgb, var(--_over) 16%, transparent); }
  .pill.none { color: var(--_muted); background: var(--_track); }

  .apps { display: grid; gap: 2px; }
  .app { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; align-items: center; padding: 6px 2px; }
  .app .n { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; }
  .app .n span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .app .m { color: var(--_muted); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .bar { height: 6px; border-radius: 3px; background: var(--_track); margin-top: 6px; overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 3px; }
  .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex: none;
    font-weight: 700; font-size: 15px; --mdc-icon-size: 21px; overflow: hidden;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--_ink) 10%, transparent); }
  .ico.sm { width: 22px; height: 22px; border-radius: 7px; font-size: 11px; --mdc-icon-size: 14px; }
  .more { margin-top: 6px; width: 100%; background: none; border: 1px dashed var(--_hairline); border-radius: 12px;
    padding: 8px; cursor: pointer; color: var(--_muted); display: flex; justify-content: center; align-items: center; gap: 4px; }
  .more:hover { color: var(--_ink); }
  .more ha-icon { --mdc-icon-size: 18px; }
  .foot { margin-top: 10px; color: var(--_muted); font-size: 12px; display: flex; align-items: center; gap: 6px; --mdc-icon-size: 14px; }

  .wk-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
  .wk-top .v { font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .wk-top .k { color: var(--_muted); font-size: 13px; }
  .plot { position: relative; height: 140px; display: grid; grid-template-columns: repeat(var(--days), 1fr);
    gap: 8px; align-items: end; padding-top: 10px; }
  .lim { position: absolute; left: 0; right: 0; border-top: 1.5px dashed var(--_muted); opacity: 0.7; pointer-events: none; }
  .lim span { position: absolute; right: 0; top: -17px; font-size: 11px; color: var(--_muted);
    background: var(--ha-card-background, var(--card-background-color, #fff)); padding: 0 2px; }
  .day { height: 100%; display: flex; flex-direction: column; justify-content: flex-end; background: none; border: 0;
    padding: 0; cursor: pointer; border-radius: 6px; }
  .day i { display: block; min-height: 3px; border-radius: 6px 6px 3px 3px; background: var(--_track); }
  .day.over i { background: color-mix(in srgb, var(--_over) 42%, var(--_track)); }
  .day.sel i { background: var(--_accent); }
  .day.sel.over i { background: var(--_over); }
  .day:hover i { filter: brightness(1.15); }
  .labels { display: grid; grid-template-columns: repeat(var(--days), 1fr); gap: 8px; margin-top: 6px;
    text-align: center; font-size: 11px; color: var(--_muted); }
  .labels .sel { color: var(--_ink); font-weight: 600; }
  .day-t { display: flex; justify-content: space-between; margin-top: 14px; font-size: 13px; }
  .day-t .k { color: var(--_muted); font-variant-numeric: tabular-nums; }
  .stack { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 2px; margin: 10px 0; }
  .stack i { display: block; height: 100%; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 12px; margin: 0; padding: 0; list-style: none; }
  .legend > li { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--_muted); }
  .legend b { color: var(--_ink); font-weight: 600; font-variant-numeric: tabular-nums; }

  .fam { display: grid; gap: 8px; }
  .pers { display: block; width: 100%; text-align: start; border: 1px solid var(--_hairline); border-radius: 14px;
    background: none; padding: 10px 12px; cursor: pointer; }
  .pers:hover { border-color: var(--_muted); }
  .pers .top { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; gap: 12px; align-items: center; }
  .av { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-weight: 700;
    color: #111; background-size: cover; background-position: center; }
  .pers .nm { font-weight: 500; }
  .pers .dv { color: var(--_muted); font-size: 12px; }
  .pers .r { text-align: end; }
  .pers .tot { font-weight: 600; font-variant-numeric: tabular-nums; }
  .pers .bar { margin-top: 10px; }
  .pers .mini { display: flex; gap: 4px; align-items: center; margin-top: 8px; }
  .pers .mini .pill { margin-inline-start: auto; }
  .pers .exp { margin-top: 10px; border-top: 1px solid var(--_hairline); padding-top: 6px; }

  .note { margin: 10px 0 0; font-size: 12.5px; color: var(--_muted); }
  .empty-figure { font-size: 19px; line-height: 1.25; font-weight: 500; }
  .empty-body { margin: 2px 0 0; font-size: 13px; line-height: 1.4; color: var(--_muted); overflow-wrap: anywhere; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
    clip-path: inset(50%); border: 0; white-space: nowrap; }

  @container (max-width: 300px) {
    .hero { grid-template-columns: 1fr; justify-items: center; }
    .cmp { width: 100%; }
  }
  @media (forced-colors: active) {
    .bar i, .day i, .stack i { background: CanvasText; forced-color-adjust: none; }
    .ring circle.val { stroke: CanvasText; }
  }
`;

// ---------------------------------------------------------------- statistics

const statsCache = new Map();

/** The phone's config entry, from the registry; null for other integrations. */
async function entryOf(hass, entityId) {
  try {
    const entry = await hass.callWS({ type: "config/entity_registry/get", entity_id: entityId });
    return entry?.platform === PLATFORM ? entry.config_entry_id : null;
  } catch {
    return null;
  }
}

/**
 * Minutes per day for the phone and per app, over the last days. Life Dashboard keeps
 * daily totals as external statistics; any other sensor that resets daily uses its own
 * statistics, where a day's maximum is that day's total.
 */
async function loadWeek(hass, entityId, packages, days, timeZone) {
  const cacheKey = `${entityId}|${days}`;
  const held = statsCache.get(cacheKey);
  const wanted = [...packages].sort().join(",");
  if (held && Date.now() - held.at < STATS_TTL && held.packages === wanted) return held.value;
  const start = new Date(Date.now() - (days + 1) * DAY).toISOString();
  const entry = await entryOf(hass, entityId);
  let value;
  if (entry) {
    const total = `${PLATFORM}:${entry.toLowerCase()}_screen_time`;
    const apps = new Map(packages.map((pkg) => [appStatisticId(entry, pkg), pkg]));
    const ids = [total, ...apps.keys()];
    const [rows, meta] = await Promise.all([
      hass.callWS({ type: "recorder/statistics_during_period", start_time: start, statistic_ids: ids,
        period: "day", types: ["change"] }),
      hass.callWS({ type: "recorder/get_statistics_metadata", statistic_ids: ids }).catch(() => []),
    ]);
    const factor = (id) => UNIT_MINUTES[meta.find((m) => m.statistic_id === id)?.statistics_unit_of_measurement] ?? 60;
    const byApp = new Map();
    for (const [id, pkg] of apps) if (rows?.[id]) byApp.set(pkg, perDay(rows[id], factor(id), timeZone));
    value = { total: perDay(rows?.[total], factor(total), timeZone), apps: byApp };
  } else {
    // A sensor that counts up through the day and resets at midnight (Family Link, Family
    // Safety) has a sum, so its day is the change; one with a state class of measurement
    // (history_stats) has a maximum, which is the day's total.
    const rows = await hass.callWS({ type: "recorder/statistics_during_period", start_time: start,
      statistic_ids: [entityId], period: "day", types: ["change", "max"] }).catch(() => ({}));
    const unit = hass.states?.[entityId]?.attributes?.unit_of_measurement;
    const own = rows?.[entityId] ?? [];
    const field = own.some((row) => Number.isFinite(row?.change)) ? "change" : "max";
    value = { total: perDay(own, UNIT_MINUTES[unit] ?? 1, timeZone, field), apps: new Map(), other: true };
  }
  statsCache.set(cacheKey, { at: Date.now(), packages: wanted, value });
  return value;
}

// ---------------------------------------------------------------- cards

const Base = globalThis.HTMLElement ?? class {};

class ScreenTimeBase extends Base {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(el("style", {}, STYLE));
    this._card = el("ha-card");
    this._root = el("div", { class: "root" });
    this._card.append(this._root);
    this.shadowRoot.append(this._card);
    this._ui = {};
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    this._check(config);
    this._config = { ...config };
    this._seen = undefined;
    if (this._hass) this._render();
  }

  _check(config) {
    if (typeof config.entity !== "string") throw new Error("Set `entity` to a screen time sensor");
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const fingerprint = this._fingerprint(hass);
    if (fingerprint === this._seen) return;
    this._seen = fingerprint;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  _entities() {
    return [this._config.entity];
  }

  _fingerprint(hass) {
    const parts = [hass?.locale?.language, hass?.locale?.time_zone];
    for (const id of this._entities()) {
      parts.push(id, hass?.states?.[id]?.last_updated);
      for (const key of [KEY.yesterday, KEY.app, KEY.sync]) {
        for (const sid of siblings(hass, id, key)) parts.push(sid, hass.states?.[sid]?.last_updated);
      }
      // The apps and the limits of a parental control integration live on other sensors.
      if (PARENTAL.has(hass?.entities?.[id]?.platform)) {
        for (const mid of childMates(hass, id)) parts.push(mid, hass.states?.[mid]?.last_updated);
      }
    }
    return JSON.stringify(parts);
  }

  getGridOptions() {
    return { columns: 6, rows: "auto", min_columns: 4 };
  }

  get _lang() {
    return localeSettings(this._hass).language;
  }

  _t(key, values) {
    return translate(this._lang, key, values);
  }

  _d(minutes) {
    return formatDuration(minutes, this._lang);
  }

  _empty(entity) {
    const stateObj = entity ? this._hass?.states?.[entity] : undefined;
    let title, body;
    if (!entity) [title, body] = [this._t("pickTitle"), this._t("pickBody")];
    else if (!stateObj) [title, body] = [this._t("missingTitle"), this._t("missingBody", { entity })];
    else if (toMinutes(stateObj) === null) [title, body] = [this._t("unavailableTitle"), this._t("unavailableBody", { entity })];
    else return null;
    return el("div", { class: "empty" }, el("div", { class: "empty-figure" }, title), el("p", { class: "empty-body" }, body));
  }

  _deviceName(entity) {
    const device = this._hass?.entities?.[entity]?.device_id;
    const record = device ? this._hass?.devices?.[device] : null;
    return record?.name_by_user || record?.name || this._hass?.states?.[entity]?.attributes?.friendly_name || entity;
  }

  _overrides() {
    return this._config.apps && typeof this._config.apps === "object" ? this._config.apps : {};
  }

  _visibleApps(entity) {
    const overrides = this._overrides();
    return readApps(this._hass, entity)
      .map((row) => ({ row, look: appLook(row, overrides) }))
      .filter((item) => !item.look.hidden);
  }

  _appRows(items) {
    const top = items.length ? items[0].row.minutes : 1;
    return items.map(({ row, look }) =>
      el("div", { class: "app" },
        appIcon(look),
        el("div", {},
          el("div", { class: "n" }, el("span", {}, look.name), el("span", { class: "m" }, this._d(row.minutes))),
          el("div", { class: "bar", "aria-hidden": "true" },
            el("i", { style: { width: `${Math.max(3, (row.minutes / top) * 100)}%`, background: barColor(look.color) } })),
        ),
      ));
  }

  _head(icon, title, subtitle) {
    return el("div", { class: "head" },
      el("span", { class: "chip", "aria-hidden": "true" }, el("ha-icon", { icon })),
      el("div", {}, el("div", { class: "t" }, title), subtitle ? el("div", { class: "s" }, subtitle) : null));
  }

  _pill(status) {
    const text = status.key === "noLimit" ? this._t("noLimit") : this._t(status.key, { value: this._d(status.value) });
    return el("span", { class: `pill ${status.tone}` }, text);
  }

  _week(entity, days) {
    const { timeZone } = localeSettings(this._hass);
    const packages = readApps(this._hass, entity).map((row) => row.package).filter(Boolean);
    const key = `${entity}|${days}|${packages.join(",")}`;
    if (this._weekKey !== key || !this._weekPromise) {
      this._weekKey = key;
      this._weekPromise = loadWeek(this._hass, entity, packages, days, timeZone)
        .then((value) => { this._weekData = { key, value }; this._render(); })
        .catch(() => { this._weekData = { key, value: { total: new Map(), apps: new Map() } }; this._render(); });
    }
    return this._weekData?.key === key ? this._weekData.value : null;
  }

  _render() {
    if (!this._hass || !this._config) return;
    this._root.replaceChildren(...[this._build()].flat(Infinity).filter(Boolean));
  }
}

class ScreenTimeCard extends ScreenTimeBase {
  static getConfigElement() {
    return document.createElement(`${TAG.today}-editor`);
  }

  static getStubConfig(hass) {
    return { entity: screenTimeEntities(hass)[0] ?? "" };
  }

  getCardSize() {
    return 6;
  }

  _build() {
    const { entity } = this._config;
    const empty = this._empty(entity);
    if (empty) return empty;
    const total = toMinutes(this._hass.states[entity]);
    const limit = parseLimit(this._config.limit) || sourceLimit(this._hass, entity);
    let yesterday = toMinutes(this._hass.states[siblings(this._hass, entity, KEY.yesterday)[0]]);
    const week = this._week(entity, WEEK_DAYS + 1);
    const { timeZone } = localeSettings(this._hass);
    let average = null;
    if (week) {
      const keys = dayKeys(Date.now(), WEEK_DAYS + 1, timeZone).slice(0, -1);
      average = mean(keys.map((key) => week.total.get(key)));
      // Sources without a sensor for yesterday (Family Link, Family Safety): from the statistics.
      if (yesterday === null && week.total.has(keys[keys.length - 1])) yesterday = week.total.get(keys[keys.length - 1]);
    }
    const status = statusOf(total, limit);
    const reference = limit || average || total || 1;
    const fraction = Math.min(total / reference, 1);
    const tone = { ok: "var(--_ok)", warn: "var(--_warn)", over: "var(--_over)", none: "var(--_accent)" }[status.tone];
    const C = 2 * Math.PI * 48;
    const items = this._visibleApps(entity);
    const shown = Math.max(1, Number(this._config.apps_shown) || 5);
    const open = this._ui.open === true;
    const list = open ? items : items.slice(0, shown);
    const appsUsed = Number(this._hass.states[entity].attributes?.app_count) || items.length;
    const syncId = siblings(this._hass, entity, KEY.sync)[0];
    const syncedAt = Date.parse(this._hass.states[syncId]?.state);

    const delta = (now, then) => {
      if (then === null || then === undefined) return null;
      const diff = Math.round(now - then);
      if (Math.abs(diff) < 1) return el("span", { class: "d" }, this._t("same"));
      return el("span", { class: diff > 0 ? "d" : "d down" },
        el("ha-icon", { icon: diff > 0 ? "mdi:arrow-up" : "mdi:arrow-down" }), this._d(Math.abs(diff)));
    };
    const label = limit ? this._t("of", { value: this._d(limit) }) : average ? this._t("avg", { value: this._d(average) }) : this._t("today");
    const ring = el("div", { class: "ring", role: "img", "aria-label": `${this._d(total)}, ${label}` },
      svg("svg", { viewBox: "0 0 112 112", "aria-hidden": "true" },
        svg("circle", { cx: 56, cy: 56, r: 48, fill: "none", stroke: "var(--_track)", "stroke-width": 8 }),
        fraction > 0 ? svg("circle", { class: "val", cx: 56, cy: 56, r: 48, fill: "none", stroke: tone, "stroke-width": 8,
          "stroke-linecap": "round", "stroke-dasharray": `${C * fraction} ${C}` }) : null),
      el("div", { class: "c" }, el("div", { class: "v" }, this._d(total)), el("div", { class: "l" }, label)));
    const rows = [
      limit ? this._pill(status) : null,
      yesterday !== null ? el("div", { class: "row" }, el("span", { class: "k" }, this._t("vsYesterday")), delta(total, yesterday)) : null,
      average ? el("div", { class: "row" }, el("span", { class: "k" }, this._t("vsAverage")), delta(total, average)) : null,
      el("div", { class: "row" }, el("span", { class: "k" }, this._t("appsUsed")), el("span", { class: "d" }, appsUsed)),
    ];
    const more = items.length > shown
      ? el("button", { type: "button", class: "more", "aria-expanded": String(open) },
        open ? this._t("less") : this._t("more", { n: items.length - shown }),
        el("ha-icon", { icon: open ? "mdi:chevron-up" : "mdi:chevron-down" }))
      : null;
    more?.addEventListener("click", () => { this._ui.open = !open; this._render(); });
    return [
      this._head("mdi:cellphone", this._config.title || this._deviceName(entity), this._t("today")),
      el("div", { class: "hero" }, ring, el("div", { class: "cmp" }, rows)),
      items.length ? el("div", { class: "apps" }, this._appRows(list)) : el("p", { class: "note" }, this._t("noApps")),
      more,
      Number.isFinite(syncedAt)
        ? el("div", { class: "foot" }, el("ha-icon", { icon: "mdi:cellphone-check" }), this._t("synced", { when: relativeTime(syncedAt, this._lang) }))
        : null,
    ];
  }
}

class ScreenTimeWeekCard extends ScreenTimeBase {
  static getConfigElement() {
    return document.createElement(`${TAG.week}-editor`);
  }

  static getStubConfig(hass) {
    return { entity: screenTimeEntities(hass)[0] ?? "" };
  }

  getCardSize() {
    return 5;
  }

  _build() {
    const { entity } = this._config;
    const empty = this._empty(entity);
    if (empty) return empty;
    const days = Math.min(14, Math.max(3, Number(this._config.days) || WEEK_DAYS));
    const { language, timeZone } = localeSettings(this._hass);
    const limit = parseLimit(this._config.limit) || sourceLimit(this._hass, entity);
    const keys = dayKeys(Date.now(), days, timeZone);
    const todayKey = keys[keys.length - 1];
    const live = toMinutes(this._hass.states[entity]) ?? 0;
    const week = this._week(entity, days);
    const totals = keys.map((key) => (key === todayKey ? Math.max(live, week?.total.get(key) ?? 0) : week?.total.get(key) ?? 0));
    const selected = Math.min(this._ui.day ?? keys.length - 1, keys.length - 1);
    const max = Math.max(...totals, limit, 1) * 1.08;
    const average = mean(totals);
    const overDays = limit ? totals.filter((value) => value > limit).length : 0;
    const weekday = new Intl.DateTimeFormat(language, { weekday: "short", timeZone: "UTC" });
    const labelOf = (key) => (key === todayKey ? this._t("today") : weekday.format(new Date(`${key}T12:00:00Z`)));

    const plot = el("div", { class: "plot", style: { "--days": keys.length }, role: "group", "aria-label": this._t("thisWeek") },
      limit ? el("div", { class: "lim", style: { bottom: `${(limit / max) * 100}%` } }, el("span", {}, this._d(limit))) : null);
    keys.forEach((key, index) => {
      const value = totals[index];
      const button = el("button", {
        type: "button",
        class: `day${index === selected ? " sel" : ""}${limit && value > limit ? " over" : ""}`,
        "aria-pressed": String(index === selected),
        "aria-label": `${labelOf(key)}, ${this._d(value)}`,
      }, el("i", { style: { height: `${(value / max) * 100}%` } }));
      button.addEventListener("click", () => { this._ui.day = index; this._render(); });
      plot.append(button);
    });
    const labels = el("div", { class: "labels", style: { "--days": keys.length }, "aria-hidden": "true" },
      keys.map((key, index) => el("span", { class: index === selected ? "sel" : "" }, labelOf(key))));

    // The apps of the chosen day: today from the phone's list, earlier days from the app statistics.
    const overrides = this._overrides();
    const dayKeyChosen = keys[selected];
    let rows;
    if (dayKeyChosen === todayKey) rows = readApps(this._hass, entity);
    else rows = [...(week?.apps ?? new Map())].map(([pkg, map]) => ({ package: pkg, name: null, minutes: map.get(dayKeyChosen) ?? 0 }));
    const named = rows.map((row) => ({ row, look: appLook(row, overrides) }))
      .filter((item) => !item.look.hidden && item.row.minutes > 0)
      .sort((a, b) => b.row.minutes - a.row.minutes).slice(0, 8);
    const dayTotal = totals[selected];
    const other = Math.max(0, dayTotal - named.reduce((sum, item) => sum + item.row.minutes, 0));
    const detail = [];
    if (named.length) {
      detail.push(el("div", { class: "stack", role: "img", "aria-label": this._t("dayApps") },
        named.map(({ row, look }) => el("i", { style: { flex: row.minutes, background: barColor(look.color) }, title: `${look.name} ${this._d(row.minutes)}` })),
        other >= 1 ? el("i", { style: { flex: other, background: "var(--_track)" } }) : null));
      detail.push(el("ul", { class: "legend" },
        named.map(({ row, look }) => el("li", {}, appIcon(look, true), look.name, " ", el("b", {}, this._d(row.minutes)))),
        other >= 1 ? el("li", {}, this._t("other"), " ", el("b", {}, this._d(other))) : null));
    } else if (dayTotal > 0 && !week?.other) {
      detail.push(el("p", { class: "note" }, this._t("noDayApps")));
    }

    return [
      this._head("mdi:calendar-week", this._config.title || this._t("thisWeek"), this._deviceName(entity)),
      el("div", { class: "wk-top" },
        el("div", {}, el("div", { class: "v" }, average ? this._d(average) : "-"), el("div", { class: "k" }, this._t("perDay"))),
        limit ? el("span", { class: `pill ${overDays ? "warn" : "ok"}` }, this._t("overDays", { n: overDays, total: keys.length })) : null),
      plot,
      labels,
      week && !week.total.size && live === 0 ? el("p", { class: "note" }, this._t("noStats")) : null,
      el("div", { class: "day-t" }, el("b", {}, labelOf(dayKeyChosen)), el("span", { class: "k" }, this._d(dayTotal))),
      detail,
    ];
  }
}

class ScreenTimeFamilyCard extends ScreenTimeBase {
  static getConfigElement() {
    return document.createElement(`${TAG.family}-editor`);
  }

  static getStubConfig(hass) {
    return { people: screenTimeEntities(hass).slice(0, 6).map((entity) => ({ entity })) };
  }

  _check(config) {
    if (config.people !== undefined && !Array.isArray(config.people)) throw new Error("`people` is a list of phones");
  }

  _people() {
    return (this._config.people ?? []).filter((person) => person && typeof person.entity === "string" && person.entity);
  }

  _entities() {
    return this._people().map((person) => person.entity);
  }

  _fingerprint(hass) {
    const base = super._fingerprint(hass);
    const pictures = this._people().map((person) => hass?.states?.[person.person]?.attributes?.entity_picture);
    return base + JSON.stringify(pictures);
  }

  getCardSize() {
    return 2 + 2 * this._people().length;
  }

  _build() {
    const people = this._people();
    if (!people.length) {
      return [this._head("mdi:account-group", this._config.title || this._t("family")),
        el("p", { class: "empty-body" }, this._t("familyEmpty"))];
    }
    const rows = people.map((person, index) => {
      const stateObj = this._hass.states[person.entity];
      const total = toMinutes(stateObj);
      const personObj = person.person ? this._hass.states[person.person] : null;
      const device = this._deviceName(person.entity);
      const name = person.name || personObj?.attributes?.friendly_name || stateObj?.attributes?.child_name || device;
      const limit = parseLimit(person.limit ?? this._config.limit) || sourceLimit(this._hass, person.entity);
      const status = statusOf(total ?? 0, limit);
      const open = this._ui.person === index;
      const items = total === null ? [] : this._visibleApps(person.entity);
      const picture = personObj?.attributes?.entity_picture;
      const color = person.color || hashColor(name);
      const tone = { ok: "var(--_ok)", warn: "var(--_warn)", over: "var(--_over)" }[status.tone];
      const button = el("button", { type: "button", class: "pers", "aria-expanded": String(open) },
        el("div", { class: "top" },
          el("span", { class: "av", "aria-hidden": "true",
            style: picture ? { "background-image": `url("${encodeURI(picture)}")` } : { background: color, color: readableOn(color) } },
          picture ? null : Array.from(name)[0]?.toUpperCase()),
          el("div", {}, el("div", { class: "nm" }, name), el("div", { class: "dv" }, name === device ? "" : device)),
          el("div", { class: "r" },
            el("div", { class: "tot" }, total === null ? "-" : this._d(total)),
            el("div", { class: "dv" }, limit ? this._t("of", { value: this._d(limit) }) : this._t("noLimitShort")))),
        limit && total !== null
          ? el("div", { class: "bar", "aria-hidden": "true" }, el("i", { style: { width: `${Math.min(100, (total / limit) * 100)}%`, background: tone } }))
          : null,
        el("div", { class: "mini" }, items.slice(0, 3).map(({ look }) => appIcon(look, true)), total === null ? null : this._pill(status)),
        open ? el("div", { class: "exp apps" }, this._appRows(items)) : null);
      button.addEventListener("click", () => { this._ui.person = open ? null : index; this._render(); });
      return button;
    });
    return [
      this._head("mdi:account-group", this._config.title || this._t("family"), this._t("devices", { n: people.length })),
      el("div", { class: "fam" }, rows),
    ];
  }
}

// ---------------------------------------------------------------- editors

const EDITOR_STYLE = `
  .apps-ed { margin-top: 20px; }
  .apps-ed h3 { font-size: 14px; font-weight: 500; margin: 0 0 4px; }
  .apps-ed p { margin: 0 0 8px; font-size: 12.5px; color: var(--secondary-text-color); }
  .er { display: grid; grid-template-columns: 34px minmax(0, 1fr) 34px 34px; gap: 8px; align-items: center;
    padding: 6px 0; border-bottom: 1px solid var(--divider-color); }
  .er:last-child { border-bottom: 0; }
  .er.off .ico, .er.off input[type="text"] { opacity: 0.45; }
  .er input[type="text"] { width: 100%; box-sizing: border-box; background: transparent; color: var(--primary-text-color);
    border: 1px solid transparent; border-radius: 8px; padding: 6px 8px; font: inherit; }
  .er input[type="text"]:hover, .er input[type="text"]:focus { border-color: var(--divider-color);
    background: var(--secondary-background-color); }
  .er .pkg { font-size: 11px; color: var(--secondary-text-color); padding-inline-start: 8px; overflow: hidden; text-overflow: ellipsis; }
  .sw { position: relative; width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--divider-color); overflow: hidden; cursor: pointer; }
  .sw input { position: absolute; inset: -8px; width: 46px; height: 46px; opacity: 0; cursor: pointer; border: 0; padding: 0; }
  .eye { background: none; border: 0; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: var(--secondary-text-color);
    display: grid; place-items: center; --mdc-icon-size: 20px; }
  .ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-weight: 700; font-size: 15px; --mdc-icon-size: 21px; }
  .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
`;

class ScreenTimeEditor extends Base {
  constructor(kind) {
    super();
    this._kind = kind;
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  get _lang() {
    return localeSettings(this._hass).language;
  }

  _schema() {
    const ids = screenTimeEntities(this._hass);
    const entity = { entity: ids.length ? { include_entities: ids } : { domain: "sensor" } };
    if (this._kind === "family") {
      return [
        { name: "title", selector: { text: {} } },
        { name: "limit", selector: { duration: {} } },
        {
          name: "people",
          selector: {
            object: {
              multiple: true,
              label_field: "name",
              fields: {
                entity: { required: true, selector: entity, label: translate(this._lang, "edEntity") },
                name: { selector: { text: {} }, label: translate(this._lang, "edName") },
                person: { selector: { entity: { domain: "person" } }, label: translate(this._lang, "edPerson") },
                limit: { selector: { duration: {} }, label: translate(this._lang, "edLimit") },
              },
            },
          },
        },
      ];
    }
    const schema = [
      { name: "entity", required: true, selector: entity },
      { name: "title", selector: { text: {} } },
      { name: "limit", selector: { duration: {} } },
    ];
    if (this._kind === "today") schema.push({ name: "apps_shown", selector: { number: { min: 3, max: 12, mode: "slider" } } });
    return schema;
  }

  _label(name) {
    const key = { entity: "edEntity", title: "edTitle", limit: "edLimit", apps_shown: "edShown", people: "edPeople" }[name];
    return translate(this._lang, key ?? name);
  }

  _emit(config) {
    for (const [key, value] of Object.entries(config)) {
      if (value === "" || value === undefined || value === null) delete config[key];
    }
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  _render() {
    if (!this.shadowRoot || !this.isConnected || !this._hass) return;
    if (!customElements.get("ha-form")) {
      if (!this._waiting) {
        this._waiting = true;
        customElements.whenDefined("ha-form").then(() => this._render());
      }
      return;
    }
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (item) => item.label ?? this._label(item.name);
      this._form.addEventListener("value-changed", (event) => {
        event.stopPropagation();
        this._emit({ ...this._config, ...event.detail.value });
      });
      this._appsBox = el("div", { class: "apps-ed" });
      this.shadowRoot.replaceChildren(el("style", {}, EDITOR_STYLE), this._form, this._appsBox);
    }
    this._form.hass = this._hass;
    const schema = this._schema();
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
    this._form.data = this._config;
    this._renderApps();
  }

  /** Per app: a name, a color and hiding. Kept in `apps:` in the card's config. */
  _renderApps() {
    const entities = this._kind === "family"
      ? (this._config.people ?? []).map((person) => person?.entity).filter(Boolean)
      : [this._config.entity].filter(Boolean);
    const rows = merge(entities.flatMap((entity) => readApps(this._hass, entity))).filter((row) => row.package);
    const signature = JSON.stringify([rows.map((row) => row.package), this._config.apps ?? {}, this._lang]);
    if (signature === this._appsSignature) return;
    this._appsSignature = signature;
    if (!rows.length) {
      this._appsBox.replaceChildren();
      return;
    }
    const overrides = { ...(this._config.apps ?? {}) };
    const set = (pkg, patch) => {
      const next = { ...(overrides[pkg] ?? {}), ...patch };
      for (const [k, v] of Object.entries(next)) if (v === "" || v === false || v === undefined) delete next[k];
      const apps = { ...(this._config.apps ?? {}) };
      if (Object.keys(next).length) apps[pkg] = next;
      else delete apps[pkg];
      this._emit({ ...this._config, apps: Object.keys(apps).length ? apps : undefined });
    };
    const t = (k, v) => translate(this._lang, k, v);
    this._appsBox.replaceChildren(
      el("h3", {}, t("edApps")),
      el("p", {}, t("edAppsHint")),
      ...rows.map((row) => {
        const look = appLook(row, overrides);
        const name = el("input", { type: "text", value: overrides[row.package]?.name ?? "", placeholder: appLook(row).name, "aria-label": look.name });
        name.addEventListener("change", () => set(row.package, { name: name.value.trim() }));
        const hex = /^#[0-9a-f]{6}$/i.test(look.color) ? look.color : "#d62976";
        const color = el("input", { type: "color", value: hex, "aria-label": t("edColor", { app: look.name }) });
        color.addEventListener("change", () => set(row.package, { color: color.value }));
        const eye = el("button", { type: "button", class: "eye", "aria-pressed": String(look.hidden),
          "aria-label": t(look.hidden ? "edShow" : "edHide", { app: look.name }) },
        el("ha-icon", { icon: look.hidden ? "mdi:eye-off" : "mdi:eye" }));
        eye.addEventListener("click", () => set(row.package, { hidden: !look.hidden }));
        return el("div", { class: `er${look.hidden ? " off" : ""}` },
          appIcon(look),
          el("div", {}, name, el("div", { class: "pkg" }, row.package)),
          el("label", { class: "sw", style: { background: look.color } }, color),
          eye);
      }),
    );
  }
}

class TodayEditor extends ScreenTimeEditor { constructor() { super("today"); } }
class WeekEditor extends ScreenTimeEditor { constructor() { super("week"); } }
class FamilyEditor extends ScreenTimeEditor { constructor() { super("family"); } }

if (typeof customElements !== "undefined") {
  const define = (tag, cls) => { if (!customElements.get(tag)) customElements.define(tag, cls); };
  define(TAG.today, ScreenTimeCard);
  define(TAG.week, ScreenTimeWeekCard);
  define(TAG.family, ScreenTimeFamilyCard);
  define(`${TAG.today}-editor`, TodayEditor);
  define(`${TAG.week}-editor`, WeekEditor);
  define(`${TAG.family}-editor`, FamilyEditor);
}

if (typeof window !== "undefined") {
  window.customCards = window.customCards || [];
  const cards = [
    [TAG.today, "Life Dashboard Screen Time", "Today's screen time on one phone, against a limit, with the apps that took it."],
    [TAG.week, "Life Dashboard Screen Time Week", "Screen time per day for the last week, with the apps of each day."],
    [TAG.family, "Life Dashboard Family Screen Time", "Everyone's screen time today, each against their own limit."],
  ];
  for (const [type, name, description] of cards) {
    if (!window.customCards.some((card) => card.type === type)) {
      window.customCards.push({ type, name, description, preview: true,
        documentationURL: "https://github.com/owen282000/life-dashboard-screen-time-card" });
    }
  }
}
