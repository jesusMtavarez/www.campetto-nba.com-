import urllib.request

text = urllib.request.urlopen('http://localhost:8001/app.js').read().decode('utf-8')
lines = text.splitlines()
for i in range(1, len(lines) + 1):
    s = '\n'.join(lines[:i])
    try:
        compile(s, '<app.js>', 'exec')
    except SyntaxError as e:
        print('FAILED at line', i, 'offset', e.offset, 'msg', e.msg)
        print(lines[i - 1])
        break
else:
    print('no syntax error in input prefix')
