// @id = ch.banana.uni.stockohada.lifo
// @api = 1.0
// @pubdate = 2026-11-21
// @publisher = Paulin KIKUAKUA MALANGU/KIKSOFT ONLINE ACADEMY
// @description = 2. Fiche de stock OHADA - LIFO
// @description.en = 2. OHADA stock card - LIFO
// @description.fr = 2. Fiche de stock OHADA - LIFO
// @description.it = 2. Scheda magazzino OHADA - LIFO
// @task = app.command
// @doctype = *

/*
==================================================
FICHE DE STOCK OHADA - LIFO
En-tête paramétrable (réglages partagés entre les
4 méthodes : FIFO, LIFO, CUMP après chaque entrée,
CUMP fin de période)
==================================================
*/

var STOCK_METHOD = "LIFO";

/* CUMP : CU de sortie vide si 0 ; FIFO/LIFO : toujours affiché */
var HIDE_ZERO_EXIT_PU = false;

/* Identifiant commun : les réglages sont partagés par toutes les méthodes */
var SETTINGS_ID = "kiksoft.stock.ohada.settings";

/*
==================================================
POINT D'ENTREE
==================================================
*/

function exec(inData, options) {

    var doc = Banana.document;

    if (!doc)
        return;

    var useLast = options && options.useLastSettings;

    if (!useLast) {

        if (!hasSavedSettings()) {

            /* Première utilisation : on ouvre directement les paramètres */
            settingsDialog();
        }
        else if (askForSettings()) {

            settingsDialog();
        }
    }

    var settings = loadSettings();

    var report = createReport(doc, settings);

    var stylesheet = createStyleSheet(settings);

    Banana.Report.preview(report, stylesheet);
}

function askForSettings() {

    try {
        if (Banana.Ui && typeof Banana.Ui.showQuestion === "function") {

            return Banana.Ui.showQuestion(
                "Fiche de stock",
                "Voulez-vous modifier les paramètres (entreprise, article, monnaie...) avant l'aperçu ?"
            ) ? true : false;
        }
    } catch (e) {
    }

    return false;
}

/*
==================================================
PARAMETRES : VALEURS PAR DEFAUT
==================================================
*/

function docInfo(section, id) {

    try {
        var v = Banana.document.info(section, id);
        return v ? String(v) : "";
    } catch (e) {
        return "";
    }
}

function defaultSettings() {

    var company = docInfo("Base", "Company");
    var headerLeft = docInfo("Base", "HeaderLeft");

    var address = docInfo("Address", "Address1");

    if (docInfo("Address", "Address2"))
        address += (address ? "\n" : "") + docInfo("Address", "Address2");

    if (docInfo("Address", "Locality"))
        address += (address ? "\n" : "") + docInfo("Address", "Locality");

    var opening = docInfo("AccountingDataBase", "OpeningDate");
    var fiscal = opening ? "EXERCICE " + opening.substring(0, 4) : "";

    return {

        /* En-tête */
        companyName: headerLeft || company || "",
        address: address,
        phone: docInfo("Address", "Phone"),
        email: docInfo("Address", "Email"),

        docTitle: "FICHE DE STOCK",
        docSubtitle: "CONFORME AUX NORMES OHADA",
        showMethod: true,

        fiscalLabel: fiscal,
        extraRight: docInfo("Base", "HeaderRight"),
        showPrintDate: true,

        /* Article */
        articleName: "",
        articleCode: "",
        unit: "",
        warehouse: "",

        /* Monnaie : vide par défaut */
        currency: "",
        decimals: "2",

        /* Pied de page */
        showSignatures: true,
        sign1: "ÉTABLI PAR :",
        sign2: "VÉRIFIÉ PAR :",
        sign3: "APPROUVÉ PAR :",

        /* Couleurs */
        mainColor: "#0f2d52",
        accentColor: "#d6a756"
    };
}

/*
==================================================
PARAMETRES : LECTURE / ECRITURE
==================================================
*/

function readSavedText() {

    var txt = "";

    try {
        txt = Banana.document.getScriptSettings(SETTINGS_ID);
    } catch (e) {
        txt = "";
    }

    /* Anciennes versions : réglages propres à l'extension */
    if (!txt) {
        try {
            txt = Banana.document.getScriptSettings();
        } catch (e2) {
            txt = "";
        }
    }

    return txt ? String(txt) : "";
}

function hasSavedSettings() {

    return readSavedText().length > 0;
}

function loadSettings() {

    var s = defaultSettings();

    try {
        var saved = readSavedText();

        if (saved.length > 0) {

            var obj = JSON.parse(saved);

            for (var k in obj) {
                if (s.hasOwnProperty(k))
                    s[k] = obj[k];
            }
        }
    } catch (e) {
        /* réglages illisibles : valeurs par défaut */
    }

    return s;
}

function saveSettings(s) {

    var txt = JSON.stringify(s);

    try {
        Banana.document.setScriptSettings(SETTINGS_ID, txt);
    } catch (e) {
        Banana.document.setScriptSettings(txt);
    }
}

/*
==================================================
FENETRE DES PARAMETRES
(bouton Paramètres de Gestion des extensions,
et de l'aperçu selon la version de Banana)
==================================================
*/

function settingsDialog() {

    var settings = loadSettings();

    var converted = convertParam(settings);

    if (!Banana.Ui.openPropertyEditor("Paramètres de la fiche de stock", converted, "dlgSettings"))
        return null;

    for (var i = 0; i < converted.data.length; i++)
        converted.data[i].readValue();

    saveSettings(settings);

    return true;
}

function addGroup(data, name, title) {

    data.push({
        name: name,
        title: title,
        type: "string",
        value: "",
        editable: false,
        readValue: function () { }
    });
}

function addParam(data, s, key, title, type, parent, tooltip, items) {

    var def = defaultSettings()[key];

    var p = {};

    p.name = key;
    p.title = title;
    p.type = type;
    p.value = (s[key] !== undefined && s[key] !== null) ? s[key] : def;
    p.defaultvalue = def;
    p.parentObject = parent;

    if (tooltip)
        p.tooltip = tooltip;

    if (items)
        p.items = items;

    p.readValue = function () {
        s[key] = this.value;
    };

    data.push(p);
}

function convertParam(s) {

    var c = {};

    c.version = "1.0";
    c.data = [];

    var d = c.data;

    /* ---------- ENTETE ---------- */

    addGroup(d, "grpHeader", "En-tête du document");

    addParam(d, s, "companyName", "Nom de l'entreprise", "string", "grpHeader",
        "Affiché dans le cadre de gauche");
    addParam(d, s, "address", "Adresse", "multilinestring", "grpHeader");
    addParam(d, s, "phone", "Téléphone", "string", "grpHeader");
    addParam(d, s, "email", "Email", "string", "grpHeader");

    addParam(d, s, "docTitle", "Titre du document", "string", "grpHeader");
    addParam(d, s, "docSubtitle", "Sous-titre", "string", "grpHeader",
        "Laisser vide pour ne rien afficher");
    addParam(d, s, "showMethod", "Afficher la méthode de valorisation", "bool", "grpHeader");

    addParam(d, s, "fiscalLabel", "Exercice (cadre de droite)", "string", "grpHeader",
        "Ex. : EXERCICE 2026");
    addParam(d, s, "extraRight", "Complément (cadre de droite)", "string", "grpHeader",
        "Ex. : nom du dépôt, du projet...");
    addParam(d, s, "showPrintDate", "Afficher la date d'impression", "bool", "grpHeader");

    /* ---------- ARTICLE ---------- */

    addGroup(d, "grpArticle", "Article");

    addParam(d, s, "articleName", "Désignation de l'article", "string", "grpArticle",
        "Laisser vide pour écrire à la main sur la fiche imprimée");
    addParam(d, s, "articleCode", "Code article", "string", "grpArticle");
    addParam(d, s, "unit", "Unité", "string", "grpArticle");
    addParam(d, s, "warehouse", "Magasin", "string", "grpArticle");

    /* ---------- MONNAIE ---------- */

    addGroup(d, "grpCurrency", "Monnaie et chiffres");

    addParam(d, s, "currency", "Monnaie", "string", "grpCurrency",
        "Ex. : FCFA, USD, CDF. Laisser vide pour ne rien afficher");
    addParam(d, s, "decimals", "Nombre de décimales", "combobox", "grpCurrency",
        "Décimales affichées dans les montants", ["0", "1", "2"]);

    /* ---------- PIED DE PAGE ---------- */

    addGroup(d, "grpFooter", "Pied de page");

    addParam(d, s, "showSignatures", "Afficher le cadre des signatures", "bool", "grpFooter");
    addParam(d, s, "sign1", "Libellé signature 1", "string", "grpFooter");
    addParam(d, s, "sign2", "Libellé signature 2", "string", "grpFooter");
    addParam(d, s, "sign3", "Libellé signature 3", "string", "grpFooter");

    /* ---------- COULEURS ---------- */

    addGroup(d, "grpColors", "Couleurs");

    addParam(d, s, "mainColor", "Couleur principale", "color", "grpColors");
    addParam(d, s, "accentColor", "Couleur d'accent", "color", "grpColors");

    return c;
}

/*
==================================================
REPORT
==================================================
*/

function createReport(doc, settings) {

    var report = Banana.Report.newReport("KIKSOFT ERP OHADA PRO");

    addHeader(report, settings);

    var data = calculateData(doc);

    addMainTable(report, data, settings);

    addSummary(report, data, settings);

    addFooter(report, settings);

    return report;
}

/*
==================================================
EN-TETE
==================================================
*/

function blank(value, line) {

    return (value && String(value).length > 0) ? value : line;
}

function addHeader(report, s) {

    var header = report.addTable("headerTable");

    var row = header.addRow();

    /* ---------- GAUCHE ---------- */

    var leftText = s.companyName || "";

    if (s.address)
        leftText += "\n" + s.address;

    if (s.phone)
        leftText += "\nTél : " + s.phone;

    if (s.email)
        leftText += "\nEmail : " + s.email;

    row.addCell(leftText, "logo");

    /* ---------- CENTRE ---------- */

    var center = s.docTitle || "";

    if (s.docSubtitle)
        center += "\n" + s.docSubtitle;

    if (s.showMethod)
        center += "\nMéthode : " + STOCK_METHOD;

    if (s.currency)
        center += "\nDevise : " + s.currency;

    row.addCell(center, "title");

    /* ---------- DROITE ---------- */

    var lines = [];

    if (s.fiscalLabel)
        lines.push(s.fiscalLabel);

    if (s.extraRight)
        lines.push(s.extraRight);

    if (s.showPrintDate)
        lines.push("Date Impression : " +
            Banana.Converter.toLocaleDateFormat(new Date()));

    row.addCell(lines.join("\n"), "info");

    /* ---------- INFOS ARTICLE ---------- */

    report.addParagraph(" ");

    var infoTable = report.addTable("infoTable");

    var r1 = infoTable.addRow();

    r1.addCell("DESIGNATION ARTICLE : " +
        blank(s.articleName, "______________________________"), "infoBox");

    r1.addCell("UNITE : " +
        blank(s.unit, "__________________"), "infoBox");

    r1.addCell("MAGASIN : " +
        blank(s.warehouse, "__________________"), "infoBox");

    var r2 = infoTable.addRow();

    r2.addCell("CODE ARTICLE : " +
        blank(s.articleCode, "______________________________"), "infoBox");

    r2.addCell("METHODE : " + STOCK_METHOD, "infoBox");

    r2.addCell("PAGE : ____ / ____", "infoBox");

    report.addParagraph(" ");
}

/*
==================================================
CALCUL (propre à la méthode)
==================================================
*/

function calculateData(doc) {

    var table = doc.table("Transactions");

    if (!table)
        return [];

    var rows = table.rows;

    var result = [];

    var lifoLayers = [];

    var lotIndex = 1;

    for (var i = 0; i < rows.length; i++) {

        var row = rows[i];

        var date =
            row.value("Date");

        var description =
            row.value("Libellé") ||
            row.value("Description") ||
            "";

        var qtyIn = parseFloat(

            row.value("Quant Plus") ||

            row.value("QuantityPlus") ||

            row.value("QtyPlus") ||

            row.value("In") ||

            0
        );

        var qtyOut = parseFloat(

            row.value("Quant Minus") ||

            row.value("QuantityMinus") ||

            row.value("QtyMinus") ||

            row.value("Out") ||

            0
        );

        var unitPrice = parseFloat(

            row.value("Prix Unitaire") ||

            row.value("UnitPrice") ||

            row.value("Price") ||

            row.value("PU") ||

            0
        );

        /*
        ==========================================
        ENTREE
        ==========================================
        */

        if (qtyIn > 0) {

            var lotName =
                "Lot " +
                String.fromCharCode(64 + lotIndex);

            lifoLayers.push({

                lot: lotName,
                qty: qtyIn,
                price: unitPrice
            });

            for (var j = 0; j < lifoLayers.length; j++) {

                var layer = lifoLayers[j];

                var currentStockPU =
                    layer.price;

                var currentStockValue =
                    layer.qty * layer.price;

                result.push({

                    date: date,

                    label:
                        (j === lifoLayers.length - 1)
                        ? description
                        : "",

                    lot: layer.lot,

                    entryQty:
                        (j === lifoLayers.length - 1)
                        ? qtyIn
                        : 0,

                    entryPU:
                        (j === lifoLayers.length - 1)
                        ? unitPrice
                        : 0,

                    entryTotal:
                        (j === lifoLayers.length - 1)
                        ? qtyIn * unitPrice
                        : 0,

                    exitQty: 0,
                    exitPU: 0,
                    exitTotal: 0,

                    stockQty: layer.qty,

                    stockPU: currentStockPU,

                    stockValue: currentStockValue
                });
            }

            lotIndex++;
        }

        /*
        ==========================================
        SORTIE
        ==========================================
        */

        if (qtyOut > 0) {

            var qtyToConsume = qtyOut;

            while (
                qtyToConsume > 0 &&
                lifoLayers.length > 0
            ) {

                var lastIndex =
                    lifoLayers.length - 1;

                var layer =
                    lifoLayers[lastIndex];

                var consumedQty = 0;

                if (
                    layer.qty <= qtyToConsume
                ) {

                    consumedQty = layer.qty;

                    qtyToConsume -= layer.qty;

                    layer.qty = 0;
                }

                else {

                    consumedQty = qtyToConsume;

                    layer.qty -= qtyToConsume;

                    qtyToConsume = 0;
                }

                var exitTotal =
                    consumedQty * layer.price;

                var currentStockPU =
                    layer.price;

                if (layer.qty <= 0) {

                    currentStockPU = 0;
                }

                var currentStockValue =
                    layer.qty * currentStockPU;

                result.push({

                    date: date,

                    label: description,

                    lot: layer.lot,

                    entryQty: 0,
                    entryPU: 0,
                    entryTotal: 0,

                    exitQty: consumedQty,
                    exitPU: layer.price,
                    exitTotal: exitTotal,

                    stockQty: layer.qty,

                    stockPU: currentStockPU,

                    stockValue: currentStockValue
                });

                if (layer.qty <= 0) {

                    lifoLayers.pop();
                }
            }
        }
    }

    return result;
}

/*
==================================================
STOCK FINAL (propre à la méthode)
==================================================
*/

/* Stock final = somme des quantités restantes de chaque lot (dernière ligne de chaque lot) */
function finalFigures(data) {

    var f = { qty: 0, value: 0, pu: "" };

    var lastByLot = {};

    for (var i = 0; i < data.length; i++)
        lastByLot[data[i].lot] = data[i];

    for (var lot in lastByLot) {

        if (lastByLot[lot].stockQty > 0) {
            f.qty += lastByLot[lot].stockQty;
            f.value += lastByLot[lot].stockValue;
        }
    }

    /* CU du total = coût moyen des lots restants */
    if (f.qty > 0)
        f.pu = f.value / f.qty;

    return f;
}

/*
==================================================
TABLEAU
==================================================
*/

function addMainTable(report, data, s) {

    var table = report.addTable("mainTable");

    var row1 = table.addRow();

    row1.addCell("DATE", "th");
    row1.addCell("LIBELLE", "th");
    row1.addCell("LOT", "th");

    row1.addCell("ENTREES", "thGroup", 3);
    row1.addCell("SORTIES", "thGroup", 3);
    row1.addCell("STOCK", "thGroup", 3);

    var row2 = table.addRow();

    row2.addCell("", "thSpacer");
    row2.addCell("", "thSpacer");
    row2.addCell("", "thSpacer");

    row2.addCell("Qté", "th2");
    row2.addCell("PU", "th2");
    row2.addCell("Montant", "th2");

    row2.addCell("Qté", "th2");
    row2.addCell("CU Stock", "th2");
    row2.addCell("Valeur", "th2");

    row2.addCell("Qté", "th2");
    row2.addCell("CU", "th2");
    row2.addCell("Valeur", "th2");

    for (var i = 0; i < data.length; i++) {

        var d = data[i];

        var r = table.addRow();

        var rowStyle = "td";

        if (d.exitQty > 0)
            rowStyle = "tdOut";

        if (d.entryQty > 0)
            rowStyle = "tdIn";

        r.addCell(d.date, rowStyle);
        r.addCell(d.label, rowStyle);
        r.addCell(d.lot, rowStyle);

        r.addCell(format(d.entryQty, s), "tdn");
        r.addCell(format(d.entryPU, s), "tdn");
        r.addCell(format(d.entryTotal, s), "tdn");

        r.addCell(format(d.exitQty, s), "tdn");
        r.addCell((HIDE_ZERO_EXIT_PU && !(d.exitPU > 0)) ? "" : format(d.exitPU, s), "tdn");
        r.addCell(format(d.exitTotal, s), "tdn");

        r.addCell(format(d.stockQty, s), "tdn");
        r.addCell(d.stockPU > 0 ? format(d.stockPU, s) : "", "tdn");
        r.addCell(format(d.stockValue, s), "tdn");
    }

    var f = finalFigures(data);

    var totalRow = table.addRow();

    totalRow.addCell("TOTAL GENERAL", "total");
    totalRow.addCell("", "total");
    totalRow.addCell("", "total");

    totalRow.addCell("", "total");
    totalRow.addCell("", "total");
    totalRow.addCell("", "total");

    totalRow.addCell("", "total");
    totalRow.addCell("", "total");
    totalRow.addCell("", "total");

    totalRow.addCell(format(f.qty, s), "total");
    totalRow.addCell(f.pu === "" ? "" : format(f.pu, s), "total");
    totalRow.addCell(format(f.value, s), "total");
}

/*
==================================================
RESUME
==================================================
*/

function addSummary(report, data, s) {

    if (data.length <= 0)
        return;

    var f = finalFigures(data);

    report.addParagraph(" ");

    report.addParagraph("RÉSUMÉ GÉNÉRAL", "summaryTitle");

    report.addParagraph(
        "Stock Final Quantité : " + format(f.qty, s),
        "summary");

    var valueLine = "Valeur Finale Stock : " + format(f.value, s);

    if (s.currency)
        valueLine += " " + s.currency;

    report.addParagraph(valueLine, "summary");
}

/*
==================================================
PIED DE PAGE
==================================================
*/

function addFooter(report, s) {

    if (!s.showSignatures)
        return;

    report.addParagraph(" ");

    var footer = report.addTable("footerTable");

    var row = footer.addRow();

    var line = "\n\n\n_____________________";

    row.addCell((s.sign1 || "") + line, "footerCell");
    row.addCell((s.sign2 || "") + line, "footerCell");
    row.addCell((s.sign3 || "") + line, "footerCell");
}

/*
==================================================
FORMAT
==================================================
*/

function decimalsOf(s) {

    var n = parseInt(s.decimals, 10);

    if (isNaN(n) || n < 0)
        n = 2;

    if (n > 4)
        n = 4;

    return n;
}

function format(v, s) {

    var n = decimalsOf(s);

    return Banana.Converter.toLocaleNumberFormat(
        Number(v).toFixed(n), n, true
    );
}

/*
==================================================
STYLE
==================================================
*/

function validColor(c, fallback) {

    return (c && /^#[0-9a-fA-F]{3,8}$/.test(String(c).trim()))
        ? String(c).trim()
        : fallback;
}

function createStyleSheet(settings) {

    var main = validColor(settings.mainColor, "#0f2d52");
    var accent = validColor(settings.accentColor, "#d6a756");

    var s = Banana.Report.newStyleSheet();

    s.addStyle("body",
        "font-family: Helvetica; font-size:9pt; color:#1f2937;");

    s.addStyle(".headerTable",
        "width:100%; border:1px solid " + main + "; margin-bottom:10px;");

    s.addStyle(".headerTable td",
        "border:1px solid " + main + "; padding:10px; vertical-align:top;");

    s.addStyle(".logo",
        "font-size:12pt; font-weight:bold; color:" + main + ";");

    s.addStyle(".title",
        "font-size:18pt; font-weight:bold; text-align:center; color:" + main + ";");

    s.addStyle(".info",
        "font-size:9pt; color:#374151;");

    s.addStyle(".infoTable",
        "width:100%; margin-bottom:12px;");

    s.addStyle(".infoBox",
        "border:1px solid #9ca3af; padding:8px; font-weight:bold; background-color:#f9fafb;");

    s.addStyle(".mainTable",
        "width:100%; font-size:8.5pt; border:1px solid " + main + ";");

    s.addStyle(".mainTable td",
        "border:1px solid #cbd5e1; padding:5px;");

    s.addStyle(".th",
        "background-color:" + main + "; color:white; font-weight:bold; text-align:center; padding:7px;");

    s.addStyle(".thGroup",
        "background-color:" + main + "; color:white; font-weight:bold; text-align:center; padding:7px;");

    s.addStyle(".th2",
        "background-color:" + accent + "; color:black; font-weight:bold; text-align:center;");

    s.addStyle(".thSpacer",
        "background-color:" + main + "; border-top:1px solid " + main +
        "; border-left:1px solid " + main + "; border-right:1px solid " + main +
        "; border-bottom:1px solid " + accent + ";");

    s.addStyle(".td", "background-color:white;");
    s.addStyle(".tdIn", "background-color:#f0fdf4;");
    s.addStyle(".tdOut", "background-color:#fff7ed;");
    s.addStyle(".tdn", "text-align:right;");

    s.addStyle(".total",
        "font-weight:bold; background-color:#e5e7eb; border:1px solid #374151; padding:6px;");

    s.addStyle(".summaryTitle",
        "font-size:13pt; font-weight:bold; color:" + main + ";");

    s.addStyle(".summary",
        "font-size:10pt; font-weight:bold;");

    s.addStyle(".footerTable",
        "width:100%; margin-top:20px;");

    s.addStyle(".footerCell",
        "border:1px solid #9ca3af; padding:12px; text-align:center; font-weight:bold;");

    return s;
}
