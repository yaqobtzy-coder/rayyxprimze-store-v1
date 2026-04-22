<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// KONFIGURASI AMAN (Hanya ada di server)
$PANEL_URL = "https://serverrr2.rxpedia.web.id";
$PTLA      = "ptla_lNHDeCEk1y0hFhj8YChEnwGb5X9mJfSKFvSf9FpEvUh";

function fetchPterodactyl($endpoint) {
    global $PANEL_URL, $PTLA;
    $ch = curl_init($PANEL_URL . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $PTLA",
        "Accept: application/json"
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

// Ambil data server
echo fetchPterodactyl("/api/application/servers");
