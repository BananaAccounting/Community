// @id = ch.banana.uni.stockohada.cump.endperiod
// @api = 1.0
// @pubdate = 2026-05-19
// @publisher = Paulin KIKUAKUA MALANGU/KIKSOFT ONLINE ACADEMY
// @description = 4. Gestion de stock OHADA - CUMP fin de période
// @description.en = 4. OHADA inventory management - Weighted average end of period
// @description.fr = 4. Gestion de stock OHADA - CUMP fin de période
// @description.it = 4. Gestione magazzino OHADA - CUMP a fine periodo
// @task = app.command
// @doctype = *

/*
========================================================
KIKSOFT ERP OHADA PRO
CUMP FIN DE PERIODE
VERSION STABLE BANANAPLUS
========================================================
*/

/*
========================================================
PARAMETRES
========================================================
*/

var STOCK_METHOD = "CUMP FIN DE PERIODE";

function exec() {

    var doc = Banana.document;

    if (!doc)
        return;

    var report = createReport(doc);

    var stylesheet = createStyleSheet();

    Banana.Report.preview(report, stylesheet);
}

/*
==================================================
REPORT
==================================================
*/

function createReport(doc) {

    var report = Banana.Report.newReport(
        "KIKSOFT ERP OHADA PRO"
    );

    addHeader(report);

    var data = calculateData(doc);

    addMainTable(report, data);

    addSummary(report, data);

    addFooter(report);

    return report;
}

/*
==================================================
HEADER PREMIUM OHADA
==================================================
*/

function addHeader(report) {

    var company =
        Banana.document.info(
            "Base",
            "Company"
        );

    var headerLeft =
        Banana.document.info(
            "Base",
            "HeaderLeft"
        );

    var headerRight =
        Banana.document.info(
            "Base",
            "HeaderRight"
        );

    var courtesy =
        Banana.document.info(
            "Address",
            "Courtesy"
        );

    var address1 =
        Banana.document.info(
            "Address",
            "Address1"
        );

    var address2 =
        Banana.document.info(
            "Address",
            "Address2"
        );

    var city =
        Banana.document.info(
            "Address",
            "Locality"
        );

    var region =
        Banana.document.info(
            "Address",
            "Region"
        );

    var country =
        Banana.document.info(
            "Address",
            "Country"
        );

    var phone =
        Banana.document.info(
            "Address",
            "Phone"
        );

    var email =
        Banana.document.info(
            "Address",
            "Email"
        );

    var web =
        Banana.document.info(
            "Address",
            "Web"
        );

    if (!company)
        company = "KIKSOFT ERP";

    if (!headerLeft)
        headerLeft = company;

    if (!headerRight)
        headerRight = "MAGASIN / DEPOT";

    /*
    ==========================================
    HEADER TABLE
    ==========================================
    */

    var header = report.addTable(
        "headerTable"
    );

    var row = header.addRow();

    /*
    ==========================================
    GAUCHE
    ==========================================
    */

    var leftText = "";

    leftText += headerLeft;

    if (courtesy)
        leftText += "\n" + courtesy;

    if (address1)
        leftText += "\n" + address1;

    if (address2)
        leftText += "\n" + address2;

    if (phone)
        leftText += "\nTél : " + phone;

    if (email)
        leftText += "\nEmail : " + email;

    row.addCell(
        leftText,
        "logo"
    );

    /*
    ==========================================
    CENTRE
    ==========================================
    */

    row.addCell(

        "FICHE DE STOCK\n" +

        "CONFORME AUX NORMES OHADA\n" +

        "Méthode : " + STOCK_METHOD +

        "\nDevise : FCFA",

        "title"
    );

    /*
    ==========================================
    DROITE
    ==========================================
    */

    var rightText = "";

    rightText += headerRight;

    if (city)
        rightText += "\n" + city;

    if (region)
        rightText += "\n" + region;

    if (country)
        rightText += "\n" + country;

    if (web)
        rightText += "\n" + web;

    rightText +=
        "\nDate Impression : " +
        Banana.Converter.toLocaleDateFormat(
            new Date()
        );

    row.addCell(
        rightText,
        "info"
    );

    /*
    ==========================================
    INFOS ARTICLE
    ==========================================
    */

    report.addParagraph(" ");

    var infoTable =
        report.addTable(
            "infoTable"
        );

    var r1 = infoTable.addRow();

    r1.addCell(
        "DESIGNATION ARTICLE : ______________________________",
        "infoBox"
    );

    r1.addCell(
        "UNITE : __________________",
        "infoBox"
    );

    r1.addCell(
        "MAGASIN : __________________",
        "infoBox"
    );

    var r2 = infoTable.addRow();

    r2.addCell(
        "CODE ARTICLE : ______________________________",
        "infoBox"
    );

    r2.addCell(
        "METHODE : " + STOCK_METHOD,
        "infoBox"
    );

    r2.addCell(
        "PAGE : ____ / ____",
        "infoBox"
    );

    report.addParagraph(" ");
}

/*
==================================================
CALCUL CUMP FIN DE PERIODE
==================================================
*/

function calculateData(doc) {

    var table = doc.table("Transactions");

    if (!table)
        return [];

    var rows = table.rows;

    var result = [];

    /*
    ==========================================
    PRE-CALCUL CUMP FINAL
    ==========================================
    */

    var totalQtyIn = 0;
    var totalValueIn = 0;

    for (var i = 0; i < rows.length; i++) {

        var row = rows[i];

        var qtyIn = parseFloat(

            row.value("Quant Plus") ||

            row.value("QuantityPlus") ||

            row.value("QtyPlus") ||

            row.value("In") ||

            0
        );

        var unitPrice = parseFloat(

            row.value("Prix Unitaire") ||

            row.value("UnitPrice") ||

            row.value("Price") ||

            row.value("PU") ||

            0
        );

        if (qtyIn > 0) {

            totalQtyIn += qtyIn;

            totalValueIn += qtyIn * unitPrice;
        }
    }

    /*
    ==========================================
    CUMP FINAL
    ==========================================
    */

    var finalCUMP = 0;

    if (totalQtyIn > 0) {

        finalCUMP =
            totalValueIn / totalQtyIn;
    }

    /*
    ==========================================
    TRAITEMENT DES MOUVEMENTS
    ==========================================
    */

    var stockQty = 0;
    var stockValue = 0;

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

            var entryTotal =
                qtyIn * unitPrice;

            stockQty += qtyIn;

            stockValue += entryTotal;

            result.push({

                date: date,

                label: description,

                lot: "CUMP",

                entryQty: qtyIn,

                entryPU: unitPrice,

                entryTotal: entryTotal,

                exitQty: 0,

                exitPU: 0,

                exitTotal: 0,

                stockQty: stockQty,

                stockPU: finalCUMP,

                stockValue: stockQty * finalCUMP
            });
        }

        /*
        ==========================================
        SORTIE
        ==========================================
        */

        if (qtyOut > 0) {

            var exitTotal =
                qtyOut * finalCUMP;

            stockQty -= qtyOut;

            stockValue -= exitTotal;

            if (stockQty < 0)
                stockQty = 0;

            if (stockValue < 0)
                stockValue = 0;

            result.push({

                date: date,

                label: description,

                lot: "CUMP",

                entryQty: 0,

                entryPU: 0,

                entryTotal: 0,

                exitQty: qtyOut,

                exitPU: finalCUMP,

                exitTotal: exitTotal,

                stockQty: stockQty,

                stockPU: finalCUMP,

                stockValue: stockQty * finalCUMP
            });
        }
    }

    return result;
}

/*
==================================================
TABLEAU PREMIUM OHADA
==================================================
*/

function addMainTable(report, data) {

    var table = report.addTable("mainTable");

    /*
    ==============================================
    ENTETE PRINCIPALE
    ==============================================
    */

    var row1 = table.addRow();

    row1.addCell("DATE", "th");
    row1.addCell("LIBELLE", "th");
    row1.addCell("LOT", "th");

    row1.addCell("ENTREES", "thGroup", 3);
    row1.addCell("SORTIES", "thGroup", 3);
    row1.addCell("STOCK", "thGroup", 3);

    /*
    ==============================================
    SOUS ENTETE
    ==============================================
    */

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

    /*
    ==============================================
    DONNEES
    ==============================================
    */

    var totalEntry = 0;
    var totalExit = 0;

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

        r.addCell(format(d.entryQty), "tdn");
        r.addCell(format(d.entryPU), "tdn");
        r.addCell(format(d.entryTotal), "tdn");

        r.addCell(format(d.exitQty), "tdn");

        r.addCell(
            d.exitPU > 0
            ? format(d.exitPU)
            : "",
            "tdn"
        );

        r.addCell(format(d.exitTotal), "tdn");

        r.addCell(format(d.stockQty), "tdn");

        r.addCell(
            d.stockPU > 0
            ? format(d.stockPU)
            : "",
            "tdn"
        );

        r.addCell(
            format(d.stockValue),
            "tdn"
        );

        totalEntry += d.entryTotal;
        totalExit += d.exitTotal;
    }

    /*
    ==============================================
    STOCK FINAL
    ==============================================
    */

    var finalStockQty = 0;
    var finalStockValue = 0;

    if (data.length > 0) {

        var last =
            data[data.length - 1];

        finalStockQty =
            last.stockQty;

        finalStockValue =
            last.stockValue;
    }

    /*
    ==============================================
    LIGNE TOTAL
    ==============================================
    */

    var finalStockPU = "";

for (var i = data.length - 1; i >= 0; i--) {

    if (data[i].stockQty > 0) {
        finalStockPU = data[i].stockPU;
        break;
    }
}

   var totalRow = table.addRow();

totalRow.addCell("TOTAL GENERAL", "total");

totalRow.addCell("", "total");
totalRow.addCell("", "total");

/* ENTREES */

totalRow.addCell("", "total");
totalRow.addCell("", "total");
totalRow.addCell("", "total");     // <- vide

/* SORTIES */

totalRow.addCell("", "total");
totalRow.addCell("", "total");
totalRow.addCell("", "total");     // <- vide

/* STOCK */

totalRow.addCell(
    format(finalStockQty),
    "total"
);

totalRow.addCell(
    format(finalStockPU),
    "total"
);

totalRow.addCell(
    format(finalStockValue),
    "total"
);
}

/*
==================================================
RESUME
==================================================
*/

function addSummary(report, data) {

    if (data.length <= 0)
        return;

    var last =
        data[data.length - 1];

    var finalStockQty =
        last.stockQty;

    var finalStockValue =
        last.stockValue;

    report.addParagraph(" ");

    report.addParagraph(
        "RÉSUMÉ GÉNÉRAL",
        "summaryTitle"
    );

    report.addParagraph(
        "Stock Final Quantité : " +
        format(finalStockQty),
        "summary"
    );

    report.addParagraph(
        "Valeur Finale Stock : " +
        format(finalStockValue) +
        " FCFA",
        "summary"
    );
}

/*
==================================================
FOOTER
==================================================
*/

function addFooter(report) {

    report.addParagraph(" ");

    var footer =
        report.addTable(
            "footerTable"
        );

    var row = footer.addRow();

    row.addCell(
        "ÉTABLI PAR :\n\n\n_____________________",
        "footerCell"
    );

    row.addCell(
        "VÉRIFIÉ PAR :\n\n\n_____________________",
        "footerCell"
    );

    row.addCell(
        "APPROUVÉ PAR :\n\n\n_____________________",
        "footerCell"
    );
}

/*
==================================================
FORMAT
==================================================
*/

function format(v) {

    return Banana.Converter.toLocaleNumberFormat(
        Number(v).toFixed(2)
    );
}

/*
==================================================
STYLE PREMIUM OHADA
==================================================
*/

function createStyleSheet() {

    var s = Banana.Report.newStyleSheet();

    s.addStyle(
        "body",
        "font-family: Helvetica; font-size:9pt; color:#1f2937;"
    );

    s.addStyle(
        ".headerTable",
        "width:100%; border:1px solid #1e3a5f; margin-bottom:10px;"
    );

    s.addStyle(
        ".headerTable td",
        "border:1px solid #1e3a5f; padding:10px; vertical-align:top;"
    );

    s.addStyle(
        ".logo",
        "font-size:12pt; font-weight:bold; color:#1e3a5f;"
    );

    s.addStyle(
        ".title",
        "font-size:18pt; font-weight:bold; text-align:center; color:#1e3a5f;"
    );

    s.addStyle(
        ".info",
        "font-size:9pt; color:#374151;"
    );

    s.addStyle(
        ".infoTable",
        "width:100%; margin-bottom:12px;"
    );

    s.addStyle(
        ".infoBox",
        "border:1px solid #9ca3af; padding:8px; font-weight:bold; background-color:#f9fafb;"
    );

    s.addStyle(
        ".mainTable",
        "width:100%; font-size:8.5pt; border:1px solid #1e3a5f;"
    );

    s.addStyle(
        ".mainTable td",
        "border:1px solid #cbd5e1; padding:5px;"
    );

    s.addStyle(
        ".th",
        "background-color:#0f2d52; color:white; font-weight:bold; text-align:center; padding:7px;"
    );

    s.addStyle(
        ".thGroup",
        "background-color:#0f2d52; color:white; font-weight:bold; text-align:center; padding:7px;"
    );

    s.addStyle(
        ".th2",
        "background-color:#d6a756; color:black; font-weight:bold; text-align:center;"
    );

    s.addStyle(
        ".thSpacer",
        "background-color:#0f2d52; border-top:1px solid #0f2d52; border-left:1px solid #0f2d52; border-right:1px solid #0f2d52; border-bottom:1px solid #d6a756;"
    );

    s.addStyle(
        ".td",
        "background-color:white;"
    );

    s.addStyle(
        ".tdIn",
        "background-color:#f0fdf4;"
    );

    s.addStyle(
        ".tdOut",
        "background-color:#fff7ed;"
    );

    s.addStyle(
        ".tdn",
        "text-align:right;"
    );

    s.addStyle(
        ".total",
        "font-weight:bold; background-color:#e5e7eb; border:1px solid #374151; padding:6px;"
    );

    s.addStyle(
        ".summaryTitle",
        "font-size:13pt; font-weight:bold; color:#0f2d52;"
    );

    s.addStyle(
        ".summary",
        "font-size:10pt; font-weight:bold;"
    );

    s.addStyle(
        ".footerTable",
        "width:100%; margin-top:20px;"
    );

    s.addStyle(
        ".footerCell",
        "border:1px solid #9ca3af; padding:12px; text-align:center; font-weight:bold;"
    );

    return s;
}