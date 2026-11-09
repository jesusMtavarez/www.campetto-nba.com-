from pathlib import Path

path = Path(r"c:\Users\jmt23\Desktop\app nba\app.js")
text = path.read_text(encoding="utf-8")

replacements = {
    "Ã€": "À", "Ã": "Á", "Ã‚": "Â", "Ãƒ": "Ã", "Ã„": "Ä", "Ã…": "Å",
    "Ã†": "Æ", "Ã‡": "Ç", "Ãˆ": "È", "Ã‰": "É", "ÃŠ": "Ê", "Ã‹": "Ë",
    "ÃŒ": "Ì", "Ã": "Í", "ÃŽ": "Î", "Ã": "Ï", "Ã‘": "Ñ", "Ã’": "Ò",
    "Ã“": "Ó", "Ã”": "Ö", "Ã•": "Õ", "Ã–": "Ö", "Ã™": "Ù", "Ãš": "Ú",
    "Ã›": "Û", "Ãœ": "Ü", "Ã": "Ý", "Ãž": "Þ", "ÃŸ": "ß", "Ã ": "à",
    "Ã¡": "á", "Ã¢": "â", "Ã£": "ã", "Ã¤": "ä", "Ã¥": "å", "Ã¦": "æ",
    "Ã§": "ç", "Ã¨": "è", "Ã©": "é", "Ãª": "ê", "Ã«": "ë", "Ã¬": "ì",
    "Ã­": "í", "Ã®": "î", "Ã¯": "ï", "Ã°": "ð", "Ã±": "ñ", "Ã²": "ò",
    "Ã³": "ó", "Ã´": "ô", "Ãµ": "õ", "Ã¶": "ö", "Ã¸": "ø", "Ã¹": "ù",
    "Ãº": "ú", "Ã»": "û", "Ã¼": "ü", "Ã½": "ý", "Ã¾": "þ", "Ã¿": "ÿ",
    "â€™": "'", "â€œ": "“", "â€": "”", "â€˜": "‘", "â€”": "—",
    "â€“": "–", "â€¢": "•", "Â·": "·", "Â°": "°", "Â€": "€", "Â": "",
    "â€": '"', "â€": "", "â€": "", "â€": "",
    "â¹": "¹", "â™¡": "♡", "â™¥": "♥", "â–¶": "▶", "â‡„": "⇄",
    "â†—": "↗", "â†»": "↗", "âœ“": "✓", "â—": "●", "â—‰": "⬢",
    "ï¼‹": "＋", "Å½": "Ž", "Å¾": "ž", "Å¸": "ž",
    "Ã
": "Ð", "Ã": "Ñ", "Ã": "×", "Ã˜": "Ø", "Ã": "ß",
    "Ã": "Ä", "Ã": "Å", "Ã": "Æ", "Ã": "È", "Ã": "É",
    "Ã": "Ì", "Ã": "Î", "Ã": "Ï", "Ã": "Ð",
    "Â¡": "¡", "Â¿": "¿", "Â«": "«", "Â»": "»", "â€¹": "‹", "â€º": "›",
    "Â—": "—", "Â–": "–", "Â…": "…", "Ã¤": "ä", "Ã©": "é", "Ã¼": "ü",
    "Ã²": "ò", "Ã¹": "ù", "Ã¨": "è", "Ã¬": "ì", "Ã±": "ñ",
    "attivitÃ ": "attività", "NazionalitÃ ": "Nazionalità", "nazionalitÃ ": "nazionalità",
    "In attivitÃ ": "In attività", "EtÃ€": "Età", "CITTÃ€": "CITTÀ", "SGRIM": "",
    "Dati demo": "Dati demo", "Â ": " ", "ã€": "",
}

for old, new in replacements.items():
    text = text.replace(old, new)

text = text.replace("Ã\u00a0", " ")
text = text.replace("\u00a0", " ")
text = text.replace("Â\u00a0", " ")
text = text.replace("â€™", "'")
text = text.replace("â€˜", "'")
text = text.replace("â€œ", '"')
text = text.replace("â€", '"')
text = text.replace("â€”", "—")
text = text.replace("Å ", " ")
text = text.replace("Â", "")

# Additional Italian phrasing cleanup
text = text.replace("In attivita'", "In attività")
text = text.replace("in attivita'", "in attività")
text = text.replace("giocatori seguiti", "giocatori seguiti")
text = text.replace("NazionalitÃ  non disponibile", "Nazionalità non disponibile")
text = text.replace("nazionalitÃ  non disponibile", "nazionalità non disponibile")
text = text.replace("La tua giornata NBA, qui.", "La tua giornata NBA, qui.")
text = text.replace("Tutte le partite", "Tutte le partite")

path.write_text(text, encoding="utf-8")
print("patched app.js charset cleanup")
