from pathlib import Path

path = Path(r'c:\Users\jmt23\Desktop\app nba\app.js')
text = path.read_text(encoding='utf-8')
out = []
i = 0
state = 'code'
while i < len(text):
    ch = text[i]

    if state == 'code':
        if ch == "'":
            state = 'single'
            out.append(ch)
            i += 1
            continue
        if ch == '"':
            state = 'double'
            out.append(ch)
            i += 1
            continue
        if ch == '`':
            state = 'template'
            out.append(ch)
            i += 1
            continue
        out.append(ch)
        i += 1
        continue

    if state == 'single':
        if ch == '\\':
            out.append(ch)
            i += 1
            if i < len(text):
                out.append(text[i])
                i += 1
            continue
        if ch == "'":
            j = i + 1
            while j < len(text) and text[j].isspace():
                j += 1
            if j < len(text) and (text[j].isalnum() or text[j] in ['_', '-', '/', '.', ':', ';', '?', '!', '"', "'"]):
                out.append("\\'")
                i += 1
                continue
            state = 'code'
            out.append(ch)
            i += 1
            continue
        out.append(ch)
        i += 1
        continue

    if state == 'double':
        if ch == '\\':
            out.append(ch)
            i += 1
            if i < len(text):
                out.append(text[i])
                i += 1
            continue
        if ch == '"':
            state = 'code'
            out.append(ch)
            i += 1
            continue
        out.append(ch)
        i += 1
        continue

    if state == 'template':
        if ch == '\\':
            out.append(ch)
            i += 1
            if i < len(text):
                out.append(text[i])
                i += 1
            continue
        if ch == '`':
            state = 'code'
            out.append(ch)
            i += 1
            continue
        out.append(ch)
        i += 1
        continue

path.write_text(''.join(out), encoding='utf-8')
print('fixed apostrophes in JS single-quoted strings')
