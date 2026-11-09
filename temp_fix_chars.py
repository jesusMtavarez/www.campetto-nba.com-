from pathlib import Path
path = Path(r"c:\Users\jmt23\Desktop\app nba\app.js")
text = path.read_text(encoding="utf-8")
try:
    repaired = text.encode("latin-1").decode("utf-8")
    if "Ã" not in repaired and "Â" not in repaired and "â€" not in repaired:
        text = repaired
except Exception:
    pass
for old, new in [
    ("â€™", "'"), ("â€˜", "'"), ("â€œ", "\"") , ("â€M", "Í"), ("ÃŒ", "Ì"), ("Ã‘", "Ñ")
]:
    text = text.replace(old, new)
path.write_text(text, encoding="utf-8")
print("patched app.js charset cleanup")
