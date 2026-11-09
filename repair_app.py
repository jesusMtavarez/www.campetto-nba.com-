from pathlib import Path

path = Path(r"c:\Users\jmt23\Desktop\app nba\app.js")
text = path.read_text(encoding='utf-8')

# Repeated mojibake recovery: UTF-8 bytes that were badly decoded as Latin-1 appear as
# sequences like Ã©, Ã¼, Â, â€”; converting through Latin-1 -> UTF-8 often restores the real text.
for _ in range(4):
    repaired = text.encode('latin-1', 'ignore').decode('utf-8', 'ignore')
    if repaired.count('Ã') + repaired.count('Â') + repaired.count('â€') < text.count('Ã') + text.count('Â') + text.count('â€'):
        text = repaired
    else:
        break

# Specific cleanup for leftover sequences still present in this file.
replacements = {
    'Â': '',
    'â€™': "'", 'â€˜': "'", 'â€œ': '"', 'â€': '"',
    'â€”': '—', 'â€“': '–', 'â€¢': '•',
    'Ã€': 'À', 'Ã': 'Á', 'Ã„': 'Ä', 'Ã…': 'Å', 'Ã†': 'Æ', 'Ã‡': 'Ç', 'Ãˆ': 'È', 'Ã‰': 'É',
    'ÃŠ': 'Ê', 'Ã‹': 'Ë', 'ÃŒ': 'Ì', 'Ã': 'Í', 'ÃŽ': 'Î', 'Ã': 'Ï', 'Ã‘': 'Ñ', 'Ã’': 'Ò',
    'Ã“': 'Ó', 'Ã”': 'Ö', 'Ã•': 'Õ', 'Ã–': 'Ö', 'Ã™': 'Ù', 'Ãš': 'Ú', 'Ã›': 'Û', 'Ãœ': 'Ü',
    'Ã': 'Ý', 'Ãž': 'Þ', 'ÃŸ': 'ß', 'Ã ': 'à', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã¥': 'å', 'Ã§': 'ç', 'Ã¨': 'è', 'Ã©': 'é', 'Ãª': 'ê', 'Ã«': 'ë', 'Ã¬': 'ì', 'Ã­': 'í',
    'Ã®': 'î', 'Ã¯': 'ï', 'Ã±': 'ñ', 'Ã²': 'ò', 'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ã¹': 'ù', 'Ãº': 'ú', 'Ã»': 'û', 'Ã¼': 'ü', 'Ã½': 'ý', 'Ã¿': 'ÿ',
    'In attivitÃ ': 'In attività', 'NazionaleÃ': 'Nazionale',
    'nazionalitÃ ': 'nazionalità', 'NazionalitÃ ': 'Nazionalità', 'attivitÃ ': 'attività',
    'EtÃ€': 'Età', 'CITTÃ€': 'CITTÀ', 'Aggiungi ai preferiti': 'Aggiungi ai preferiti',
    'giocatori seguiti': 'giocatori seguiti', 'Rosa attiva NBA non aggiornata': 'Rosa attiva NBA non aggiornata',
    'Feed di una o piÃ¹ rose NBA non disponibile': 'Feed di una o più rose NBA non disponibile',
    'La rosa ricevuta Ã¨ incompleta': 'La rosa ricevuta è incompleta',
    'JokiÄ‡': 'Jokić', 'DonÄiÄ‡': 'Dončić', 'WÃ¼rzburg': 'Würzburg', 'Ã¨': 'è', 'Ã©': 'é', 'Ã²': 'ò', 'Ã¹': 'ù',
    'app.js charset cleanup': 'app.js charset cleanup'
}

for old, new in replacements.items():
    text = text.replace(old, new)

# Normalize leftover common issues in user-facing strings.
text = text.replace('In attivita\'', 'In attività')
text = text.replace('in attivita\'', 'in attività')
text = text.replace('Ã ', 'à ')
text = text.replace('Â·', '·')
text = text.replace('Dati demo', 'Dati demo')
text = text.replace('â†’', '→')
text = text.replace('â†»', '↗')
text = text.replace('â—', '●')
text = text.replace('â‡„', '⇄')
text = text.replace('Â°', '°')

path.write_text(text, encoding='utf-8')
print('fixed app.js mojibake')
