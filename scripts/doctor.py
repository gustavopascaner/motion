#!/usr/bin/env python3
"""Chequea que esté todo lo necesario para la skill motion (macOS y Windows). Sale con código 1 si falta algo.
uso: python3 -I doctor.py      (Windows: py -3 -I doctor.py)
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import os,subprocess,sys,glob
SK=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'));WIN=os.name=='nt'
VPY=os.path.join(SK,'.venv','Scripts','python.exe') if WIN else os.path.join(SK,'.venv','bin','python')
INST='powershell -ExecutionPolicy Bypass -File scripts\\install.ps1' if WIN else 'bash scripts/install.sh'
FIX={'ffmpeg':'winget install Gyan.FFmpeg' if WIN else 'brew install ffmpeg','node':'winget install OpenJS.NodeJS.LTS' if WIN else 'brew install node',
     'chrome':'winget install Google.Chrome' if WIN else 'brew install --cask google-chrome','deps':INST}
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
def ver(cmd):
    try: return subprocess.run(cmd,capture_output=True,text=True,errors='replace',timeout=30).stdout.strip().splitlines()[0]
    except Exception: return None
def chrome():
    L=os.environ.get('LOCALAPPDATA','');PF=os.environ.get('ProgramFiles',r'C:\Program Files');PF86=os.environ.get('ProgramFiles(x86)',r'C:\Program Files (x86)')
    c=[os.environ.get('CHROME'),'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium',
       os.path.join(PF,'Google','Chrome','Application','chrome.exe'),os.path.join(PF86,'Google','Chrome','Application','chrome.exe'),os.path.join(L,'Google','Chrome','Application','chrome.exe'),
       os.path.join(PF86,'Microsoft','Edge','Application','msedge.exe'),'/usr/bin/google-chrome','/usr/bin/chromium']
    return next((p for p in c if p and os.path.exists(p)),None)
rows=[];bad=0
def row(ok,name,info,fix=None,opt=False):
    global bad
    if not ok and not opt: bad+=1
    rows.append(f"{'✓' if ok else '·' if opt else '✗'} {name:24s} {info if ok or not fix else info+'  →  '+FIX.get(fix,fix)}")
v=ver(['ffmpeg','-version']);row(bool(v),'ffmpeg',v[:40] if v else 'no encontrado','ffmpeg')
v=ver(['node','--version']);row(bool(v) and int(v.lstrip('v').split('.')[0])>=18,'Node 18+',v or 'no encontrado','node')
ok=os.path.isdir(os.path.join(SK,'engine','node_modules','puppeteer-core'));row(ok,'Dependencias de Node','engine/node_modules' if ok else 'faltan','deps')
c=chrome();row(bool(c),'Google Chrome',c or 'no encontrado','chrome')
v=ver([VPY,'-c','import edge_tts;print(edge_tts.__version__)']) if os.path.exists(VPY) else None;row(bool(v),'Voz (edge-tts)',f'edge-tts {v} en .venv' if v else 'falta el entorno .venv','deps')
KF=os.path.expanduser('~/.config/motion/elevenlabs_key');ek=os.environ.get('ELEVENLABS_API_KEY') or (os.path.exists(KF) and os.path.getsize(KF)>10)
row(bool(ek),'ElevenLabs (opcional)',('clave en ELEVENLABS_API_KEY' if os.environ.get('ELEVENLABS_API_KEY') else 'clave en '+KF) if ek else 'sin clave (se usa edge-tts)',opt=True)
sd=[os.path.join(SK,'assets','sfx')]+[os.path.expanduser(f'~/{d}/skills/edicion/assets/sfx') for d in('.claude','.codex')]
n,where=next(((len(glob.glob(os.path.join(d,'*','*.wav'))),d) for d in sd if glob.glob(os.path.join(d,'*','*.wav'))),(0,''))
row(n>0,'Efectos de sonido',f'{n} archivos ({where})' if n else 'no hay (opcional: instalar la skill edicion o edicion-sfx.zip)',opt=True)
ng=len(glob.glob(os.path.expanduser('~/.config/motion/sfx/*/*.wav')));row(ng>0,'SFX generados (ElevenLabs)',f'{ng} en ~/.config/motion/sfx' if ng else 'ninguno todavía (sfx.py gen)',opt=True)
for d in('.claude','.codex'):   # la skill instalada tiene que ser un enlace a esta carpeta (una copia aparte se desincroniza)
    p=os.path.expanduser(f'~/{d}/skills/motion')
    if os.path.exists(p): same=os.path.realpath(p)==os.path.realpath(SK);row(same,f'Skill en ~/{d}',('enlazada a '+SK) if same else f'{p} es otra copia (no un enlace a {SK})','deps',opt=True)
ob=[x for x in os.listdir(os.path.join(SK,'brands')) if x!='editorial' and os.path.exists(os.path.join(SK,'brands',x,'brand.json'))] if os.path.isdir(os.path.join(SK,'brands')) else []
if ob: row(False,'Marcas propias',f"{', '.join(ob)} dentro de la skill: moverlas a ~/.config/motion/brands",'deps',opt=True)
print('\n'.join(rows));print('\nTodo listo ✓' if not bad else f'\nFaltan {bad} cosa(s): correr los comandos indicados.');sys.exit(1 if bad else 0)
