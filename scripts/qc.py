#!/usr/bin/env python3
"""Control de calidad del MP4 final, sin mirar imágenes: duración vs. voz, audio presente y con nivel, cuadros negros y cuadros congelados.
uso: $PY qc.py <work> [mp4]      (mp4 por defecto: <out_dir>/<NAME>.mp4 según config.json)
Imprime "QC OK ..." o una lista de avisos (⚠️); sale con 1 solo si faltan el archivo o el audio."""
import json,os,re,subprocess,sys

def ff(args):
    return subprocess.run(['ffmpeg','-hide_banner','-nostats','-v','info']+args,capture_output=True,text=True,errors='replace').stderr

def main(W,mp4=None):
    cfg=json.load(open(os.path.join(W,'config.json')))
    mp4=mp4 or os.path.join(cfg['out_dir'],cfg['name']+'.mp4')
    if not os.path.exists(mp4): print(f'✗ QC: no existe {mp4}'); return 1
    warn=[];hard=0
    pr=json.loads(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type','-of','json',mp4],capture_output=True,text=True,errors='replace').stdout or '{}')
    dur=float(pr.get('format',{}).get('duration') or 0);kinds=[s.get('codec_type') for s in pr.get('streams',[])]
    # duración esperada: fin de la voz + cola (la misma cuenta que render.js)
    try:
        exp=json.load(open(os.path.join(W,'timeline.json')))['total']
    except Exception:
        exp=json.load(open(os.path.join(W,'words.json')))['voice_end']+cfg.get('tail',1.6)
    if abs(dur-exp)>0.6: warn.append(f'duración {dur:.1f} s vs. {exp:.1f} s esperados (voz + cola)')
    if 'audio' not in kinds: warn.append('el MP4 no tiene audio');hard=1
    if 'video' not in kinds: warn.append('el MP4 no tiene video');hard=1
    lufs=None
    if 'audio' in kinds:
        o=ff(['-i',mp4,'-af','ebur128=peak=true','-vn','-f','null','-'])
        m=re.findall(r'I:\s+(-?[\d.]+)\s+LUFS',o)
        if m:
            lufs=float(m[-1])
            if lufs<-40: warn.append(f'audio casi mudo ({lufs:.1f} LUFS)');
            elif abs(lufs+14)>2: warn.append(f'sonoridad {lufs:.1f} LUFS (objetivo −14)')
    if 'video' in kinds:
        o=ff(['-i',mp4,'-an','-vf','blackdetect=d=0.4:pix_th=0.08,freezedetect=n=-60dB:d=3','-f','null','-'])
        for a,b in re.findall(r'black_start:([\d.]+)\s+black_end:([\d.]+)',o): warn.append(f'cuadros negros de {float(a):.1f} a {float(b):.1f} s')
        st=[float(x) for x in re.findall(r'freeze_start:\s*([\d.]+)',o)];du=[float(x) for x in re.findall(r'freeze_duration:\s*([\d.]+)',o)]
        du+=[dur-a for a in st[len(du):]]   # un congelado que llega hasta el final no trae "duration"
        for a,d in zip(st,du): warn.append(f'imagen congelada {d:.1f} s desde {a:.1f} s')
    if warn: print('QC: '+str(len(warn))+' aviso(s)\n'+'\n'.join('  ⚠️  '+x for x in warn))
    else: print(f'QC OK · {dur:.1f} s · audio {"%.1f LUFS"%lufs if lufs is not None else "sí"} · sin cuadros negros ni congelados')
    return hard

if __name__=='__main__':
    if len(sys.argv)<2 or sys.argv[1] in('-h','--help'): print(__doc__)
    else: sys.exit(main(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else None))
